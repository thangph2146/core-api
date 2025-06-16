import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto, UpdateUserDto, UserQueryDto, UserResponseDto } from './dto/user.dto';
import { Prisma } from '@prisma/client';

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
    } = query;

    // Ensure numbers are properly converted
    const pageNum = typeof page === 'string' ? parseInt(page, 10) : page;
    const limitNum = typeof limit === 'string' ? parseInt(limit, 10) : limit;
    const roleIdNum = typeof roleId === 'string' ? parseInt(roleId, 10) : roleId;

    const skip = (pageNum - 1) * limitNum;
    const take = limitNum;

    // Build where clause
    const where: Prisma.UserWhereInput = {
      deletedAt: includeDeleted ? undefined : null,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }    if (roleIdNum) {
      where.roleId = roleIdNum;
    }

    // Build orderBy
    const orderBy: Prisma.UserOrderByWithRelationInput = {};
    orderBy[sortBy] = sortOrder;

    // Include related data
    const include: Prisma.UserInclude = {
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
    ]);    const totalPages = Math.ceil(total / limitNum);

    return {
      data: users.map(this.formatUserResponse),
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
    const user = await this.prisma.user.create({
      data: createUserDto,
      include: {
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

  async update(id: number, updateUserDto: UpdateUserDto): Promise<UserResponseDto> {
    const user = await this.prisma.user.update({
      where: { id },
      data: updateUserDto,
      include: {
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

  async remove(id: number): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async restore(id: number): Promise<UserResponseDto> {
    const user = await this.prisma.user.update({
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
        profile: {
          select: {
            id: true,
            bio: true,
            avatarUrl: true,
            socialLinks: true,
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

  async hardDelete(id: number): Promise<void> {
    await this.prisma.user.delete({
      where: { id },
    });
  }

  async getUserStats() {
    const [total, active, withRoles, recentlyJoined] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { deletedAt: null } }),
      this.prisma.user.count({ where: { roleId: { not: null } } }),
      this.prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          },
        },
      }),
    ]);

    return {
      total,
      active,
      withRoles,
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
      profile: user.profile,
      _count: user._count,
    };
  }
}
