import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role, Prisma } from '@prisma/client';
import {
  CreateRoleDto,
  UpdateRoleDto,
  RoleQueryDto,
  RoleOptionDto,
  RoleStatsDto,
} from './dto/role.dto';

@Injectable()
export class RoleService {
  constructor(private prisma: PrismaService) {}
  async findAll(query: RoleQueryDto) {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      includeDeleted = false,
      deleted = false,
      includePermissions = true,
      includeUserCount = true,
    } = query;

    // Ensure numbers are properly converted
    const pageNum = typeof page === 'string' ? parseInt(page, 10) : page;
    const limitNum = typeof limit === 'string' ? parseInt(limit, 10) : limit;

    const skip = (pageNum - 1) * limitNum;
    const take = limitNum;

    // Build where clause
    const where: Prisma.RoleWhereInput = {};

    // Handle deleted filter
    if (deleted) {
      // Only show deleted roles
      where.deletedAt = { not: null };
    } else if (includeDeleted) {
      // Show all roles (deleted and not deleted)
      where.deletedAt = undefined;
    } else {
      // Only show non-deleted roles (default)
      where.deletedAt = null;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Build orderBy
    const orderBy: Prisma.RoleOrderByWithRelationInput = {};
    orderBy[sortBy] = sortOrder;

    // Include related data
    const include: Prisma.RoleInclude = {
      _count: {
        select: {
          users: true,
        },
      },
    };

    if (includePermissions) {
      include.permissions = {
        where: { deletedAt: null },
        select: {
          id: true,
          name: true,
          description: true,
        },
      };
    }

    // Execute queries
    const [roles, total] = await Promise.all([
      this.prisma.role.findMany({
        where,
        skip,
        take,
        orderBy,
        include,
      }),
      this.prisma.role.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limitNum);

    return {
      data: roles,
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
  async findById(id: number): Promise<Role | null> {
    return this.prisma.role.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        permissions: {
          where: { deletedAt: null },
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        _count: {
          select: {
            users: true,
          },
        },
      },
    });
  }

  async findByName(name: string): Promise<Role | null> {
    return this.prisma.role.findFirst({
      where: {
        name,
        deletedAt: null,
      },
      include: {
        permissions: {
          where: { deletedAt: null },
        },
        _count: {
          select: {
            users: true,
          },
        },
      },
    });
  }

  async findWithPermissions(id: number): Promise<Role | null> {
    return this.prisma.role.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        permissions: {
          where: { deletedAt: null },
        },
        users: {
          where: { deletedAt: null },
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            users: true,
            permissions: true,
          },
        },
      },
    });
  }
  async create(createRoleDto: CreateRoleDto): Promise<Role> {
    const { permissionIds, ...roleData } = createRoleDto;

    // Check if role name already exists
    const existingRole = await this.prisma.role.findFirst({
      where: {
        name: roleData.name,
        deletedAt: null,
      },
    });

    if (existingRole) {
      throw new ConflictException('Vai trò với tên này đã tồn tại');
    }

    // Prepare role data with permissions
    const data: Prisma.RoleCreateInput = {
      ...roleData,
    };

    if (permissionIds && permissionIds.length > 0) {
      data.permissions = {
        connect: permissionIds.map((id) => ({ id })),
      };
    }

    return this.prisma.role.create({
      data,
      include: {
        permissions: {
          where: { deletedAt: null },
        },
        _count: {
          select: { users: true },
        },
      },
    });
  }

  async update(id: number, updateRoleDto: UpdateRoleDto): Promise<Role> {
    const role = await this.findById(id);
    if (!role) {
      throw new NotFoundException('Role not found');
    }

    const { permissionIds, ...roleData } = updateRoleDto;

    // Check if role name already exists (excluding current role)
    if (roleData.name) {
      const existingRole = await this.prisma.role.findFirst({
        where: {
          name: roleData.name,
          deletedAt: null,
          NOT: { id },
        },
      });

      if (existingRole) {
        throw new ConflictException('Vai trò với tên này đã tồn tại');
      }
    }

    // Prepare update data
    const data: Prisma.RoleUpdateInput = {
      ...roleData,
      updatedAt: new Date(),
    };

    // Update permissions if provided
    if (permissionIds !== undefined) {
      // Disconnect all current permissions
      await this.prisma.role.update({
        where: { id },
        data: {
          permissions: {
            set: [],
          },
        },
      });

      // Connect new permissions
      if (permissionIds.length > 0) {
        data.permissions = {
          connect: permissionIds.map((permId) => ({ id: permId })),
        };
      }
    }

    return this.prisma.role.update({
      where: { id },
      data,
      include: {
        permissions: {
          where: { deletedAt: null },
        },
        _count: {
          select: { users: true },
        },
      },
    });
  }
  async delete(id: number): Promise<Role> {
    const role = await this.findById(id);
    if (!role) {
      throw new NotFoundException('Role not found');
    }

    // Check if role has users
    const userCount = await this.prisma.user.count({
      where: {
        roleId: id,
        deletedAt: null,
      },
    });

    if (userCount > 0) {
      throw new ConflictException('Cannot delete role that has assigned users');
    }

    return this.prisma.role.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
      include: {
        permissions: {
          where: { deletedAt: null },
        },
        _count: {
          select: { users: true },
        },
      },
    });
  }

  async getRoleOptions(): Promise<RoleOptionDto[]> {
    try {
      const roles = await this.prisma.role.findMany({
        where: {
          deletedAt: null,
        },
        select: {
          id: true,
          name: true,
        },
        orderBy: {
          name: 'asc',
        },
      });

      return roles.map((role) => ({
        value: role.id,
        label: role.name,
      }));
    } catch (error) {
      console.error('Error fetching role options:', error);
      return [];
    }
  }
  async getRoleStats(deleted: boolean = false): Promise<RoleStatsDto> {
    const whereCondition = deleted
      ? { deletedAt: { not: null } }
      : { deletedAt: null };

    const [totalRoles, rolesWithUsers, rolesWithoutUsers] = await Promise.all([
      this.prisma.role.count({ where: whereCondition }),
      this.prisma.role.count({
        where: {
          ...whereCondition,
          users: {
            some: {
              deletedAt: null,
            },
          },
        },
      }),
      this.prisma.role.count({
        where: {
          ...whereCondition,
          users: {
            none: {
              deletedAt: null,
            },
          },
        },
      }),
    ]);

    const activeRoles = deleted ? 0 : totalRoles;
    const deletedRoles = deleted
      ? totalRoles
      : await this.prisma.role.count({
          where: { deletedAt: { not: null } },
        });

    return {
      totalRoles: deleted ? totalRoles : activeRoles + deletedRoles,
      activeRoles,
      deletedRoles,
      rolesWithUsers,
      rolesWithoutUsers,
    };
  }

  async bulkDelete(ids: number[]): Promise<{ deletedCount: number }> {
    // Check if any roles have users
    const rolesWithUsers = await this.prisma.role.findMany({
      where: {
        id: { in: ids },
        users: {
          some: {
            deletedAt: null,
          },
        },
      },
      select: { id: true, name: true },
    });

    if (rolesWithUsers.length > 0) {
      const roleNames = rolesWithUsers.map((r) => r.name).join(', ');
      throw new ConflictException(
        `Cannot delete roles that have assigned users: ${roleNames}`,
      );
    }

    const result = await this.prisma.role.updateMany({
      where: {
        id: { in: ids },
        deletedAt: null,
      },
      data: {
        deletedAt: new Date(),
      },
    });

    return { deletedCount: result.count };
  }

  async restore(id: number): Promise<Role> {
    const role = await this.prisma.role.findUnique({
      where: { id },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    if (!role.deletedAt) {
      throw new ConflictException('Role is not deleted');
    }

    return this.prisma.role.update({
      where: { id },
      data: {
        deletedAt: null,
        updatedAt: new Date(),
      },
      include: {
        permissions: {
          where: { deletedAt: null },
        },
        _count: {
          select: { users: true },
        },
      },
    });
  }

  async bulkRestore(ids: number[]): Promise<{ restoredCount: number }> {
    const result = await this.prisma.role.updateMany({
      where: {
        id: { in: ids },
        deletedAt: { not: null },
      },
      data: {
        deletedAt: null,
        updatedAt: new Date(),
      },
    });

    return { restoredCount: result.count };
  }
  async bulkPermanentDelete(ids: number[]): Promise<{ deletedCount: number }> {
    return this.prisma.role
      .deleteMany({
        where: {
          id: { in: ids },
          deletedAt: { not: null },
        },
      })
      .then((result) => ({ deletedCount: result.count }));
  }
}
