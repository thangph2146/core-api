import {
  Injectable,
  Logger,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateUserDto,
  UpdateUserDto,
  GoogleUserDto,
} from './dto/auth.dto';
import * as bcrypt from 'bcryptjs';
import { User } from '@prisma/client';
import { SessionService } from './session.service';
import { JwtService } from './jwt.service';

// Define a type for the user object without the password.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type SafeUser = Omit<User, 'hashedPassword' | 'passwordResetToken'>;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly sessionService: SessionService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Creates a 'safe' user object by removing sensitive fields.
   * @param user The full user object from Prisma.
   * @returns A user object without the hashed password.
   */
  private getSafeUser(user: User): SafeUser {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { hashedPassword, passwordResetToken, ...safeUser } = user;
    return safeUser;
  }

  /**
   * Find user by email, returning the full Prisma User object.
   */
  async findUserByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
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
  }

  /**
   * Find user by ID, returning the full Prisma User object.
   */
  async findUserById(id: number): Promise<User | null> {
    return this.prisma.user.findUnique({
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
  }

  /**
   * Create a new user.
   */
  async createUser(createUserDto: CreateUserDto): Promise<User> {
    const { password, ...userData } = createUserDto;

    const hashedPassword = password ? await bcrypt.hash(password, 12) : null;

    return this.prisma.user.create({
      data: {
        ...userData,
        hashedPassword,
      },
    });
  }

  /**
   * Update user and profile.
   */
  async updateUser(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    const { bio, avatarUrl, socialLinks, ...userData } = updateUserDto;

    // First, ensure the user exists
    const existingUser = await this.prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      throw new NotFoundException(`User with ID ${id} not found.`);
    }

    await this.prisma.user.update({
      where: { id },
      data: {
        ...userData,
        updatedAt: new Date(),
      },
    });

    if (
      bio !== undefined ||
      avatarUrl !== undefined ||
      socialLinks !== undefined
    ) {
      await this.prisma.userProfile.upsert({
        where: { userId: id },
        update: {
          bio,
          avatarUrl,
          socialLinks,
          updatedAt: new Date(),
        },
        create: {
          userId: id,
          bio,
          avatarUrl,
          socialLinks,
        },
      });
    }

    // Return the fully updated user with relations
    const updatedUser = await this.findUserById(id);
    if (!updatedUser) {
      // This should theoretically never happen if the initial check passes
      throw new NotFoundException(`User with ID ${id} disappeared during update.`);
    }
    return updatedUser;
  }

  /**
   * Authenticate user with credentials.
   * Returns the full user object on success, including hashed password for internal use.
   */
  async validateCredentials(
    email: string,
    password?: string,
  ): Promise<User | null> {
    const user = await this.findUserByEmail(email);

    if (!user) return null;

    // Support for passwordless sign-in (e.g., Google)
    if (!password) {
      return user.hashedPassword ? null : user;
    }

    if (!user.hashedPassword) return null;

    const isPasswordValid = await bcrypt.compare(password, user.hashedPassword);
    return isPasswordValid ? user : null;
  }

  /**
   * Find or create a user from a Google login.
   */
  async findOrCreateGoogleUser(googleUserDto: GoogleUserDto): Promise<User> {
    const existingUser = await this.findUserByEmail(googleUserDto.email);

    if (existingUser) {
      return existingUser;
    }

    return this.createUser({
      email: googleUserDto.email,
      name: googleUserDto.name,
      image: googleUserDto.image,
      emailVerified: googleUserDto.emailVerified ? new Date() : undefined,
      provider: 'google',
      providerId: googleUserDto.providerId,
    });
  }

  /**
   * Check if a user exists by email.
   */
  async userExists(email: string): Promise<boolean> {
    if (!email) return false;
    const userCount = await this.prisma.user.count({ where: { email } });
    return userCount > 0;
  }

  /**
   * Refreshes a user's session using a refresh token (session ID).
   * Implements a rotating refresh token strategy.
   */
  async refreshUserToken(oldRefreshToken: string): Promise<{
    user: User;
    accessToken: string;
    refreshToken: string; // This is the new session ID
  }> {
    if (!oldRefreshToken) {
      throw new UnauthorizedException('Refresh token not found');
    }

    const oldSession = await this.sessionService.getSession(oldRefreshToken);
    if (!oldSession) {
      // It's important to delete the session if it's invalid or expired
      await this.sessionService.deleteSession(oldRefreshToken);
      throw new UnauthorizedException('Invalid or expired session');
    }

    // Concurrently delete old session and get user
    const [_, user] = await Promise.all([
      this.sessionService.deleteSession(oldSession.id),
      this.findUserById(oldSession.userId),
    ]);

    if (!user) {
      throw new NotFoundException('User for this session not found');
    }

    // Create a new session (which gives a new refresh token)
    const newSession = await this.sessionService.createSession(user.id);

    // Create a new access token
    const accessToken = this.jwtService.generateAccessToken(user);

    return {
      user,
      accessToken,
      refreshToken: newSession.id,
    };
  }
}
