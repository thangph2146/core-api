import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Query,
  HttpStatus,
  Res,
  Req,
  UseGuards,
  HttpCode,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { JwtService } from './jwt.service';
import { SessionService } from './session.service';
import { Public } from '../common/decorators/permissions.decorator';
import {
  CreateUserDto,
  UpdateUserDto,
  AuthCredentialsDto,
} from './dto/auth.dto';
import { AuthGuard } from './auth.guard';
import { AuthenticatedRequest } from 'src/common/interfaces';
import { User } from '@prisma/client';

/**
 * Strips sensitive fields from the user object before sending it to the client.
 * @param user The full user object from Prisma.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const getSafeUser = (user: User) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { hashedPassword, passwordResetToken, ...safeUser } = user;
  return safeUser;
};

@Controller('auth')
@UseGuards(AuthGuard)
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
    private readonly sessionService: SessionService,
  ) {}

  /**
   * Register a new user. This is a public endpoint.
   */
  @Public()
  @Post('register')
  async register(@Body() createUserDto: CreateUserDto) {
    const user = await this.authService.createUser(createUserDto);
    return {
      success: true,
      data: getSafeUser(user),
      message: 'User created successfully',
    };
  }

  /**
   * Check if a user exists. This is a public endpoint.
   */
  @Public()
  @Get('exists')
  async checkUserExists(@Query('email') email: string) {
    const exists = await this.authService.userExists(email);
    return {
      success: true,
      data: { exists },
    };
  }

  /**
   * Sign in with credentials. This is a public endpoint.
   */
  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(
    @Body() credentials: AuthCredentialsDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const { email, password } = credentials;
    const user = await this.authService.validateCredentials(email, password);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const accessToken = this.jwtService.generateAccessToken(user);
    const session = await this.sessionService.createSession(user.id); // This ID is the refresh token

    response.cookie('refreshToken', session.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      sameSite: 'strict',
      path: '/',
    });

    return {
      success: true,
      data: { user: getSafeUser(user), accessToken },
      message: 'Logged in successfully',
    };
  }

  /**
   * Sign out and clear the session cookie.
   */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const refreshToken = request.cookies?.refreshToken;
    if (refreshToken) {
      await this.sessionService.deleteSession(refreshToken);
    }
    response.clearCookie('refreshToken', { path: '/' });
    return {
      success: true,
      message: 'Logged out successfully',
    };
  }

  /**
   * Generate a new access token using a refresh token (session ID).
   */
  @Public()
  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  async refreshToken(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const oldRefreshToken = request.cookies?.refreshToken;
    if (!oldRefreshToken) {
      throw new UnauthorizedException('Refresh token not found');
    }

    const { user, accessToken, refreshToken: newRefreshToken } =
      await this.authService.refreshUserToken(oldRefreshToken);

    response.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      sameSite: 'strict',
      path: '/',
    });

    return {
      success: true,
      data: { user: getSafeUser(user), accessToken },
      message: 'Token refreshed successfully',
    };
  }

  /**
   * Get the profile of the currently authenticated user.
   */
  @Get('me')
  async getMyProfile(@Req() request: AuthenticatedRequest) {
    const user = await this.authService.findUserById(request.user.id);
    if (!user) {
      // This should not happen if the token is valid
      throw new NotFoundException('Authenticated user not found in database.');
    }
    return {
      success: true,
      data: getSafeUser(user),
    };
  }

  /**
   * Update the profile of the currently authenticated user.
   */
  @Put('me')
  async updateMyProfile(
    @Req() request: AuthenticatedRequest,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    const updatedUser = await this.authService.updateUser(
      request.user.id,
      updateUserDto,
    );
    return {
      success: true,
      data: getSafeUser(updatedUser),
      message: 'Profile updated successfully',
    };
  }
}
