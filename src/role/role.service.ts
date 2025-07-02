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
  BulkDeleteResponseDto,
  BulkRestoreResponseDto,
  BulkPermanentDeleteResponseDto,
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
    };

    // Only update permissions if the permissionIds array is provided in the DTO
    if (permissionIds !== undefined) {
      data.permissions = {
        set: permissionIds.map((permId) => ({ id: permId })),
      };
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
      totalRoles: activeRoles + deletedRoles,
      activeRoles,
      deletedRoles,
      rolesWithUsers,
      rolesWithoutUsers,
    };
  }

  async bulkDelete(ids: number[]): Promise<BulkDeleteResponseDto> {
    const deletedIds: number[] = [];
    const skippedIds: number[] = [];
    const errors: string[] = [];

    // Check which roles exist and are not deleted
    const existingRoles = await this.prisma.role.findMany({
      where: {
        id: { in: ids },
        deletedAt: null,
      },
      select: { id: true, name: true },
    });

    const existingIds = existingRoles.map(r => r.id);
    const nonExistingIds = ids.filter(id => !existingIds.includes(id));

    // Check if any existing roles have users
    const rolesWithUsers = await this.prisma.role.findMany({
      where: {
        id: { in: existingIds },
        users: {
          some: {
            deletedAt: null,
          },
        },
      },
      select: { id: true, name: true },
    });

    const roleIdsWithUsers = rolesWithUsers.map(r => r.id);
    const deletableIds = existingIds.filter(id => !roleIdsWithUsers.includes(id));

    // Add skipped roles with reasons
    if (nonExistingIds.length > 0) {
      skippedIds.push(...nonExistingIds);
      errors.push(`Vai trò không tồn tại hoặc đã bị xóa: ID ${nonExistingIds.join(', ')}`);
    }

    if (roleIdsWithUsers.length > 0) {
      skippedIds.push(...roleIdsWithUsers);
      const roleNames = rolesWithUsers.map(r => r.name).join(', ');
      errors.push(`Không thể xóa vai trò đang được sử dụng: ${roleNames}`);
    }

    // Perform bulk delete for deletable roles
    if (deletableIds.length > 0) {
      await this.prisma.role.updateMany({
        where: {
          id: { in: deletableIds },
          deletedAt: null,
        },
        data: {
          deletedAt: new Date(),
        },
      });
      deletedIds.push(...deletableIds);
    }

    const success = deletedIds.length > 0;
    const message = success 
      ? `Đã xóa thành công ${deletedIds.length} vai trò${skippedIds.length > 0 ? `, bỏ qua ${skippedIds.length} vai trò` : ''}`
      : 'Không có vai trò nào được xóa';

    return {
      success,
      deletedCount: deletedIds.length,
      skippedCount: skippedIds.length,
      message,
      details: {
        deletedIds,
        skippedIds,
        errors: errors.length > 0 ? errors : undefined,
      },
    };
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

  async bulkRestore(ids: number[]): Promise<BulkRestoreResponseDto> {
    const restoredIds: number[] = [];
    const skippedIds: number[] = [];
    const errors: string[] = [];

    // Check which roles exist and are deleted
    const deletedRoles = await this.prisma.role.findMany({
      where: {
        id: { in: ids },
        deletedAt: { not: null },
      },
      select: { id: true, name: true },
    });

    const deletedRoleIds = deletedRoles.map(r => r.id);
    const nonDeletedIds = ids.filter(id => !deletedRoleIds.includes(id));

    // Add skipped roles with reasons
    if (nonDeletedIds.length > 0) {
      skippedIds.push(...nonDeletedIds);
      errors.push(`Vai trò không tồn tại hoặc chưa bị xóa: ID ${nonDeletedIds.join(', ')}`);
    }

    // Perform bulk restore for restorable roles
    if (deletedRoleIds.length > 0) {
      await this.prisma.role.updateMany({
        where: {
          id: { in: deletedRoleIds },
          deletedAt: { not: null },
        },
        data: {
          deletedAt: null,
          updatedAt: new Date(),
        },
      });
      restoredIds.push(...deletedRoleIds);
    }

    const success = restoredIds.length > 0;
    const message = success 
      ? `Đã khôi phục thành công ${restoredIds.length} vai trò${skippedIds.length > 0 ? `, bỏ qua ${skippedIds.length} vai trò` : ''}`
      : 'Không có vai trò nào được khôi phục';

    return {
      success,
      restoredCount: restoredIds.length,
      skippedCount: skippedIds.length,
      message,
      details: {
        restoredIds,
        skippedIds,
        errors: errors.length > 0 ? errors : undefined,
      },
    };
  }
  async permanentDelete(id: number): Promise<void> {
    const role = await this.prisma.role.findUnique({ where: { id } });
    if (!role) {
      throw new NotFoundException('Role not found');
    }

    // Optional: Check if the role is soft-deleted before permanent deletion
    if (!role.deletedAt) {
      throw new ConflictException(
        'Role must be soft-deleted before permanent deletion.',
      );
    }
    
    // Check if role has users
    const userCount = await this.prisma.user.count({
      where: {
        roleId: id,
      },
    });

    if (userCount > 0) {
      throw new ConflictException(
        'Cannot permanently delete role that has assigned users.',
      );
    }
    
    await this.prisma.role.delete({ where: { id } });
  }
  async bulkPermanentDelete(ids: number[]): Promise<BulkPermanentDeleteResponseDto> {
    const deletedIds: number[] = [];
    const skippedIds: number[] = [];
    const errors: string[] = [];

    // Check which roles exist and are soft-deleted
    const softDeletedRoles = await this.prisma.role.findMany({
      where: {
        id: { in: ids },
        deletedAt: { not: null },
      },
      select: { id: true, name: true },
    });

    const softDeletedRoleIds = softDeletedRoles.map(r => r.id);
    const nonSoftDeletedIds = ids.filter(id => !softDeletedRoleIds.includes(id));

    // Check if any soft-deleted roles have users
    const rolesWithUsers = await this.prisma.user.findMany({
      where: {
        roleId: { in: softDeletedRoleIds },
      },
      select: { roleId: true },
      distinct: ['roleId'],
    });

    const roleIdsWithUsers = rolesWithUsers
      .map(u => u.roleId)
      .filter((id): id is number => id !== null);
    const deletableIds = softDeletedRoleIds.filter(id => !roleIdsWithUsers.includes(id));

    // Add skipped roles with reasons
    if (nonSoftDeletedIds.length > 0) {
      skippedIds.push(...nonSoftDeletedIds);
      errors.push(`Vai trò không tồn tại hoặc chưa bị xóa mềm: ID ${nonSoftDeletedIds.join(', ')}`);
    }

    if (roleIdsWithUsers.length > 0) {
      skippedIds.push(...roleIdsWithUsers);
      errors.push(`Không thể xóa vĩnh viễn vai trò đang được sử dụng: ID ${roleIdsWithUsers.join(', ')}`);
    }

    // Perform bulk permanent delete for deletable roles
    if (deletableIds.length > 0) {
      await this.prisma.role.deleteMany({
        where: {
          id: { in: deletableIds },
          deletedAt: { not: null },
        },
      });
      deletedIds.push(...deletableIds);
    }

    const success = deletedIds.length > 0;
    const message = success 
      ? `Đã xóa vĩnh viễn thành công ${deletedIds.length} vai trò${skippedIds.length > 0 ? `, bỏ qua ${skippedIds.length} vai trò` : ''}`
      : 'Không có vai trò nào được xóa vĩnh viễn';

    return {
      success,
      deletedCount: deletedIds.length,
      skippedCount: skippedIds.length,
      message,
      details: {
        deletedIds,
        skippedIds,
        errors: errors.length > 0 ? errors : undefined,
      },
    };
  }
}
