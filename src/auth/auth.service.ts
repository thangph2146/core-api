import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateUserDto,
  UpdateUserDto,
  GoogleUserDto,
  IUser,
} from './dto/auth.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find user by email
   */
  async findUserByEmail(email: string): Promise<IUser | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    return user ? this.mapToInterface(user) : null;
  }

  /**
   * Find user by ID
   */
  async findUserById(id: number): Promise<IUser | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    return user ? this.mapToInterface(user) : null;
  }
  /**
   * Create new user
   */
  async createUser(createUserDto: CreateUserDto): Promise<IUser> {
    const { password, ...userData } = createUserDto;

    let hashedPassword: string | undefined;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 12);
    }

    const user = await this.prisma.user.create({
      data: {
        ...userData,
        hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return this.mapToInterface(user);
  }

  /**
   * Update user
   */
  async updateUser(id: number, updateUserDto: UpdateUserDto): Promise<IUser> {
    const user = await this.prisma.user.update({
      where: { id },
      data: {
        ...updateUserDto,
        updatedAt: new Date(),
      },
    });

    return this.mapToInterface(user);
  }
  /**
   * Authenticate user with credentials
   */
  async validateCredentials(
    email: string,
    password: string,
  ): Promise<IUser | null> {
    const user = await this.findUserByEmail(email);

    if (!user || !user.password) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return null;
    }

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword as IUser;
  }

  /**
   * Find or create Google user
   */
  async findOrCreateGoogleUser(googleUserDto: GoogleUserDto): Promise<IUser> {
    // Try to find existing user by email
    let user = await this.findUserByEmail(googleUserDto.email);

    if (user) {
      // Update existing user with Google info if needed
      if (!user.provider || user.provider !== 'google') {
        user = await this.updateUser(user.id, {
          name: googleUserDto.name || user.name,
          image: googleUserDto.image || user.image,
          emailVerified: googleUserDto.emailVerified || user.emailVerified,
        });
      }
    } else {
      // Create new user
      user = await this.createUser({
        email: googleUserDto.email,
        name: googleUserDto.name,
        image: googleUserDto.image,
        provider: googleUserDto.provider,
        providerId: googleUserDto.providerId,
        emailVerified: googleUserDto.emailVerified,
      });
    }

    return user;
  } /**
   * Check if user exists by email
   */  async userExists(email: string): Promise<boolean> {
    this.logger.debug(`userExists called with email: ${email}`);

    if (!email) {
      this.logger.warn('Email is empty or undefined');
      return false;
    }

    try {
      const user = await this.prisma.user.findUnique({
        where: { email },
        select: { id: true },
      });

      this.logger.debug(`User found: ${!!user}`);
      return !!user;
    } catch (error) {
      this.logger.error('Error in userExists:', error);
      throw error;
    }
  }
  /**
   * Map Prisma user to interface
   */
  private mapToInterface(user: any): IUser {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image || user.avatarUrl,
      emailVerified: user.emailVerified,
      password: user.hashedPassword,
      provider: user.provider,
      providerId: user.providerId,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
