import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateUserDto,
  UpdateUserDto,
  UserQueryDto,
  UserResponseDto,
} from './dto/user.dto';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}
  async findAll(query: UserQueryDto) {
    const {
      page = 1,
      limit = 10,
      search,
      roleId,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      includeDeleted = false,
      deleted = false,
    } = query;

    // Ensure numbers are properly converted
    const pageNum = typeof page === 'string' ? parseInt(page, 10) : page;
    const limitNum = typeof limit === 'string' ? parseInt(limit, 10) : limit;
    const roleIdNum =
      typeof roleId === 'string' ? parseInt(roleId, 10) : roleId;

    const skip = (pageNum - 1) * limitNum;
    const take = limitNum;

    // Build where clause
    const where: Prisma.UserWhereInput = {};

    // Handle deleted filter
    if (deleted) {
      // Only show deleted users
      where.deletedAt = { not: null };
    } else if (includeDeleted) {
      // Show all users (deleted and not deleted)
      where.deletedAt = undefined;
    } else {
      // Only show non-deleted users (default)
      where.deletedAt = null;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (roleIdNum) {
      where.roleId = roleIdNum;
    }

    // Build orderBy
    const orderBy: Prisma.UserOrderByWithRelationInput = {};
    orderBy[sortBy] = sortOrder; // Include related data (without profile for list API)
    const include: Prisma.UserInclude = {
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
    };

    // Execute queries
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take,
        orderBy,
        include,
      }),
      this.prisma.user.count({ where }),
    ]);
    const totalPages = Math.ceil(total / limitNum);
    return {
      data: users.map(this.formatUserListResponse),
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      },
    };
  }

  async findOne(id: number): Promise<UserResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        role: {
          select: {
            id: true,
            name: true,
            description: true,
            permissions: {
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
          },
        },
        accounts: {
          select: {
            id: true,
            provider: true,
            type: true,
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
          },
        },
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return this.formatUserResponse(user);
  }
  async create(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    // Hash password if provided
    const hashedPassword = createUserDto.password
      ? await bcrypt.hash(createUserDto.password, 10)
      : createUserDto.hashedPassword;

    // Extract profile data and other fields
    const { password, profile, emailVerified, ...userData } = createUserDto;

    // Prepare user data
    const userCreateData: any = {
      ...userData,
      hashedPassword,
      emailVerified: emailVerified ? new Date(emailVerified) : null,
    };

    // If profile data is provided, include it in the create operation
    if (profile) {
      userCreateData.profile = {
        create: {
          bio: profile.bio || null,
          avatarUrl: profile.avatarUrl || null,
          socialLinks: profile.socialLinks || null,
        },
      };
    }
    const user = await this.prisma.user.create({
      data: userCreateData,
      include: {
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
      },
    });

    return this.formatUserResponse(user);
  }
  async update(
    id: number,
    updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    // Extract profile data from updateUserDto if present
    const { profile, ...userData } = updateUserDto as any; // Update user data first
    const user = await this.prisma.user.update({
      where: { id },
      data: userData,
      include: {
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
      },
    });

    // Update profile if profile data is provided
    if (profile) {
      await this.prisma.userProfile.upsert({
        where: { userId: id },
        update: {
          bio: profile.bio,
          avatarUrl: profile.avatarUrl,
          socialLinks: profile.socialLinks,
        },
        create: {
          userId: id,
          bio: profile.bio || '',
          avatarUrl: profile.avatarUrl || '',
          socialLinks: profile.socialLinks || {},
        },
      });
    }

    return this.formatUserResponse(user);
  }

  async remove(id: number): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async bulkDelete(userIds: string[]): Promise<{
    deletedCount: number;
    failedIds: string[];
  }> {
    const results = {
      deletedCount: 0,
      failedIds: [] as string[],
    };

    for (const userId of userIds) {
      try {
        await this.prisma.user.update({
          where: { id: parseInt(userId) },
          data: { deletedAt: new Date() },
        });
        results.deletedCount++;
      } catch (error) {
        results.failedIds.push(userId);
      }
    }

    return results;
  }

  // Restore a user (undelete)
  async restore(id: number): Promise<UserResponseDto> {
    // Check if user exists and is deleted
    const user = await this.prisma.user.findUnique({
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

    if (!user) {
      throw new Error('User not found');
    }

    if (!user.deletedAt) {
      throw new Error('User is not deleted');
    }

    // Restore user by setting deletedAt to null
    const restoredUser = await this.prisma.user.update({
      where: { id },
      data: { deletedAt: null },
      include: {
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
      },
    });

    return restoredUser;
  }

  // Permanently delete a user (hard delete)
  async permanentDelete(id: number): Promise<void> {
    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Delete user permanently from database
    await this.prisma.user.delete({
      where: { id },
    });
  }
  // Bulk restore users
  async bulkRestore(
    userIds: string[],
  ): Promise<{ restoredCount: number; failedIds: string[] }> {
    const failedIds: string[] = [];
    let restoredCount = 0;

    for (const id of userIds) {
      try {
        await this.restore(parseInt(id));
        restoredCount++;
      } catch (error) {
        failedIds.push(id);
      }
    }

    return { restoredCount, failedIds };
  }
  // Bulk permanent delete users
  async bulkPermanentDelete(
    userIds: string[],
  ): Promise<{ deletedCount: number; failedIds: string[] }> {
    const failedIds: string[] = [];
    let deletedCount = 0;
    for (const id of userIds) {
      try {
        await this.permanentDelete(parseInt(id));
        deletedCount++;
      } catch (error) {
        failedIds.push(id);
      }
    }

    return { deletedCount, failedIds };
  }

  async getUserStats(deleted: boolean = false) {
    if (deleted) {
      // Stats for deleted users
      const [totalDeleted, deletedToday, needsReview] = await Promise.all([
        // Total deleted users
        this.prisma.user.count({
          where: { deletedAt: { not: null } },
        }),

        // Deleted today
        this.prisma.user.count({
          where: {
            deletedAt: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)), // Start of today
              lt: new Date(new Date().setHours(23, 59, 59, 999)), // End of today
            },
          },
        }),

        // Need review (deleted more than 30 days ago)
        this.prisma.user.count({
          where: {
            deletedAt: {
              lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
              not: null,
            },
          },
        }),
      ]);

      // Get total users for percentage calculation
      const total = await this.prisma.user.count();

      return {
        total,
        totalDeleted,
        deletedToday,
        needsReview,
        verified: 0, // Not relevant for deleted stats
        unverified: 0, // Not relevant for deleted stats
        admins: 0, // Not relevant for deleted stats
        recentlyJoined: 0, // Not relevant for deleted stats
      };
    }

    // Stats for active users (original logic)
    const [total, verified, unverified, admins, recentlyJoined] =
      await Promise.all([
        // Total users
        this.prisma.user.count({
          where: { deletedAt: null },
        }),

        // Verified users
        this.prisma.user.count({
          where: {
            deletedAt: null,
            emailVerified: { not: null },
          },
        }),

        // Unverified users
        this.prisma.user.count({
          where: {
            deletedAt: null,
            emailVerified: null,
          },
        }),

        // Admin users
        this.prisma.user.count({
          where: {
            deletedAt: null,
            role: {
              name: { in: ['admin', 'Admin'] },
            },
          },
        }),

        // Recently joined (last 30 days)
        this.prisma.user.count({
          where: {
            deletedAt: null,
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
            },
          },
        }),
      ]);

    return {
      total,
      verified,
      unverified,
      admins,
      recentlyJoined,
    };
  }
  private formatUserResponse(user: any): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      image: user.image,
      emailVerified: user.emailVerified,
      roleId: user.roleId,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      deletedAt: user.deletedAt,
      role: user.role,
      _count: user._count,
    };
  }

  private formatUserListResponse(user: any) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      image: user.image,
      emailVerified: user.emailVerified,
      roleId: user.roleId,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      deletedAt: user.deletedAt,
      role: user.role,
      _count: user._count,
      // Note: profile is intentionally excluded for list API
    };
  }

  async findDetailById(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
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
            likedBlogs: true,
            bookmarkedBlogs: true,
            blogComments: true,
            contactSubmissionResponses: true,
            medias: true,
            recruitments: true,
            userSessions: true,
            sessions: true,
          },
        },
        // Recent blogs (last 5)
        blogs: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            title: true,
            slug: true,
            publishedAt: true,
            viewCount: true,
            isFeatured: true,
            status: {
              select: {
                name: true,
              },
            },
          },
        },
        // Recent comments (last 10)
        blogComments: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            content: true,
            createdAt: true,
            blog: {
              select: {
                id: true,
                title: true,
                slug: true,
              },
            },
          },
        },
        // Recent recruitment posts (last 5)
        recruitments: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            title: true,
            slug: true,
            publishedAt: true,
            status: {
              select: {
                name: true,
              },
            },
          },
        },
        // Recent contact submission responses (last 5)
        contactSubmissionResponses: {
          take: 5,
          orderBy: { respondedAt: 'desc' },
          select: {
            id: true,
            email: true,
            subject: true,
            respondedAt: true,
            responseMessage: true,
          },
        },
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }
}
