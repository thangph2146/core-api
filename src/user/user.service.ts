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
  UserQueryDto,
  UserStatsQueryDto,
  UserResponseDto,
  UserListResponseDto,
  UserStatsResponseDto,
  BulkDeleteResponseDto,
  BulkRestoreResponseDto,
  BulkPermanentDeleteResponseDto,
  BulkUpdateResponseDto,
  UserMetaResponseDto,
  ChangePasswordDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  AdminUserActionDto,
  UserExportDto,
  AdminUserAction,
} from './dto/user.dto';
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
  dateFrom?: string;
  dateTo?: string;
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
const MAX_PAGE_SIZE = 100;
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
 * Export includes cho export functionality - sửa lỗi để match với FullUser type
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
    },
  },
} as const;

/**
 * User Service - Core Business Logic Layer
 *
 * Service này cung cấp tất cả business logic cho User management:
 *
 * 🔍 READ OPERATIONS:
 * - findAll(): Danh sách ACTIVE users (deletedAt = null)
 * - findDeleted(): Danh sách DELETED users (deletedAt != null)
 * - findOne(): Chi tiết user theo ID
 * - findByEmail(): Tìm user theo email
 * - getUserStats(): Thống kê comprehensive
 *
 * ✏️ WRITE OPERATIONS:
 * - create(): Tạo user mới với validation
 * - update(): Cập nhật thông tin user
 * - changePassword(): Thay đổi mật khẩu với security
 * - remove(): Soft delete user
 * - restore(): Khôi phục user đã xóa
 * - permanentDelete(): Xóa vĩnh viễn user
 *
 * 🔄 BULK OPERATIONS:
 * - bulkDelete(): Xóa mềm nhiều users
 * - bulkRestore(): Khôi phục nhiều users
 * - bulkPermanentDelete(): Xóa vĩnh viễn nhiều users
 * - bulkUpdate(): Cập nhật nhiều users
 *
 * 🔐 SECURITY FEATURES:
 * - Password hashing với bcrypt (12 rounds)
 * - Email uniqueness validation
 * - Role existence validation
 * - Input sanitization và validation
 * - Rate limiting support
 *
 * 🚀 PERFORMANCE FEATURES:
 * - Promise.all cho parallel queries
 * - Optimized pagination
 * - Efficient WHERE clauses
 * - Bulk operations với size limits
 *
 * @version 2.1.0 - API Separation Complete
 * @author PHGroup Development Team
 */
