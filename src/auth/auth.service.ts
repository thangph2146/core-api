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
   */ async findUserByEmail(email: string): Promise<IUser | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        role: {
          include: {
            permissions: true,
          },
        },
        profile: true,
      },
    });

    return user ? this.mapToInterface(user) : null;
  }
  /**
   * Find user by ID
   */ async findUserById(id: number): Promise<IUser | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        role: {
          include: {
            permissions: true,
          },
        },
        profile: true,
      },
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
   * Update user and profile
   */
  async updateUser(id: number, updateUserDto: UpdateUserDto): Promise<IUser> {
    const { bio, avatarUrl, socialLinks, ...userData } = updateUserDto;

    // Update user data
    const user = await this.prisma.user.update({
      where: { id },
      data: {
        ...userData,
        updatedAt: new Date(),
      },
      include: {
        role: true,
        profile: true,
      },
    });

    // Update or create profile if profile data is provided
    if (
      bio !== undefined ||
      avatarUrl !== undefined ||
      socialLinks !== undefined
    ) {
      await this.prisma.userProfile.upsert({
        where: { userId: id },
        update: {
          ...(bio !== undefined && { bio }),
          ...(avatarUrl !== undefined && { avatarUrl }),
          ...(socialLinks !== undefined && { socialLinks }),
          updatedAt: new Date(),
        },
        create: {
          userId: id,
          bio: bio || null,
          avatarUrl: avatarUrl || null,
          socialLinks: socialLinks || null,
        },
      });

      // Fetch updated user with profile
      const updatedUser = await this.prisma.user.findUnique({
        where: { id },
        include: {
          role: true,
          profile: true,
        },
      });

      return this.mapToInterface(updatedUser!);
    }

    return this.mapToInterface(user);
  }
  /**
   * Authenticate user with credentials
   */
  async validateCredentials(
    email: string,
    password: string,
  ): Promise<IUser | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        role: {
          include: {
            permissions: true,
          },
        },
        profile: true,
      },
    });

    if (!user || !user.hashedPassword) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.hashedPassword);
    if (!isPasswordValid) {
      return null;
    }

    return this.mapToInterface(user);
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
  }
  /**
   * Check if user exists by email
   */ async userExists(email: string): Promise<boolean> {
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
   */ private mapToInterface(user: any): IUser {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image,
      avatarUrl: user.avatarUrl || user.profile?.avatarUrl,
      emailVerified: user.emailVerified,
      provider: user.provider,
      providerId: user.providerId,
      roleId: user.roleId,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      profile: user.profile
        ? {
            id: user.profile.id,
            userId: user.profile.userId,
            bio: user.profile.bio,
            avatarUrl: user.profile.avatarUrl,
            socialLinks: user.profile.socialLinks,
            createdAt: user.profile.createdAt,
            updatedAt: user.profile.updatedAt,
          }
        : undefined,
      role: user.role
        ? {
            id: user.role.id,
            name: user.role.name,
            description: user.role.description,
            permissions:
              user.role.permissions?.map(
                (permission: any) => permission.name,
              ) || [],
          }
        : undefined,
    };
  }
}
