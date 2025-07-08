import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  InternalServerErrorException,
  UnauthorizedException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateUserDto,
  UpdateUserDto,
  UpdateProfileDto,
  AdminUserQueryDto,
  UserQueryDto,
  UserResponseDto,
  UserListResponseDto,
  UserMetaResponseDto,
  UserStatsDto,
  UserOptionDto,
  BulkDeleteResponseDto,
  BulkRestoreResponseDto,
  BulkPermanentDeleteResponseDto,
  ChangePasswordDto,
} from './dto/user.dto';
import { SessionService } from '../auth/session.service';
import { Prisma, User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/**
 * Full user type với tất cả relations
 */
type FullUser = User & {
  role?: {
    id: number;
    name: string;
    description: string | null;
    permissions?: {
      id: number;
      name: string;
      description: string | null;
    }[];
  } | null;
  profile?: {
    id: number;
    bio: string | null;
    avatarUrl: string | null;
    socialLinks: Prisma.JsonValue;
    createdAt: Date;
    updatedAt: Date;
    phone?: string | null;
  } | null;
  accounts?: {
    id: string;
    provider: string;
    type: string;
    providerAccountId: string;
  }[];
  _count?: {
    blogs: number;
    medias: number;
    recruitments: number;
    likedBlogs?: number;
    bookmarkedBlogs?: number;
    blogComments?: number;
    contactSubmissionResponses?: number;
  };
};

/**
 * Filter options cho user queries
 */
interface UserFilterOptions {
  search?: string;
  roleId?: number;
  includeDeleted?: boolean;
  deleted?: boolean;
}

/**
 * Sort options cho user queries
 */
interface UserSortOptions {
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

/**
 * Pagination options
 */
interface PaginationOptions {
  page: number;
  limit: number;
}

/**
 * Bulk operation result
 */
interface BulkOperationResult {
  successCount: number;
  failedIds: number[];
  errors: string[];
}

// =============================================================================
// CONSTANTS & CONFIGURATIONS
// =============================================================================

const SALT_ROUNDS = 12;
const PASSWORD_RESET_TOKEN_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours
const DEFAULT_PAGE_SIZE = 10;
const MAX_BULK_OPERATION_SIZE = 100;

/**
 * Default includes cho các query cơ bản
 */
const DEFAULT_INCLUDES = {
  role: {
    select: {
      id: true,
      name: true,
      description: true,
    },
  },
  _count: {
    select: {
      blogs: true,
      medias: true,
      recruitments: true,
    },
  },
} as const;

/**
 * Detailed includes cho detailed queries
 */
const DETAILED_INCLUDES = {
  role: {
    include: {
      permissions: {
        where: { deletedAt: null },
        select: {
          id: true,
          name: true,
          description: true,
        },
      },
    },
  },
  profile: {
    select: {
      id: true,
      bio: true,
      avatarUrl: true,
      socialLinks: true,
      createdAt: true,
      updatedAt: true,
      phone: true,
    },
  },
  accounts: {
    select: {
      id: true,
      provider: true,
      type: true,
      providerAccountId: true,
    },
  },
  _count: {
    select: {
      blogs: true,
      medias: true,
      recruitments: true,
      likedBlogs: true,
      bookmarkedBlogs: true,
      blogComments: true,
      contactSubmissionResponses: true,
    },
  },
} as const;

/**
 * Export includes cho export functionality
 */
const EXPORT_INCLUDES = {
  role: {
    select: {
      id: true,
      name: true,
      description: true,
    },
  },
  profile: {
    select: {
      id: true,
      bio: true,
      avatarUrl: true,
      socialLinks: true,
      createdAt: true,
      updatedAt: true,
      phone: true,
    },
  },
  _count: {
    select: {
      blogs: true,
      medias: true,
      recruitments: true,
    },
  },
} as const;

/**
 * UserService - Business Logic Layer
 * 
 * Service này xử lý tất cả business logic liên quan đến User management:
 * - CRUD operations với validation
 * - Bulk operations với error handling
 * - Password management và security
 * - User statistics và reporting
 * - Data transformation và formatting
 * 
 * @version 2.0.0
 * @author PHGroup Development Team
 */
@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    private prisma: PrismaService,
    private sessionService: SessionService,
  ) {
    this.logger.log('🚀 UserService initialized');
  }

  // =============================================================================
  // PRIVATE HELPER METHODS
  // =============================================================================

  /**
   * Hash password using bcrypt
   */
  private async hashPassword(password: string): Promise<string> {
    try {
      return await bcrypt.hash(password, SALT_ROUNDS);
    } catch (error) {
      this.logger.error('Error hashing password:', error);
      throw new InternalServerErrorException('Failed to hash password');
    }
  }

  /**
   * Compare password with hash
   */
  private async comparePassword(
    password: string,
    hash: string,
  ): Promise<boolean> {
    try {
      return await bcrypt.compare(password, hash);
    } catch (error) {
      this.logger.error('Error comparing password:', error);
      throw new InternalServerErrorException('Failed to compare password');
    }
  }

  /**
   * Generate secure token for password reset
   */
  private generateSecureToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Validate user IDs array
   */
  private validateUserIds(userIds: (number | string)[]): number[] {
    if (!Array.isArray(userIds) || userIds.length === 0) {
      throw new BadRequestException('User IDs array is required and cannot be empty');
    }

    if (userIds.length > MAX_BULK_OPERATION_SIZE) {
      throw new BadRequestException(
        `Cannot process more than ${MAX_BULK_OPERATION_SIZE} users at once`,
      );
    }

    const validIds = userIds
      .map((id) => (typeof id === 'string' ? parseInt(id, 10) : id))
      .filter((id) => !isNaN(id) && id > 0);

    if (validIds.length === 0) {
      throw new BadRequestException('No valid user IDs provided');
    }

    return validIds;
  }

  /**
   * Validate role exists
   */
  private async validateRole(roleId: number): Promise<void> {
    const role = await this.prisma.role.findFirst({
      where: { id: roleId, deletedAt: null },
    });

    if (!role) {
      throw new NotFoundException(`Role with ID ${roleId} not found`);
    }
  }

  /**
   * Validate email uniqueness
   */
  private async validateEmailUnique(
    email: string,
    excludeUserId?: number,
  ): Promise<void> {
    const existingUser = await this.prisma.user.findFirst({
      where: {
        email: email.toLowerCase(),
        ...(excludeUserId && { id: { not: excludeUserId } }),
      },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }
  }

  /**
   * Validate password strength
   */
  private validatePasswordStrength(password: string): void {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (password.length < minLength) {
      throw new BadRequestException(`Password must be at least ${minLength} characters long`);
    }

    if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
      throw new BadRequestException(
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
      );
    }
  }

  /**
   * Format user response
   */
  private formatUserResponse(user: FullUser): UserResponseDto {
    const { hashedPassword, passwordResetToken, passwordResetTokenExpiry, metaTitle, metaDescription, ...userResponse } = user;
    return userResponse as UserResponseDto;
  }

  /**
   * Build where clause for filtering
   */
  private buildWhereClause(filters: UserFilterOptions): Prisma.UserWhereInput {
    const where: Prisma.UserWhereInput = {};

    // Apply deleted filter
    this.applyDeletedFilter(where, filters);

    // Apply search filter
    if (filters.search) {
      this.applySearchFilter(where, filters.search);
    }

    // Apply role filter
    if (filters.roleId) {
      this.applyRoleFilter(where, filters.roleId);
    }

    return where;
  }

  /**
   * Apply deleted filter to where clause
   */
  private applyDeletedFilter(
    where: Prisma.UserWhereInput,
    filters: UserFilterOptions,
  ): void {
    if (filters.deleted) {
      where.deletedAt = { not: null };
    } else if (filters.includeDeleted) {
      // Include both deleted and active users
    } else {
      where.deletedAt = null;
    }
  }

  /**
   * Apply search filter to where clause
   */
  private applySearchFilter(
    where: Prisma.UserWhereInput,
    search?: string,
  ): void {
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }
  }

  /**
   * Apply role filter to where clause
   */
  private applyRoleFilter(where: Prisma.UserWhereInput, roleId?: number): void {
    if (roleId) {
      where.roleId = roleId;
    }
  }

  /**
   * Build order by clause
   */
  private buildOrderByClause(
    sort: UserSortOptions,
  ): Prisma.UserOrderByWithRelationInput {
    const orderBy: Prisma.UserOrderByWithRelationInput = {};

    switch (sort.sortBy) {
      case 'role':
        orderBy.role = { name: sort.sortOrder };
        break;
      case 'email':
        orderBy.email = sort.sortOrder;
        break;
      case 'name':
        orderBy.name = sort.sortOrder;
        break;
      case 'createdAt':
        orderBy.createdAt = sort.sortOrder;
        break;
      case 'updatedAt':
        orderBy.updatedAt = sort.sortOrder;
        break;
      case 'deletedAt':
        orderBy.deletedAt = sort.sortOrder;
        break;
      default:
        orderBy.createdAt = sort.sortOrder;
    }

    return orderBy;
  }

  /**
   * Calculate pagination metadata
   */
  private calculateMeta(
    total: number,
    page: number,
    limit: number,
  ): UserMetaResponseDto {
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrevious = page > 1;

    return {
      total,
      page,
      limit,
      totalPages,
      hasNext,
      hasPrevious,
    };
  }

  // =============================================================================
  // PUBLIC METHODS
  // =============================================================================

  /**
   * Find all users with filtering and pagination (Admin)
   */
  async findAll(query: AdminUserQueryDto, currentUserId?: number): Promise<UserListResponseDto> {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      includeDeleted = false,
      deleted = false,
      roleId,
    } = query;

    try {
      const filters: UserFilterOptions = {
        search,
        roleId,
        includeDeleted,
        deleted,
      };

      const where = this.buildWhereClause(filters);
      
      // Exclude current user from results
      if (currentUserId) {
        where.id = {
          not: currentUserId,
        };
      }

      const orderBy = this.buildOrderByClause({ sortBy, sortOrder });

      const [users, total] = await Promise.all([
        this.prisma.user.findMany({
          where,
          include: DEFAULT_INCLUDES,
          orderBy,
          skip: (page - 1) * limit,
          take: limit,
        }),
        this.prisma.user.count({ where }),
      ]);

      const formattedUsers = users.map((user) => this.formatUserResponse(user));
      const meta = this.calculateMeta(total, page, limit);

      return {
        data: formattedUsers,
        meta,
      };
    } catch (error) {
      this.logger.error('Error finding users:', error);
      throw new InternalServerErrorException('Failed to fetch users');
    }
  }

  /**
   * Find users for public endpoints
   */
  async findPublic(query: UserQueryDto): Promise<UserListResponseDto> {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      roleId,
    } = query;

    try {
      const filters: UserFilterOptions = {
        search,
        roleId,
        includeDeleted: false,
        deleted: false,
      };

      const where = this.buildWhereClause(filters);
      const orderBy = this.buildOrderByClause({ sortBy, sortOrder });

      const [users, total] = await Promise.all([
        this.prisma.user.findMany({
          where,
          include: DEFAULT_INCLUDES,
          orderBy,
          skip: (page - 1) * limit,
          take: limit,
        }),
        this.prisma.user.count({ where }),
      ]);

      const formattedUsers = users.map((user) => this.formatUserResponse(user));
      const meta = this.calculateMeta(total, page, limit);

      return {
        data: formattedUsers,
        meta,
      };
    } catch (error) {
      this.logger.error('Error finding public users:', error);
      throw new InternalServerErrorException('Failed to fetch public users');
    }
  }

  /**
   * Find user by ID
   */
  async findOne(id: number): Promise<UserResponseDto> {
    try {
      const user = await this.prisma.user.findFirst({
        where: { id, deletedAt: null },
        include: DETAILED_INCLUDES,
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      return this.formatUserResponse(user);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Error finding user ${id}:`, error);
      throw new InternalServerErrorException('Failed to fetch user');
    }
  }

  /**
   * Get user statistics
   */
  async getStats(): Promise<UserStatsDto> {
    try {
      const [
        totalUsers,
        activeUsers,
        deletedUsers,
        usersWithRoles,
        usersWithoutRoles,
        recentUsers,
      ] = await Promise.all([
        this.prisma.user.count(),
        this.prisma.user.count({ where: { deletedAt: null } }),
        this.prisma.user.count({ where: { deletedAt: { not: null } } }),
        this.prisma.user.count({ where: { roleId: { not: null }, deletedAt: null } }),
        this.prisma.user.count({ where: { roleId: null, deletedAt: null } }),
        this.prisma.user.count({
          where: {
            createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
            deletedAt: null,
          },
        }),
      ]);

      return {
        totalUsers,
        activeUsers,
        deletedUsers,
        usersWithRoles,
        usersWithoutRoles,
        recentUsers,
      };
    } catch (error) {
      this.logger.error('Error getting user stats:', error);
      throw new InternalServerErrorException('Failed to get user statistics');
    }
  }

  /**
   * Get user options for select dropdown
   */
  async getOptions(): Promise<UserOptionDto[]> {
    try {
      const users = await this.prisma.user.findMany({
        where: { deletedAt: null },
        select: {
          id: true,
          name: true,
          email: true,
        },
        orderBy: { name: 'asc' },
      });

      return users.map((user) => ({
        value: user.id,
        label: user.name ? `${user.name} (${user.email})` : user.email,
      }));
    } catch (error) {
      this.logger.error('Error getting user options:', error);
      throw new InternalServerErrorException('Failed to get user options');
    }
  }

  /**
   * Create new user
   */
  async create(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    const { email, password, roleId, ...userData } = createUserDto;

    try {
      // Validate email uniqueness
      await this.validateEmailUnique(email);

      // Validate role if provided
      if (roleId) {
        await this.validateRole(roleId);
      }

      // Validate password strength
      this.validatePasswordStrength(password);

      // Hash password
      const hashedPassword = await this.hashPassword(password);

      // Create user data conditionally
      const createData: any = {
        email: email.toLowerCase(),
        hashedPassword,
        ...userData,
      };

      if (roleId) {
        createData.roleId = roleId;
      }

      // Create user
      const user = await this.prisma.user.create({
        data: createData,
        include: DEFAULT_INCLUDES,
      });

      this.logger.log(`User created: ${user.email} (ID: ${user.id})`);
      return this.formatUserResponse(user);
    } catch (error) {
      if (error instanceof ConflictException || error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error('Error creating user:', error);
      throw new InternalServerErrorException('Failed to create user');
    }
  }

  /**
   * Update user
   */
  async update(id: number, updateUserDto: UpdateUserDto): Promise<UserResponseDto> {
    const { email, roleId, ...userData } = updateUserDto;

    try {
      // Enhanced debug logging để trace roleId issue
      this.logger.log(`🔄 Starting user update process for user ${id}`);
      this.logger.log(`📥 Received updateUserDto:`, JSON.stringify({
        originalDto: updateUserDto,
        extractedEmail: email,
        extractedRoleId: roleId,
        roleIdType: typeof roleId,
        roleIdValue: roleId,
        hasRoleIdProperty: 'roleId' in updateUserDto,
        roleIdUndefined: roleId === undefined,
        roleIdNull: roleId === null,
        userData
      }, null, 2));

      // Check if user exists và log current state
      const existingUser = await this.prisma.user.findUnique({
        where: { id },
        include: {
          role: {
            select: {
              id: true,
              name: true,
              description: true,
            },
          },
        },
      });

      if (!existingUser) {
        throw new NotFoundException('User not found');
      }

      this.logger.log(`👤 Current user state:`, JSON.stringify({
        userId: existingUser.id,
        currentEmail: existingUser.email,
        currentRoleId: existingUser.roleId,
        currentRoleName: existingUser.role?.name,
        willUpdateEmail: email && email !== existingUser.email,
        willUpdateRoleId: roleId !== undefined && roleId !== existingUser.roleId
      }, null, 2));

      // Validate email uniqueness if email is being updated
      if (email && email !== existingUser.email) {
        await this.validateEmailUnique(email, id);
        this.logger.log(`✅ Email validation passed for: ${email}`);
      }

      // Validate role if provided
      if (roleId) {
        await this.validateRole(roleId);
        this.logger.log(`✅ Role validation passed for roleId: ${roleId}`);
      }

      // Build update data conditionally với detailed logging
      const updateData: any = {
        ...userData,
        updatedAt: new Date(),
      };

      if (email) {
        updateData.email = email.toLowerCase();
        this.logger.log(`📧 Will update email: ${existingUser.email} → ${updateData.email}`);
      }

      if (roleId !== undefined) {
        updateData.roleId = roleId;
        this.logger.log(`👑 Will update roleId: ${existingUser.roleId} → ${updateData.roleId}`);
      }

      this.logger.log(`🔧 Final update data before database operation:`, JSON.stringify(updateData, null, 2));

      // Log before database update
      this.logger.log(`💾 Executing database update for user ${id}...`);

      // Update user với transaction để ensure consistency
      const user = await this.prisma.$transaction(async (prisma) => {
        // First, update the user
        const updatedUser = await prisma.user.update({
          where: { id },
          data: updateData,
          include: DEFAULT_INCLUDES,
        });

        // Log immediately after update trong transaction
        this.logger.log(`✅ Database update completed. Updated user:`, JSON.stringify({
          userId: updatedUser.id,
          updatedEmail: updatedUser.email,
          updatedRoleId: updatedUser.roleId,
          updatedRoleName: updatedUser.role?.name,
          updatedAt: updatedUser.updatedAt
        }, null, 2));

        return updatedUser;
      });

      // Final log với response data
      this.logger.log(`🎉 User update completed successfully:`, JSON.stringify({
        userId: user.id,
        originalRoleId: existingUser.roleId,
        requestedRoleId: roleId,
        finalRoleId: user.roleId,
        success: user.roleId === roleId,
        email: user.email,
        roleName: user.role?.name
      }, null, 2));

      return this.formatUserResponse(user);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      this.logger.error(`❌ Error updating user ${id}:`, {
        error: error.message,
        stack: error.stack,
        updateUserDto,
        userId: id
      });
      throw new InternalServerErrorException('Failed to update user');
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(id: number, updateProfileDto: UpdateProfileDto): Promise<UserResponseDto> {
    const { name, email, avatarUrl, bio, phone, socialLinks } = updateProfileDto;

    try {
      this.logger.log(`🔄 Starting profile update for user ${id}`);
      this.logger.log(`📥 Received profile data:`, JSON.stringify(updateProfileDto, null, 2));

      // Check if user exists
      const existingUser = await this.prisma.user.findUnique({
        where: { id },
        include: {
          profile: true,
        },
      });

      if (!existingUser) {
        throw new NotFoundException('User not found');
      }

      // Validate email uniqueness if email is being updated
      if (email && email !== existingUser.email) {
        await this.validateEmailUnique(email, id);
        this.logger.log(`✅ Email validation passed for: ${email}`);
      }

      // Update user và profile trong transaction
      const updatedUser = await this.prisma.$transaction(async (prisma) => {
        // Update user fields (name, email, avatarUrl)
        const userUpdateData: any = {
          updatedAt: new Date(),
        };

        if (name !== undefined) userUpdateData.name = name;
        if (email !== undefined) userUpdateData.email = email.toLowerCase();
        if (avatarUrl !== undefined) userUpdateData.avatarUrl = avatarUrl;

        const user = await prisma.user.update({
          where: { id },
          data: userUpdateData,
        });

        // Update or create profile
        const profileUpdateData: any = {
          updatedAt: new Date(),
        };

        if (bio !== undefined) profileUpdateData.bio = bio;
        if (phone !== undefined) profileUpdateData.phone = phone;
        if (avatarUrl !== undefined) profileUpdateData.avatarUrl = avatarUrl;
        if (socialLinks !== undefined) profileUpdateData.socialLinks = socialLinks;

        if (existingUser.profile) {
          // Update existing profile
          await prisma.userProfile.update({
            where: { userId: id },
            data: profileUpdateData,
          });
        } else {
          // Create new profile
          await prisma.userProfile.create({
            data: {
              userId: id,
              ...profileUpdateData,
            },
          });
        }

        // Return updated user with all relations
        return await prisma.user.findUnique({
          where: { id },
          include: DETAILED_INCLUDES,
        });
      });

      this.logger.log(`✅ Profile updated successfully for user ${id}`);
      return this.formatUserResponse(updatedUser!);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      this.logger.error(`❌ Error updating profile for user ${id}:`, {
        error: error.message,
        stack: error.stack,
        updateProfileDto,
      });
      throw new InternalServerErrorException('Failed to update profile');
    }
  }

  /**
   * Change user password
   */
  async changePassword(id: number, changePasswordDto: ChangePasswordDto): Promise<void> {
    const { currentPassword, newPassword, confirmPassword } = changePasswordDto;

    try {
      // Validate new password confirmation
      if (newPassword !== confirmPassword) {
        throw new BadRequestException('New password and confirmation do not match');
      }

      // Find user
      const user = await this.prisma.user.findUnique({
        where: { id },
        select: { id: true, hashedPassword: true },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Verify current password
      const isCurrentPasswordValid = await this.comparePassword(
        currentPassword,
        user.hashedPassword || '',
      );

      if (!isCurrentPasswordValid) {
        throw new BadRequestException('Current password is incorrect');
      }

      // Validate new password strength
      this.validatePasswordStrength(newPassword);

      // Hash new password
      const hashedNewPassword = await this.hashPassword(newPassword);

      // Update password
      await this.prisma.user.update({
        where: { id },
        data: {
          hashedPassword: hashedNewPassword,
          updatedAt: new Date(),
        },
      });

      this.logger.log(`Password changed for user ID: ${id}`);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Error changing password for user ${id}:`, error);
      throw new InternalServerErrorException('Failed to change password');
    }
  }

  /**
   * Soft delete user
   */
  async remove(id: number): Promise<void> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (user.deletedAt) {
        throw new ConflictException('User is already deleted');
      }

      await this.prisma.user.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          updatedAt: new Date(),
        },
      });

      this.logger.log(`User soft deleted: ID ${id}`);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      this.logger.error(`Error deleting user ${id}:`, error);
      throw new InternalServerErrorException('Failed to delete user');
    }
  }

  /**
   * Restore deleted user
   */
  async restore(id: number): Promise<UserResponseDto> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (!user.deletedAt) {
        throw new ConflictException('User is not deleted');
      }

      const restoredUser = await this.prisma.user.update({
        where: { id },
        data: {
          deletedAt: null,
          updatedAt: new Date(),
        },
        include: DEFAULT_INCLUDES,
      });

      this.logger.log(`User restored: ID ${id}`);
      return this.formatUserResponse(restoredUser);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      this.logger.error(`Error restoring user ${id}:`, error);
      throw new InternalServerErrorException('Failed to restore user');
    }
  }

  /**
   * Permanently delete user
   */
  async permanentDelete(id: number): Promise<void> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      await this.prisma.user.delete({
        where: { id },
      });

      this.logger.log(`User permanently deleted: ID ${id}`);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Error permanently deleting user ${id}:`, error);
      throw new InternalServerErrorException('Failed to permanently delete user');
    }
  }

  /**
   * Bulk delete users
   */
  async bulkDelete(userIds: number[]): Promise<BulkDeleteResponseDto> {
    const validIds = this.validateUserIds(userIds);

    try {
      const existingUsers = await this.prisma.user.findMany({
        where: {
          id: { in: validIds },
          deletedAt: null,
        },
        select: { id: true },
      });

      const existingIds = existingUsers.map((user) => user.id);
      const skippedIds = validIds.filter((id) => !existingIds.includes(id));

      if (existingIds.length === 0) {
        return {
          success: true,
          deletedCount: 0,
          skippedCount: validIds.length,
          message: 'No users found to delete',
          details: {
            successIds: [],
            skippedIds: validIds,
            errors: ['No valid users found'],
          },
        };
      }

      const result = await this.prisma.user.updateMany({
        where: {
          id: { in: existingIds },
        },
        data: {
          deletedAt: new Date(),
          updatedAt: new Date(),
        },
      });

      this.logger.log(`Bulk deleted ${result.count} users`);

      return {
        success: true,
        deletedCount: result.count,
        skippedCount: skippedIds.length,
        message: `Successfully deleted ${result.count} users`,
        details: {
          successIds: existingIds,
          skippedIds,
        },
      };
    } catch (error) {
      this.logger.error('Error bulk deleting users:', error);
      throw new InternalServerErrorException('Failed to bulk delete users');
    }
  }

  /**
   * Bulk restore users
   */
  async bulkRestore(userIds: number[]): Promise<BulkRestoreResponseDto> {
    const validIds = this.validateUserIds(userIds);

    try {
      const existingUsers = await this.prisma.user.findMany({
        where: {
          id: { in: validIds },
          deletedAt: { not: null },
        },
        select: { id: true },
      });

      const existingIds = existingUsers.map((user) => user.id);
      const skippedIds = validIds.filter((id) => !existingIds.includes(id));

      if (existingIds.length === 0) {
        return {
          success: true,
          restoredCount: 0,
          skippedCount: validIds.length,
          message: 'No deleted users found to restore',
          details: {
            successIds: [],
            skippedIds: validIds,
            errors: ['No deleted users found'],
          },
        };
      }

      const result = await this.prisma.user.updateMany({
        where: {
          id: { in: existingIds },
        },
        data: {
          deletedAt: null,
          updatedAt: new Date(),
        },
      });

      this.logger.log(`Bulk restored ${result.count} users`);

      return {
        success: true,
        restoredCount: result.count,
        skippedCount: skippedIds.length,
        message: `Successfully restored ${result.count} users`,
        details: {
          successIds: existingIds,
          skippedIds,
        },
      };
    } catch (error) {
      this.logger.error('Error bulk restoring users:', error);
      throw new InternalServerErrorException('Failed to bulk restore users');
    }
  }

  /**
   * Bulk permanent delete users
   */
  async bulkPermanentDelete(userIds: number[]): Promise<BulkPermanentDeleteResponseDto> {
    const validIds = this.validateUserIds(userIds);

    try {
      const existingUsers = await this.prisma.user.findMany({
        where: {
          id: { in: validIds },
        },
        select: { id: true },
      });

      const existingIds = existingUsers.map((user) => user.id);
      const skippedIds = validIds.filter((id) => !existingIds.includes(id));

      if (existingIds.length === 0) {
        return {
          success: true,
          deletedCount: 0,
          skippedCount: validIds.length,
          message: 'No users found to permanently delete',
          details: {
            successIds: [],
            skippedIds: validIds,
            errors: ['No users found'],
          },
        };
      }

      const result = await this.prisma.user.deleteMany({
        where: {
          id: { in: existingIds },
        },
      });

      this.logger.log(`Bulk permanently deleted ${result.count} users`);

      return {
        success: true,
        deletedCount: result.count,
        skippedCount: skippedIds.length,
        message: `Successfully permanently deleted ${result.count} users`,
        details: {
          successIds: existingIds,
          skippedIds,
        },
      };
    } catch (error) {
      this.logger.error('Error bulk permanent deleting users:', error);
      throw new InternalServerErrorException('Failed to bulk permanent delete users');
    }
  }
}