@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(private prisma: PrismaService) {
    this.logger.log('🚀 UserService initialized with enhanced API separation');
  }

  // =============================================================================
  // PRIVATE HELPER METHODS - VALIDATION & SECURITY
  // =============================================================================

  /**
   * Hash password với bcrypt
   */
  private async hashPassword(password: string): Promise<string> {
    try {
      return await bcrypt.hash(password, SALT_ROUNDS);
    } catch (error) {
      this.logger.error(`Lỗi mã hóa mật khẩu: ${error.message}`);
      throw new InternalServerErrorException('Không thể mã hóa mật khẩu');
    }
  }

  /**
   * So sánh password với hash
   */
  private async comparePassword(
    password: string,
    hash: string,
  ): Promise<boolean> {
    try {
      return await bcrypt.compare(password, hash);
    } catch (error) {
      this.logger.error(`Lỗi so sánh mật khẩu: ${error.message}`);
      return false;
    }
  }

  /**
   * Tạo secure random token
   */
  private generateSecureToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Validate user IDs cho bulk operations
   */
  private validateUserIds(userIds: (number | string)[]): number[] {
    if (!userIds || userIds.length === 0) {
      throw new BadRequestException('Mảng userIds không được rỗng');
    }

    if (userIds.length > MAX_BULK_OPERATION_SIZE) {
      throw new BadRequestException(
        `Không thể xử lý quá ${MAX_BULK_OPERATION_SIZE} người dùng cùng lúc`,
      );
    }

    // Convert all userIds to numbers and validate
    const convertedIds: number[] = [];
    for (const id of userIds) {
      const numId = typeof id === 'string' ? parseInt(id, 10) : id;

      if (!Number.isInteger(numId) || numId <= 0 || isNaN(numId)) {
        throw new BadRequestException(
          `ID người dùng không hợp lệ: ${id}. Phải là số nguyên dương.`,
        );
      }

      convertedIds.push(numId);
    }

    const uniqueIds = new Set(convertedIds);
    if (uniqueIds.size !== convertedIds.length) {
      throw new BadRequestException('Mảng userIds chứa ID trùng lặp');
    }

    return convertedIds;
  }

  /**
   * Validate role tồn tại và active
   */
  private async validateRole(roleId: number): Promise<void> {
    this.logger.debug(
      `[VALIDATE ROLE] Starting validation for role ID: ${roleId} (Type: ${typeof roleId})`,
    );
    try {
      const role = await this.prisma.role.findUnique({
        where: { id: roleId, deletedAt: null },
      });

      if (!role) {
        this.logger.error(
          `[VALIDATE ROLE] Role with ID ${roleId} NOT FOUND or is deleted.`,
        );
        throw new BadRequestException(
          `Role với ID ${roleId} không tồn tại hoặc đã bị xóa.`,
        );
      }
      this.logger.debug(
        `[VALIDATE ROLE] Successfully found active role: ${JSON.stringify(role)}`,
      );
    } catch (error) {
      this.logger.error(
        `[VALIDATE ROLE] Error during validation for role ID ${roleId}: ${error.message}`,
        error.stack,
      );
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Lỗi validate role ${roleId}: ${error.message}`);
      throw new InternalServerErrorException('Không thể xác thực role');
    }
  }

  /**
   * Kiểm tra email đã được sử dụng
   */
  private async validateEmailUnique(
    email: string,
    excludeUserId?: number,
  ): Promise<void> {
    try {
      const existingUser = await this.prisma.user.findUnique({
        where: { email },
        select: { id: true, deletedAt: true },
      });

      if (existingUser && existingUser.id !== excludeUserId) {
        if (existingUser.deletedAt) {
          throw new ConflictException(
            'Email này đã được sử dụng bởi một tài khoản đã bị xóa. Vui lòng liên hệ quản trị viên.',
          );
        } else {
          throw new ConflictException('Email này đã được sử dụng.');
        }
      }
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      this.logger.error(`Lỗi validate email uniqueness: ${error.message}`);
      throw new InternalServerErrorException('Không thể xác thực email');
    }
  }

  /**
   * Validate password strength
   */
  private validatePasswordStrength(password: string): void {
    if (password.length < 8) {
      throw new BadRequestException('Mật khẩu phải có ít nhất 8 ký tự');
    }
    if (
      !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])/.test(
        password,
      )
    ) {
      throw new BadRequestException(
        'Mật khẩu phải chứa ít nhất 1 chữ thường, 1 chữ hoa, 1 số và 1 ký tự đặc biệt',
      );
    }
  }

  /**
   * Validate pagination parameters
   */
  private validatePaginationParams(
    page: number,
    limit: number,
  ): { page: number; limit: number } {
    const validatedPage = Math.max(1, page || 1);
    const validatedLimit = Math.min(
      Math.max(1, limit || DEFAULT_PAGE_SIZE),
      MAX_PAGE_SIZE,
    );

    return { page: validatedPage, limit: validatedLimit };
  }

  // =============================================================================
  // PRIVATE HELPER METHODS - DATA FORMATTING
  // =============================================================================

  /**
   * Format user response cho detailed view
   */
  private formatUserResponse(user: FullUser): UserResponseDto {
    const {
      hashedPassword,
      passwordResetToken,
      passwordResetTokenExpiry,
      ...safeUser
    } = user;

    // Format role and permissions
    const role = user.role
      ? {
          ...user.role,
          permissions:
            user.role.permissions?.map((p) => ({
              id: p.id,
              name: p.name,
              description: p.description,
            })) || [],
        }
      : null;

    return {
      ...safeUser,
      metaTitle: safeUser.metaTitle ?? undefined,
      metaDescription: safeUser.metaDescription ?? undefined,
      role,
      profile: user.profile
        ? {
            id: user.profile.id,
            bio: user.profile.bio,
            phone: user.profile.phone ?? null,
            avatarUrl: user.profile.avatarUrl,
            socialLinks: user.profile.socialLinks,
            createdAt: user.profile.createdAt,
            updatedAt: user.profile.updatedAt,
          }
        : null,
      accounts: user.accounts || [],
      _count: {
        blogs: user._count?.blogs ?? 0,
        medias: user._count?.medias ?? 0,
        recruitments: user._count?.recruitments ?? 0,
        likedBlogs: user._count?.likedBlogs ?? 0,
        bookmarkedBlogs: user._count?.bookmarkedBlogs ?? 0,
        blogComments: user._count?.blogComments ?? 0,
        contactSubmissionResponses:
          user._count?.contactSubmissionResponses ?? 0,
      },
    };
  }

  /**
   * Format user response cho list view (simplified)
   */
  private formatUserListResponse(user: FullUser): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      image: user.image,
      roleId: user.roleId,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      deletedAt: user.deletedAt,
      role: user.role
        ? {
            id: user.role.id,
            name: user.role.name,
            description: user.role.description,
          }
        : null,
      _count: user._count,
    };
  }

  // =============================================================================
  // PRIVATE HELPER METHODS - QUERY BUILDING
  // =============================================================================

  /**
   * Build WHERE clause cho user queries - Tối ưu hóa và rõ ràng
   */
  private buildWhereClause(filters: UserFilterOptions): Prisma.UserWhereInput {
    const where: Prisma.UserWhereInput = {};

    // DELETED STATUS FILTER - Ưu tiên cao nhất
    this.applyDeletedFilter(where, filters);

    // SEARCH FILTER - Tìm kiếm trong name và email
    this.applySearchFilter(where, filters.search);

    // ROLE FILTER - Lọc theo role
    this.applyRoleFilter(where, filters.roleId);

    // DATE RANGE FILTER - Lọc theo khoảng thời gian
    this.applyDateRangeFilter(where, filters.dateFrom, filters.dateTo);

    return where;
  }

  /**
   * Apply deleted status filter
   */
  private applyDeletedFilter(
    where: Prisma.UserWhereInput,
    filters: UserFilterOptions,
  ): void {
    if (filters.deleted === true) {
      // Explicitly fetch only deleted users
      where.deletedAt = { not: null };
    } else if (filters.deleted === false) {
      // Explicitly fetch only active users
      where.deletedAt = null;
    } else if (!filters.includeDeleted) {
      // Default behavior: fetch only active users if not specified otherwise
      where.deletedAt = null;
    }
    // If filters.includeDeleted is true and filters.deleted is not set, do nothing to include all users.
  }

  /**
   * Apply search filter trong name và email
   */
  private applySearchFilter(
    where: Prisma.UserWhereInput,
    search?: string,
  ): void {
    if (!search) return;

    const searchTerm = search.trim();
    if (!searchTerm) return;

    where.OR = [
      { name: { contains: searchTerm, mode: 'insensitive' } },
      { email: { contains: searchTerm, mode: 'insensitive' } },
    ];
  }

  /**
   * Apply role filter
   */
  private applyRoleFilter(where: Prisma.UserWhereInput, roleId?: number): void {
    if (roleId) {
      where.roleId = roleId;
    }
  }

  /**
   * Apply date range filter
   */
  private applyDateRangeFilter(
    where: Prisma.UserWhereInput,
    dateFrom?: string,
    dateTo?: string,
  ): void {
    if (!dateFrom && !dateTo) return;

    where.createdAt = {};
    if (dateFrom) {
      where.createdAt.gte = new Date(dateFrom);
    }
    if (dateTo) {
      where.createdAt.lte = new Date(dateTo);
    }
  }

  /**
   * Build ORDER BY clause cho user queries
   */
  private buildOrderByClause(
    sort: UserSortOptions,
  ): Prisma.UserOrderByWithRelationInput {
    const { sortBy = 'createdAt', sortOrder = 'desc' } = sort;

    // Validate sortBy field để tránh SQL injection
    const allowedSortFields = [
      'id',
      'email',
      'name',
      'createdAt',
      'updatedAt',
      'deletedAt',
      'roleId',
      'avatarUrl',
    ];

    const validatedSortBy = allowedSortFields.includes(sortBy)
      ? sortBy
      : 'createdAt';

    return { [validatedSortBy]: sortOrder };
  }

  /**
   * Tính toán metadata cho pagination
   */
  private calculateMeta(
    total: number,
    page: number,
    limit: number,
    query?: Partial<UserQueryDto>,
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
      ...(query && {
        search: query.search,
        roleId: query.roleId,
        deleted: query.deleted,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
      }),
    };
  }

  // =============================================================================
  // PUBLIC METHODS - READ OPERATIONS
  // =============================================================================

  /**
   * Lấy danh sách ACTIVE users với pagination và filtering
   * API riêng biệt hoàn toàn cho active users
   */
  async findAll(query: UserQueryDto): Promise<UserListResponseDto> {
    this.logger.log(
      `🔍 Tìm kiếm ACTIVE users với query: ${JSON.stringify(query)}`,
    );

    try {
      // 1. USE VALIDATED & TRANSFORMED PARAMETERS FROM DTO
      const {
        page = 1,
        limit = DEFAULT_PAGE_SIZE,
        search,
        roleId,
        dateFrom,
        dateTo,
        sortBy,
        sortOrder,
      } = query;

      // 2. BUILD FILTERS - CHỈ CHO ACTIVE USERS
      const filters: UserFilterOptions = {
        search,
        roleId,
        dateFrom,
        dateTo,
        includeDeleted: false, // FORCE exclude deleted users
        deleted: false, // EXPLICITLY active users only
      };

      // 3. BUILD SORT - DEFAULT createdAt DESC cho active users
      const sort: UserSortOptions = {
        sortBy: sortBy || 'createdAt',
        sortOrder: sortOrder || 'desc',
      };

      // 4. BUILD QUERIES
      const where = this.buildWhereClause(filters);
      const orderBy = this.buildOrderByClause(sort);

      // 5. EXECUTE PARALLEL QUERIES
      const [users, total] = await Promise.all([
        this.prisma.user.findMany({
          where,
          orderBy,
          skip: (page - 1) * limit,
          take: limit,
          include: DEFAULT_INCLUDES,
        }),
        this.prisma.user.count({ where }),
      ]);

      // 6. FORMAT RESPONSE
      const formattedUsers = users.map((user) =>
        this.formatUserListResponse(user),
      );
      const meta = this.calculateMeta(total, page, limit, query);

      this.logger.log(`✅ Tìm thấy ${users.length}/${total} ACTIVE users`);

      return {
        data: formattedUsers,
        meta,
      };
    } catch (error) {
      this.logger.error(
        `❌ Lỗi khi tìm kiếm ACTIVE users: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Không thể lấy danh sách người dùng hoạt động',
      );
    }
  }

  /**
   * Lấy danh sách deleted users - Logic riêng biệt hoàn toàn
   */
  async findDeleted(query: UserQueryDto): Promise<UserListResponseDto> {
    this.logger.log(
      `Tìm kiếm deleted users với query: ${JSON.stringify(query)}`,
    );

    try {
      // 1. USE VALIDATED & TRANSFORMED PARAMETERS FROM DTO
      const {
        page = 1,
        limit = DEFAULT_PAGE_SIZE,
        search,
        roleId,
        dateFrom,
        dateTo,
        sortBy,
        sortOrder,
      } = query;

      // 2. BUILD FILTERS - CHỈ CHO DELETED USERS
      const filters: UserFilterOptions = {
        search,
        roleId,
        dateFrom,
        dateTo,
        deleted: true, // FORCE chỉ deleted users
        includeDeleted: true, // EXPLICITLY allow deleted users
      };

      // 3. BUILD SORT - DEFAULT deletedAt DESC cho deleted users
      const sort: UserSortOptions = {
        sortBy: sortBy || 'deletedAt',
        sortOrder: sortOrder || 'desc',
      };

      // 4. BUILD QUERIES
      const where = this.buildWhereClause(filters);
      const orderBy = this.buildOrderByClause(sort);

      // 5. EXECUTE PARALLEL QUERIES
      const [deletedUsers, total] = await Promise.all([
        this.prisma.user.findMany({
          where,
          orderBy,
          skip: (page - 1) * limit,
          take: limit,
          include: DEFAULT_INCLUDES,
        }),
        this.prisma.user.count({ where }),
      ]);

      this.logger.debug(`[FIND_DELETED] Found ${deletedUsers.length} users, total: ${total}`);

      // 6. FORMAT RESPONSE
      const formattedUsers = deletedUsers.map((user) =>
        this.formatUserListResponse(user),
      );
      const meta = this.calculateMeta(total, page, limit, {
        ...query,
        deleted: true,
      });

      this.logger.log(
        `✅ Tìm thấy ${deletedUsers.length}/${total} DELETED users`,
      );

      return {
        data: formattedUsers,
        meta,
      };
    } catch (error) {
      this.logger.error(
        `❌ Lỗi khi tìm kiếm DELETED users: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Không thể lấy danh sách người dùng đã xóa',
      );
    }
  }

  /**
   * Lấy user theo ID
   */
  async findOne(id: number, includeDeleted = false): Promise<UserResponseDto> {
    this.logger.log(
      `Tìm user với ID: ${id}, includeDeleted: ${includeDeleted}`,
    );

    try {
      const where: Prisma.UserWhereInput = { id };
      if (!includeDeleted) {
        where.deletedAt = null;
      }

      const user = await this.prisma.user.findFirst({
        where,
        include: DETAILED_INCLUDES,
      });

      if (!user) {
        throw new NotFoundException(
          `User với ID ${id} không tồn tại${includeDeleted ? '' : ' hoặc đã bị xóa'}`,
        );
      }

      this.logger.log(`Tìm thấy user với ID: ${id}`);
      return this.formatUserResponse(user);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Lỗi khi tìm user với ID ${id}: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Không thể lấy thông tin người dùng',
      );
    }
  }

  /**
   * Tìm user theo email
   */
  async findByEmail(
    email: string,
    includeDeleted = false,
  ): Promise<UserResponseDto> {
    this.logger.log(
      `Tìm user với email: ${email}, includeDeleted: ${includeDeleted}`,
    );

    try {
      const where: Prisma.UserWhereInput = { email };
      if (!includeDeleted) {
        where.deletedAt = null;
      }

      const user = await this.prisma.user.findFirst({
        where,
        include: DETAILED_INCLUDES,
      });

      if (!user) {
        throw new NotFoundException(
          `User với email ${email} không tồn tại${includeDeleted ? '' : ' hoặc đã bị xóa'}`,
        );
      }

      this.logger.log(`Tìm thấy user với email: ${email}`);
      return this.formatUserResponse(user);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Lỗi khi tìm user với email ${email}: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Không thể lấy thông tin người dùng',
      );
    }
  }

  /**
   * Lấy thống kê user
   */
  async getUserStats(
    query: UserStatsQueryDto = {},
  ): Promise<UserStatsResponseDto> {
    this.logger.log(`Lấy thống kê users với query: ${JSON.stringify(query)}`);

    try {
      const { includeDeleted = false } = query;
      const whereClause = includeDeleted ? {} : { deletedAt: null };

      const [
        totalUsers,
        activeUsers,
        deletedUsers,
        usersWithRoles,
        recentUsers,
      ] = await Promise.all([
        // Tổng số users
        this.prisma.user.count(),

        // Users đang hoạt động (không bị xóa)
        this.prisma.user.count({ where: { deletedAt: null } }),

        // Users đã xóa
        this.prisma.user.count({ where: { deletedAt: { not: null } } }),

        // Users có role
        this.prisma.user.count({
          where: {
            roleId: { not: null },
            deletedAt: null,
          },
        }),

        // Users tạo trong 30 ngày qua
        this.prisma.user.count({
          where: {
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            },
            ...whereClause,
          },
        }),
      ]);

      // Thống kê theo role
      const roleStats = await this.prisma.role.findMany({
        where: { deletedAt: null },
        include: {
          _count: {
            select: {
              users: {
                where: whereClause,
              },
            },
          },
        },
      });

      const result = {
        total: totalUsers,
        active: activeUsers,
        deleted: deletedUsers,
        usersWithRoles,
        usersWithoutRoles: activeUsers - usersWithRoles,
        recentUsers,
        roleStats: roleStats.map((role) => ({
          roleId: role.id,
          roleName: role.name,
          userCount: role._count.users,
        })),
        createdAt: new Date().toISOString(),
      };

      this.logger.log(
        `Thống kê users hoàn thành: ${totalUsers} total, ${activeUsers} active`,
      );
      return result;
    } catch (error) {
      this.logger.error(
        `Lỗi khi lấy thống kê users: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Không thể lấy thống kê người dùng',
      );
    }
  }

  // =============================================================================
  // PUBLIC METHODS - WRITE OPERATIONS
  // =============================================================================

  /**
   * Tạo user mới
   */
  async create(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    this.logger.log(`Tạo user mới với email: ${createUserDto.email}`);
    this.logger.debug(
      `[CREATE USER] Received DTO: ${JSON.stringify(createUserDto, null, 2)}`,
    );

    try {
      // 1. VALIDATE & CHECK EXISTING USER
      this.logger.debug(
        `[CREATE USER] Validating email uniqueness for: ${createUserDto.email}`,
      );
      await this.validateEmailUnique(createUserDto.email);

      if (createUserDto.roleId) {
        this.logger.debug(
          `[CREATE USER] Validating role ID: ${createUserDto.roleId}`,
        );
        await this.validateRole(createUserDto.roleId);
      } else {
        this.logger.warn(
          `[CREATE USER] No roleId provided for email: ${createUserDto.email}`,
        );
      }

      this.logger.debug(`[CREATE USER] Validating password strength.`);
      this.validatePasswordStrength(createUserDto.password);

      // 2. HASH PASSWORD
      this.logger.debug(`[CREATE USER] Hashing password.`);
      const hashedPassword = await this.hashPassword(createUserDto.password);

      // 3. PREPARE DATA
      const dataToCreate: Prisma.UserCreateInput = {
        email: createUserDto.email,
        name: createUserDto.name,
        hashedPassword,
        role: createUserDto.roleId
          ? { connect: { id: createUserDto.roleId } }
          : undefined,
        avatarUrl: createUserDto.avatarUrl,
        image: createUserDto.image,
        profile: createUserDto.profile
          ? { create: createUserDto.profile }
          : undefined,
      };

      // 4. CREATE USER
      const newUser = await this.prisma.user.create({
        data: dataToCreate,
        include: DETAILED_INCLUDES,
      });

      this.logger.log(`✅ Tạo thành công user mới với ID: ${newUser.id}`);

      // 5. RETURN FORMATTED RESPONSE
      return this.formatUserResponse(newUser);
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      this.logger.error(`Lỗi khi tạo user: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Không thể tạo người dùng mới');
    }
  }

  /**
   * Cập nhật user
   */
  async update(
    id: number,
    updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    this.logger.log(`Cập nhật user ID: ${id}`);

    try {
      // 1. VALIDATE & PREPARE DATA
      const {
        email,
        name,
        roleId,
        avatarUrl,
        image,
        bio,
        phone,
        profile: profileDto,
      } = updateUserDto;

      const user = await this.prisma.user.findUnique({ where: { id } });
      if (!user) {
        throw new NotFoundException(`User với ID ${id} không tồn tại`);
      }

      if (email && email !== user.email) {
        await this.validateEmailUnique(email, id);
      }

      if (roleId && roleId !== user.roleId) {
        await this.validateRole(roleId);
      }

      // 2. PREPARE UPDATE DATA
      const dataToUpdate: Prisma.UserUpdateInput = {};
      const profileData: Prisma.UserProfileCreateWithoutUserInput = {};

      if (email) dataToUpdate.email = email.toLowerCase().trim();
      if (name !== undefined) dataToUpdate.name = name?.trim() || null;
      if (roleId !== undefined)
        dataToUpdate.role = roleId
          ? { connect: { id: roleId } }
          : { disconnect: true };
      if (avatarUrl !== undefined)
        dataToUpdate.avatarUrl = avatarUrl?.trim() || null;
      if (image !== undefined) dataToUpdate.image = image?.trim() || null;

      // Combine profile data from top-level and nested `profile` DTO
      if (bio !== undefined) profileData.bio = bio;
      if (phone !== undefined) profileData.phone = phone;
      if (profileDto) Object.assign(profileData, profileDto);

      // If there's any profile data, perform an upsert
      if (Object.keys(profileData).length > 0) {
        dataToUpdate.profile = {
          upsert: {
            create: profileData,
            update: profileData,
          },
        };
      }

      // 3. UPDATE USER
      const updatedUser = await this.prisma.user.update({
        where: { id },
        data: dataToUpdate,
        include: DETAILED_INCLUDES,
      });

      this.logger.log(`✅ Cập nhật thành công user ID: ${id}`);

      // 4. RETURN FORMATTED RESPONSE
      return this.formatUserResponse(updatedUser);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      this.logger.error(
        `Lỗi khi cập nhật user ID ${id}: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException('Không thể cập nhật người dùng');
    }
  }

  /**
   * Thay đổi mật khẩu
   */
  async changePassword(
    id: number,
    changePasswordDto: ChangePasswordDto,
  ): Promise<void> {
    this.logger.log(`Thay đổi mật khẩu cho user ID: ${id}`);

    try {
      const { currentPassword, newPassword, confirmPassword } =
        changePasswordDto;

      // Validate new password confirmation
      if (newPassword !== confirmPassword) {
        throw new BadRequestException(
          'Mật khẩu mới và xác nhận mật khẩu không khớp',
        );
      }

      // Get user với password để verify
      const user = await this.prisma.user.findUnique({
        where: { id, deletedAt: null },
        select: { id: true, hashedPassword: true },
      });

      if (!user || !user.hashedPassword) {
        throw new NotFoundException(
          `User với ID ${id} không tồn tại hoặc không có mật khẩu`,
        );
      }

      // Verify current password
      const isCurrentPasswordValid = await this.comparePassword(
        currentPassword,
        user.hashedPassword,
      );
      if (!isCurrentPasswordValid) {
        throw new BadRequestException('Mật khẩu hiện tại không chính xác');
      }

      // Validate new password strength
      this.validatePasswordStrength(newPassword);

      // Hash new password
      const hashedPassword = await this.hashPassword(newPassword);

      // Update password
      await this.prisma.user.update({
        where: { id },
        data: { hashedPassword },
      });

      this.logger.log(`Mật khẩu được thay đổi thành công cho user ID: ${id}`);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      this.logger.error(
        `Lỗi khi thay đổi mật khẩu cho user ${id}: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException('Không thể thay đổi mật khẩu');
    }
  }

  /**
   * Xóa mềm user
   */
  async remove(id: number): Promise<void> {
    this.logger.log(`Xóa mềm user ID: ${id}`);

    try {
      // Kiểm tra user tồn tại và chưa bị xóa
      const user = await this.prisma.user.findUnique({
        where: { id, deletedAt: null },
        select: { id: true },
      });

      if (!user) {
        throw new NotFoundException(
          `User với ID ${id} không tồn tại hoặc đã bị xóa`,
        );
      }

      // Soft delete
      await this.prisma.user.update({
        where: { id },
        data: { deletedAt: new Date() },
      });

      this.logger.log(`User được xóa mềm thành công với ID: ${id}`);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Lỗi khi xóa mềm user với ID ${id}: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException('Không thể xóa người dùng');
    }
  }

  /**
   * Khôi phục user đã xóa
   */
  async restore(id: number): Promise<UserResponseDto> {
    this.logger.log(`Khôi phục user ID: ${id}`);

    try {
      // Kiểm tra user đã bị xóa
      const user = await this.prisma.user.findUnique({
        where: { id },
        select: { id: true, deletedAt: true },
      });

      if (!user) {
        throw new NotFoundException(`User với ID ${id} không tồn tại`);
      }

      if (!user.deletedAt) {
        throw new BadRequestException(`User với ID ${id} chưa bị xóa`);
      }

      // Restore user
      await this.prisma.user.update({
        where: { id },
        data: { deletedAt: null },
        include: DETAILED_INCLUDES,
      });

      const restoredUser = await this.prisma.user.findUnique({
        where: { id },
        include: DETAILED_INCLUDES,
      });

      this.logger.log(`✅ Khôi phục thành công user ID: ${id}`);

      // 5. RETURN FORMATTED RESPONSE
      if (!restoredUser) {
        // This case should theoretically not happen if the restore operation was successful
        throw new InternalServerErrorException(
          'Không thể lấy thông tin người dùng sau khi khôi phục',
        );
      }
      return this.formatUserResponse(restoredUser);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      this.logger.error(
        `Lỗi khi khôi phục user với ID ${id}: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException('Không thể khôi phục người dùng');
    }
  }

  /**
   * Xóa vĩnh viễn user
   */
  async permanentDelete(id: number): Promise<void> {
    this.logger.log(`Xóa vĩnh viễn user ID: ${id}`);

    try {
      // Kiểm tra user tồn tại
      const user = await this.prisma.user.findUnique({
        where: { id },
        select: { id: true, deletedAt: true },
      });

      if (!user) {
        throw new NotFoundException(`User với ID ${id} không tồn tại`);
      }

      // Recommend xóa mềm trước khi xóa vĩnh viễn
      if (!user.deletedAt) {
        this.logger.warn(
          `Attempting permanent delete on non-deleted user ${id}`,
        );
      }

      // Delete permanently (cascade sẽ xử lý related data)
      await this.prisma.user.delete({
        where: { id },
      });

      this.logger.log(`User được xóa vĩnh viễn thành công với ID: ${id}`);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Lỗi khi xóa vĩnh viễn user với ID ${id}: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Không thể xóa vĩnh viễn người dùng',
      );
    }
  }

  // =============================================================================
  // PUBLIC METHODS - BULK OPERATIONS
  // =============================================================================

  /**
   * Bulk soft delete users - Enhanced with detailed response structure
   */
  async bulkDelete(userIds: number[]): Promise<BulkDeleteResponseDto> {
    this.logger.log(`Bulk deleting users: ${userIds.join(', ')}`);

    try {
      const validatedUserIds = this.validateUserIds(userIds);
      const deletedIds: number[] = [];
      const skippedIds: number[] = [];
      const errors: string[] = [];

      // Kiểm tra users tồn tại và chưa bị xóa
      const existingUsers = await this.prisma.user.findMany({
        where: {
          id: { in: validatedUserIds },
        },
        select: { id: true, deletedAt: true, name: true },
      });

      const existingUserIds = existingUsers.map(u => u.id);
      const nonExistingIds = validatedUserIds.filter(id => !existingUserIds.includes(id));
      const alreadyDeletedUsers = existingUsers.filter(u => u.deletedAt !== null);
      const deletableUsers = existingUsers.filter(u => u.deletedAt === null);

      // Add skipped users with reasons
      if (nonExistingIds.length > 0) {
        skippedIds.push(...nonExistingIds);
        errors.push(`Người dùng không tồn tại: ID ${nonExistingIds.join(', ')}`);
      }

      if (alreadyDeletedUsers.length > 0) {
        skippedIds.push(...alreadyDeletedUsers.map(u => u.id));
        const userNames = alreadyDeletedUsers.map(u => u.name || `ID ${u.id}`).join(', ');
        errors.push(`Người dùng đã bị xóa: ${userNames}`);
      }

      // Perform bulk delete for deletable users
      if (deletableUsers.length > 0) {
        const result = await this.prisma.user.updateMany({
          where: {
            id: { in: deletableUsers.map(u => u.id) },
            deletedAt: null,
          },
          data: {
            deletedAt: new Date(),
          },
        });
        deletedIds.push(...deletableUsers.map(u => u.id));
      }

      const success = deletedIds.length > 0;
      let message = success 
        ? `Đã xóa thành công ${deletedIds.length} người dùng${skippedIds.length > 0 ? `, bỏ qua ${skippedIds.length} người dùng` : ''}`
        : 'Không có người dùng nào được xóa';
      
      // Add specific error details to message if there are errors for better toast display
      if (errors.length > 0 && skippedIds.length > 0) {
        message += `. ${errors.join('; ')}`;
      }

      this.logger.log(`Bulk delete completed: ${deletedIds.length} deleted, ${skippedIds.length} skipped`);

      return {
        success,
        deletedCount: deletedIds.length,
        skippedCount: skippedIds.length,
        message,
        details: {
          successIds: deletedIds,
          skippedIds,
          errors: errors.length > 0 ? errors : undefined,
        },
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(
        `Error bulk deleting users: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException('Không thể xóa nhiều người dùng');
    }
  }

  /**
   * Bulk restore users - Enhanced with detailed response structure
   */
  async bulkRestore(userIds: number[]): Promise<BulkRestoreResponseDto> {
    this.logger.log(`Bulk restoring users: ${userIds.join(', ')}`);

    try {
      const validatedUserIds = this.validateUserIds(userIds);
      const restoredIds: number[] = [];
      const skippedIds: number[] = [];
      const errors: string[] = [];

      // Kiểm tra users tồn tại và đã bị xóa
      const existingUsers = await this.prisma.user.findMany({
        where: {
          id: { in: validatedUserIds },
        },
        select: { id: true, deletedAt: true, name: true },
      });

      const existingUserIds = existingUsers.map(u => u.id);
      const nonExistingIds = validatedUserIds.filter(id => !existingUserIds.includes(id));
      const notDeletedUsers = existingUsers.filter(u => u.deletedAt === null);
      const restorableUsers = existingUsers.filter(u => u.deletedAt !== null);

      // Add skipped users with reasons
      if (nonExistingIds.length > 0) {
        skippedIds.push(...nonExistingIds);
        errors.push(`Người dùng không tồn tại: ID ${nonExistingIds.join(', ')}`);
      }

      if (notDeletedUsers.length > 0) {
        skippedIds.push(...notDeletedUsers.map(u => u.id));
        const userNames = notDeletedUsers.map(u => u.name || `ID ${u.id}`).join(', ');
        errors.push(`Người dùng chưa bị xóa: ${userNames}`);
      }

      // Perform bulk restore for restorable users
      if (restorableUsers.length > 0) {
        const result = await this.prisma.user.updateMany({
          where: {
            id: { in: restorableUsers.map(u => u.id) },
            deletedAt: { not: null },
          },
          data: {
            deletedAt: null,
          },
        });
        restoredIds.push(...restorableUsers.map(u => u.id));
      }

      const success = restoredIds.length > 0;
      let message = success 
        ? `Đã khôi phục thành công ${restoredIds.length} người dùng${skippedIds.length > 0 ? `, bỏ qua ${skippedIds.length} người dùng` : ''}`
        : 'Không có người dùng nào được khôi phục';
      
      // Add specific error details to message if there are errors for better toast display
      if (errors.length > 0 && skippedIds.length > 0) {
        message += `. ${errors.join('; ')}`;
      }

      this.logger.log(`Bulk restore completed: ${restoredIds.length} restored, ${skippedIds.length} skipped`);

      return {
        success,
        restoredCount: restoredIds.length,
        skippedCount: skippedIds.length,
        message,
        details: {
          successIds: restoredIds,
          skippedIds,
          errors: errors.length > 0 ? errors : undefined,
        },
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(
        `Error bulk restoring users: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Không thể khôi phục nhiều người dùng',
      );
    }
  }

  /**
   * Bulk permanently delete users - Enhanced with detailed response structure
   */
  async bulkPermanentDelete(
    userIds: number[],
  ): Promise<BulkPermanentDeleteResponseDto> {
    this.logger.log(`Bulk permanently deleting users: ${userIds.join(', ')}`);

    try {
      const validatedUserIds = this.validateUserIds(userIds);
      const deletedIds: number[] = [];
      const skippedIds: number[] = [];
      const errors: string[] = [];

      // Check how many users exist before deletion
      const existingUsers = await this.prisma.user.findMany({
        where: { id: { in: validatedUserIds } },
        select: { id: true, name: true },
      });

      const existingUserIds = existingUsers.map(u => u.id);
      const nonExistingIds = validatedUserIds.filter(id => !existingUserIds.includes(id));

      // Add skipped users with reasons
      if (nonExistingIds.length > 0) {
        skippedIds.push(...nonExistingIds);
        errors.push(`Người dùng không tồn tại: ID ${nonExistingIds.join(', ')}`);
      }

      // Perform bulk permanent delete for existing users
      if (existingUsers.length > 0) {
        // Use transaction to ensure atomic deletion - only delete users that exist
        const result = await this.prisma.$transaction(async (tx) => {
          // Delete related data for existing users only
          await tx.userProfile.deleteMany({
            where: { userId: { in: existingUserIds } },
          });
          await tx.account.deleteMany({
            where: { userId: { in: existingUserIds } },
          });
          await tx.session.deleteMany({
            where: { userId: { in: existingUserIds } },
          });
          await tx.blogLike.deleteMany({
            where: { userId: { in: existingUserIds } },
          });
          await tx.blogBookmark.deleteMany({
            where: { userId: { in: existingUserIds } },
          });
          await tx.blogComment.deleteMany({
            where: { authorId: { in: existingUserIds } },
          });
          await tx.media.updateMany({
            where: { uploadedById: { in: existingUserIds } },
            data: { uploadedById: null },
          });

          // Delete users
          return await tx.user.deleteMany({
            where: { id: { in: existingUserIds } },
          });
        });

        deletedIds.push(...existingUserIds);
      }

      const success = deletedIds.length > 0;
      let message = success 
        ? `Đã xóa vĩnh viễn thành công ${deletedIds.length} người dùng${skippedIds.length > 0 ? `, bỏ qua ${skippedIds.length} người dùng` : ''}`
        : 'Không có người dùng nào được xóa vĩnh viễn';
      
      // Add specific error details to message if there are errors for better toast display
      if (errors.length > 0 && skippedIds.length > 0) {
        message += `. ${errors.join('; ')}`;
      }

      this.logger.log(
        `Bulk permanent delete completed: ${deletedIds.length} deleted, ${skippedIds.length} skipped`,
      );

      return {
        success,
        deletedCount: deletedIds.length,
        skippedCount: skippedIds.length,
        message,
        details: {
          successIds: deletedIds,
          skippedIds,
          errors: errors.length > 0 ? errors : undefined,
        },
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(
        `Error bulk permanently deleting users: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Không thể xóa vĩnh viễn nhiều người dùng',
      );
    }
  }

  /**
   * Bulk update users - Enhanced with detailed response structure
   */
  async bulkUpdate(
    userIds: number[],
    updateData: Partial<UpdateUserDto>,
  ): Promise<BulkUpdateResponseDto> {
    this.logger.log(`Bulk updating users: ${userIds.join(', ')}`);

    try {
      const validatedUserIds = this.validateUserIds(userIds);
      const updatedIds: number[] = [];
      const skippedIds: number[] = [];
      const errors: string[] = [];

      // Validate roleId if provided
      if (updateData.roleId) {
        await this.validateRole(updateData.roleId);
      }

      // Kiểm tra users tồn tại và chưa bị xóa
      const existingUsers = await this.prisma.user.findMany({
        where: {
          id: { in: validatedUserIds },
        },
        select: { id: true, deletedAt: true, name: true },
      });

      const existingUserIds = existingUsers.map(u => u.id);
      const nonExistingIds = validatedUserIds.filter(id => !existingUserIds.includes(id));
      const deletedUsers = existingUsers.filter(u => u.deletedAt !== null);
      const updatableUsers = existingUsers.filter(u => u.deletedAt === null);

      // Add skipped users with reasons
      if (nonExistingIds.length > 0) {
        skippedIds.push(...nonExistingIds);
        errors.push(`Người dùng không tồn tại: ID ${nonExistingIds.join(', ')}`);
      }

      if (deletedUsers.length > 0) {
        skippedIds.push(...deletedUsers.map(u => u.id));
        const userNames = deletedUsers.map(u => u.name || `ID ${u.id}`).join(', ');
        errors.push(`Người dùng đã bị xóa: ${userNames}`);
      }

      // Perform bulk update for updatable users
      if (updatableUsers.length > 0) {
        // Prepare update data
        const prismaUpdateData: Prisma.UserUpdateManyMutationInput = {};

        if (updateData.name !== undefined) {
          prismaUpdateData.name = updateData.name?.trim() || null;
        }

        if (updateData.avatarUrl !== undefined) {
          prismaUpdateData.avatarUrl = updateData.avatarUrl?.trim() || null;
        }

        if (updateData.image !== undefined) {
          prismaUpdateData.image = updateData.image?.trim() || null;
        }

        // For roleId, we need to use individual updates since updateMany doesn't support relations
        if (updateData.roleId !== undefined) {
          const updates = updatableUsers.map((user) =>
            this.prisma.user.update({
              where: { id: user.id },
              data: {
                ...prismaUpdateData,
                role: updateData.roleId
                  ? { connect: { id: updateData.roleId } }
                  : { disconnect: true },
              },
            }),
          );

          await Promise.all(updates);
          updatedIds.push(...updatableUsers.map(u => u.id));
        } else {
          // For non-role updates, use updateMany
          const result = await this.prisma.user.updateMany({
            where: {
              id: { in: updatableUsers.map((u) => u.id) },
              deletedAt: null,
            },
            data: prismaUpdateData,
          });
          updatedIds.push(...updatableUsers.map(u => u.id));
        }
      }

      const success = updatedIds.length > 0;
      let message = success 
        ? `Đã cập nhật thành công ${updatedIds.length} người dùng${skippedIds.length > 0 ? `, bỏ qua ${skippedIds.length} người dùng` : ''}`
        : 'Không có người dùng nào được cập nhật';
      
      // Add specific error details to message if there are errors for better toast display
      if (errors.length > 0 && skippedIds.length > 0) {
        message += `. ${errors.join('; ')}`;
      }

      this.logger.log(`Bulk update completed: ${updatedIds.length} updated, ${skippedIds.length} skipped`);

      return {
        success,
        updatedCount: updatedIds.length,
        skippedCount: skippedIds.length,
        message,
        details: {
          successIds: updatedIds,
          skippedIds,
          errors: errors.length > 0 ? errors : undefined,
        },
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(
        `Error bulk updating users: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Không thể cập nhật nhiều người dùng',
      );
    }
  }

  // =============================================================================
  // PUBLIC METHODS - PASSWORD RESET
  // =============================================================================

  /**
   * Khởi tạo reset password
   */
  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<void> {
    this.logger.log(
      `Yêu cầu reset password cho email: ${forgotPasswordDto.email}`,
    );

    try {
      const user = await this.prisma.user.findUnique({
        where: {
          email: forgotPasswordDto.email,
          deletedAt: null,
        },
        select: { id: true, email: true },
      });

      // Luôn trả về success để bảo mật (không tiết lộ email có tồn tại không)
      if (!user) {
        this.logger.warn(
          `Reset password request cho email không tồn tại: ${forgotPasswordDto.email}`,
        );
        return;
      }

      const resetToken = this.generateSecureToken();
      const resetTokenExpiry = new Date(
        Date.now() + PASSWORD_RESET_TOKEN_EXPIRY,
      );

      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          passwordResetToken: resetToken,
          passwordResetTokenExpiry: resetTokenExpiry,
        },
      });

      // TODO: Gửi email với reset token
      this.logger.log(`Reset token được tạo cho user ID: ${user.id}`);
    } catch (error) {
      this.logger.error(
        `Lỗi khi xử lý forgot password: ${error.message}`,
        error.stack,
      );
      // Không throw error vì lý do bảo mật
    }
  }

  /**
   * Reset password bằng token
   */
  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<void> {
    this.logger.log(`Thử reset password với token`);

    try {
      const { token, newPassword, confirmPassword } = resetPasswordDto;

      // Validate password confirmation
      if (newPassword !== confirmPassword) {
        throw new BadRequestException(
          'Mật khẩu mới và xác nhận mật khẩu không khớp',
        );
      }

      // Tìm user với valid reset token
      const user = await this.prisma.user.findFirst({
        where: {
          passwordResetToken: token,
          passwordResetTokenExpiry: {
            gt: new Date(),
          },
          deletedAt: null,
        },
        select: { id: true },
      });

      if (!user) {
        throw new BadRequestException(
          'Token reset mật khẩu không hợp lệ hoặc đã hết hạn',
        );
      }

      // Validate new password strength
      this.validatePasswordStrength(newPassword);

      // Hash new password và clear reset token
      const hashedPassword = await this.hashPassword(newPassword);
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          hashedPassword,
          passwordResetToken: null,
          passwordResetTokenExpiry: null,
        },
      });

      this.logger.log(`Reset password thành công cho user ID: ${user.id}`);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(
        `Lỗi khi reset password: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException('Không thể reset mật khẩu');
    }
  }

  // =============================================================================
  // PUBLIC METHODS - ADMIN OPERATIONS
  // =============================================================================

  /**
   * Admin action trên user
   */
  async adminAction(
    id: number,
    actionDto: AdminUserActionDto,
  ): Promise<UserResponseDto> {
    this.logger.log(`Admin action ${actionDto.action} trên user ID: ${id}`);

    try {
      const user = await this.findOne(id, true);
      let updateData: Partial<Prisma.UserUpdateInput> = {};

      switch (actionDto.action) {
        case AdminUserAction.SUSPEND:
          updateData = { deletedAt: new Date() };
          break;
        case AdminUserAction.ACTIVATE:
          updateData = { deletedAt: null };
          break;
        case AdminUserAction.FORCE_PASSWORD_RESET:
          const resetToken = this.generateSecureToken();
          updateData = {
            passwordResetToken: resetToken,
            passwordResetTokenExpiry: new Date(
              Date.now() + PASSWORD_RESET_TOKEN_EXPIRY,
            ),
          };
          break;
        default:
          throw new BadRequestException('Hành động không hợp lệ');
      }

      const updatedUser = await this.prisma.user.update({
        where: { id },
        data: updateData,
        include: DETAILED_INCLUDES,
      });

      this.logger.log(
        `✅ Thực hiện action '${actionDto.action}' thành công cho user ID: ${id}`,
      );

      return this.formatUserResponse(updatedUser);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      this.logger.error(
        `Lỗi khi thực hiện admin action: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Không thể thực hiện hành động quản trị',
      );
    }
  }

  /**
   * Export dữ liệu users
   */
  async exportUsers(exportDto: UserExportDto): Promise<FullUser[]> {
    this.logger.log(`Export users với format: ${exportDto.format}`);

    try {
      const { includeDeleted = false, fields, format } = exportDto;

      const where: Prisma.UserWhereInput = includeDeleted
        ? {}
        : { deletedAt: null };

      const users = await this.prisma.user.findMany({
        where,
        include: EXPORT_INCLUDES,
        orderBy: { createdAt: 'desc' },
      });

      // TODO: Filter fields theo yêu cầu nếu được chỉ định
      // TODO: Format data theo format (CSV, JSON, Excel) nếu cần

      this.logger.log(`Exported ${users.length} users`);
      return users;
    } catch (error) {
      this.logger.error(`Lỗi khi export users: ${error.message}`, error.stack);
      throw new InternalServerErrorException(
        'Không thể xuất dữ liệu người dùng',
      );
    }
  }
}
