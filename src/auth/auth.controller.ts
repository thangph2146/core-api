import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Param,
  Query,
  HttpException,
  HttpStatus,
  Headers,
  Res,
  Req,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { JwtService } from './jwt.service';
import { SessionService } from './session.service';
import {
  CreateUserDto,
  UpdateUserDto,
  AuthCredentialsDto,
  GoogleUserDto,
} from './dto/auth.dto';

@Controller('api/auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
    private readonly sessionService: SessionService,
  ) {}

  /**
   * Create new user
   */
  @Post('user')
  async createUser(@Body() createUserDto: CreateUserDto) {
    try {
      // Check if user already exists
      const existingUser = await this.authService.userExists(
        createUserDto.email,
      );
      if (existingUser) {
        throw new HttpException(
          'User with this email already exists',
          HttpStatus.CONFLICT,
        );
      }

      const user = await this.authService.createUser(createUserDto);

      // Return user without password
      const { password, ...userWithoutPassword } = user;
      return {
        success: true,
        data: userWithoutPassword,
        message: 'User created successfully',
      };
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error.message || 'Failed to create user',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get user by email
   */
  @Get('user/email/:email')
  async getUserByEmail(@Param('email') email: string) {
    try {
      const user = await this.authService.findUserByEmail(email);

      if (!user) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }

      // Return user without password
      const { password, ...userWithoutPassword } = user;
      return {
        success: true,
        data: userWithoutPassword,
      };
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error.message || 'Failed to get user',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get user by ID
   */
  @Get('user/:id')
  async getUserById(@Param('id') id: string) {
    try {
      const user = await this.authService.findUserById(parseInt(id));

      if (!user) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }

      // Return user without password
      const { password, ...userWithoutPassword } = user;
      return {
        success: true,
        data: userWithoutPassword,
      };
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error.message || 'Failed to get user',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Update user
   */
  @Put('user/:id')
  async updateUser(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    try {
      const user = await this.authService.updateUser(
        parseInt(id),
        updateUserDto,
      );

      // Return user without password
      const { password, ...userWithoutPassword } = user;
      return {
        success: true,
        data: userWithoutPassword,
        message: 'User updated successfully',
      };
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Failed to update user',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Validate user credentials
   */
  @Post('validate-credentials')
  async validateCredentials(@Body() credentials: AuthCredentialsDto) {
    try {
      const { email, password } = credentials;
      const user = await this.authService.validateCredentials(email, password);

      if (!user) {
        throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
      }

      return {
        success: true,
        data: user,
        message: 'Credentials validated successfully',
      };
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error.message || 'Validation failed',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Find or create Google user
   */
  @Post('google/user')
  async findOrCreateGoogleUser(@Body() googleUserDto: GoogleUserDto) {
    try {
      const user = await this.authService.findOrCreateGoogleUser(googleUserDto);

      // Return user without password
      const { password, ...userWithoutPassword } = user;
      return {
        success: true,
        data: userWithoutPassword,
        message: 'Google user processed successfully',
      };
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Failed to process Google user',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Check if user exists
   */
  @Get('user/exists')
  async checkUserExists(@Query('email') email: string) {
    try {
      if (!email) {
        throw new HttpException('Email is required', HttpStatus.BAD_REQUEST);
      }

      const exists = await this.authService.userExists(email);
      return {
        success: true,
        data: { exists },
        message: exists ? 'User exists' : 'User does not exist',
      };
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error.message || 'Failed to check user existence',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Sign in with credentials
   */
  @Post('signin')
  async signIn(
    @Body() credentials: AuthCredentialsDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    try {
      const { email, password } = credentials;
      const user = await this.authService.validateCredentials(email, password);

      if (!user) {
        throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
      }

      // Generate JWT tokens
      const tokens = this.jwtService.generateTokens(user);

      // Create session
      const session = await this.sessionService.createSession(user.id);

      // Set HTTP-only cookies
      response.cookie('accessToken', tokens.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000, // 15 minutes
      });

      response.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      response.cookie('sessionId', session.id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      return {
        success: true,
        data: {
          user,
          tokens,
          sessionId: session.id,
        },
        message: 'Sign in successful',
      };
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error.message || 'Sign in failed',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Sign out
   */
  @Post('signout')
  async signOut(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    try {
      const sessionId = request.cookies?.sessionId;

      if (sessionId) {
        // Delete session from database
        await this.sessionService.deleteSession(sessionId);
      }

      // Clear cookies
      response.clearCookie('accessToken');
      response.clearCookie('refreshToken');
      response.clearCookie('sessionId');

      return {
        success: true,
        message: 'Sign out successful',
      };
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error.message || 'Sign out failed',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Refresh access token
   */
  @Post('refresh')
  async refreshToken(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    try {
      const refreshToken = request.cookies?.refreshToken;

      if (!refreshToken) {
        throw new HttpException(
          'Refresh token not found',
          HttpStatus.UNAUTHORIZED,
        );
      }

      const newAccessToken = this.jwtService.refreshAccessToken(refreshToken);

      // Set new access token cookie
      response.cookie('accessToken', newAccessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000, // 15 minutes
      });

      return {
        success: true,
        data: { accessToken: newAccessToken },
        message: 'Token refreshed successfully',
      };
    } catch (error: any) {
      // Clear cookies if refresh fails
      response.clearCookie('accessToken');
      response.clearCookie('refreshToken');
      response.clearCookie('sessionId');

      throw new HttpException(
        error.message || 'Token refresh failed',
        HttpStatus.UNAUTHORIZED,
      );
    }
  }
  /**
   * Get current user profile
   */
  @Get('me')
  async getCurrentUser(
    @Headers('authorization') authHeader: string,
    @Req() request: Request,
  ) {
    try {
      let token: string | undefined;

      // Try Authorization header first
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      } else if (request.cookies?.accessToken) {
        // Fallback to cookie
        token = request.cookies.accessToken;
      }

      if (!token) {
        throw new HttpException(
          'Access token not found',
          HttpStatus.UNAUTHORIZED,
        );
      }

      const payload = this.jwtService.verifyAccessToken(token);
      const user = await this.authService.findUserById(payload.userId);

      if (!user) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }

      // Return user without password
      const { password, ...userWithoutPassword } = user;
      return {
        success: true,
        data: userWithoutPassword,
      };
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error.message || 'Failed to get current user',
        HttpStatus.UNAUTHORIZED,
      );
    }
  }

  /**
   * Verify session
   */
  @Get('verify-session')
  async verifySession(@Req() request: Request) {
    try {
      const sessionId = request.cookies?.sessionId;

      if (!sessionId) {
        throw new HttpException('Session not found', HttpStatus.UNAUTHORIZED);
      }

      const session = await this.sessionService.getSession(sessionId);

      if (!session) {
        throw new HttpException(
          'Invalid or expired session',
          HttpStatus.UNAUTHORIZED,
        );
      }

      const user = await this.authService.findUserById(session.userId);

      if (!user) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }

      // Return user without password
      const { password, ...userWithoutPassword } = user;
      return {
        success: true,
        data: {
          user: userWithoutPassword,
          session: {
            id: session.id,
            expiresAt: session.expiresAt,
          },
        },
      };
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error.message || 'Session verification failed',
        HttpStatus.UNAUTHORIZED,
      );
    }
  }

  /**
   * Validate session/token
   */
  @Get('validate')
  async validateAuth(@Req() request: Request) {
    try {
      const sessionId = request.cookies?.sessionId;

      if (!sessionId) {
        return {
          success: true,
          valid: false,
          message: 'No session found',
        };
      }

      const session = await this.sessionService.getSession(sessionId);

      if (!session) {
        return {
          success: true,
          valid: false,
          message: 'Invalid or expired session',
        };
      }

      const user = await this.authService.findUserById(session.userId);

      if (!user) {
        return {
          success: true,
          valid: false,
          message: 'User not found',
        };
      }

      return {
        success: true,
        valid: true,
        message: 'Session is valid',
      };
    } catch (error: any) {
      return {
        success: true,
        valid: false,
        message: 'Validation failed',
      };
    }
  }

  /**
   * Update current user profile
   */
  @Put('me')
  async updateProfile(
    @Headers('authorization') authHeader: string,
    @Req() request: Request,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    try {
      let token: string | undefined;

      // Try Authorization header first
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      } else if (request.cookies?.accessToken) {
        // Fallback to cookie
        token = request.cookies.accessToken;
      }

      if (!token) {
        throw new HttpException(
          'Access token not found',
          HttpStatus.UNAUTHORIZED,
        );
      }

      const payload = this.jwtService.verifyAccessToken(token);

      // Update the user
      const updatedUser = await this.authService.updateUser(payload.userId, updateUserDto);

      if (!updatedUser) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }

      // Return user without password
      const { password, ...userWithoutPassword } = updatedUser;      return {
        success: true,
        data: userWithoutPassword,
        message: 'Profile updated successfully',
      };
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error.message || 'Failed to update profile',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
