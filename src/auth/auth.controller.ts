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
} from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  CreateUserDto,
  UpdateUserDto,
  AuthCredentialsDto,
  GoogleUserDto,
} from './dto/auth.dto';

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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
}
