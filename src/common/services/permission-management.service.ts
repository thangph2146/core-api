import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  ALL_PERMISSIONS,
  DEFAULT_ROLES,
} from '../constants/permissions.constants';

export interface PermissionSummary {
  id: number;
  name: string;
  description: string | null;
  category: string;
  roleCount: number;
}

export interface RoleWithPermissions {
  id: number;
  name: string;
  description: string | null;
  permissions: Array<{
    id: number;
    name: string;
    description: string | null;
  }>;
  userCount: number;
}

@Injectable()
export class PermissionManagementService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all permissions with categorization
   */
  async getAllPermissions(): Promise<PermissionSummary[]> {
    const permissions = await this.prisma.permission.findMany({
      where: { deletedAt: null },
      include: {
        roles: {
          where: { deletedAt: null },
          select: { id: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return permissions.map((permission) => ({
      id: permission.id,
      name: permission.name,
      description: permission.description,
      category: this.getCategoryFromPermission(permission.name),
      roleCount: permission.roles.length,
    }));
  }

  /**
   * Get permissions grouped by category
   */
  async getPermissionsByCategory(): Promise<
    Record<string, PermissionSummary[]>
  > {
    const permissions = await this.getAllPermissions();

    return permissions.reduce(
      (acc, permission) => {
        const category = permission.category;
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push(permission);
        return acc;
      },
      {} as Record<string, PermissionSummary[]>,
    );
  }

  /**
   * Get all roles with their permissions
   */
  async getAllRolesWithPermissions(): Promise<RoleWithPermissions[]> {
    const roles = await this.prisma.role.findMany({
      where: { deletedAt: null },
      include: {
        permissions: {
          where: { deletedAt: null },
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        users: {
          where: { deletedAt: null },
          select: { id: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return roles.map((role) => ({
      id: role.id,
      name: role.name,
      description: role.description,
      permissions: role.permissions,
      userCount: role.users.length,
    }));
  }

  /**
   * Get specific role with permissions
   */
  async getRoleWithPermissions(roleId: number): Promise<RoleWithPermissions> {
    const role = await this.prisma.role.findUnique({
      where: { id: roleId, deletedAt: null },
      include: {
        permissions: {
          where: { deletedAt: null },
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        users: {
          where: { deletedAt: null },
          select: { id: true },
        },
      },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    return {
      id: role.id,
      name: role.name,
      description: role.description,
      permissions: role.permissions,
      userCount: role.users.length,
    };
  }

  /**
   * Assign permissions to role
   */
  async assignPermissionsToRole(
    roleId: number,
    permissionIds: number[],
  ): Promise<RoleWithPermissions> {
    // Verify role exists
    const role = await this.prisma.role.findUnique({
      where: { id: roleId, deletedAt: null },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    // Verify all permissions exist
    const permissions = await this.prisma.permission.findMany({
      where: {
        id: { in: permissionIds },
        deletedAt: null,
      },
    });

    if (permissions.length !== permissionIds.length) {
      throw new BadRequestException('Some permissions not found');
    }

    // Update role permissions
    await this.prisma.role.update({
      where: { id: roleId },
      data: {
        permissions: {
          set: permissionIds.map((id) => ({ id })),
        },
        updatedAt: new Date(),
      },
    });

    return this.getRoleWithPermissions(roleId);
  }

  /**
   * Remove permissions from role
   */
  async removePermissionsFromRole(
    roleId: number,
    permissionIds: number[],
  ): Promise<RoleWithPermissions> {
    // Verify role exists
    const role = await this.prisma.role.findUnique({
      where: { id: roleId, deletedAt: null },
      include: {
        permissions: {
          select: { id: true },
        },
      },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    // Get current permission IDs
    const currentPermissionIds = role.permissions.map((p) => p.id);

    // Remove specified permissions
    const newPermissionIds = currentPermissionIds.filter(
      (id) => !permissionIds.includes(id),
    );

    // Update role permissions
    await this.prisma.role.update({
      where: { id: roleId },
      data: {
        permissions: {
          set: newPermissionIds.map((id) => ({ id })),
        },
        updatedAt: new Date(),
      },
    });

    return this.getRoleWithPermissions(roleId);
  }

  /**
   * Get user permissions (flattened)
   */
  async getUserPermissions(userId: number): Promise<string[]> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId, deletedAt: null },
      include: {
        role: {
          include: {
            permissions: {
              where: { deletedAt: null },
              select: { name: true },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user.role?.permissions.map((p) => p.name) || [];
  }

  /**
   * Check if user has specific permission
   */
  async userHasPermission(
    userId: number,
    permissionName: string,
  ): Promise<boolean> {
    const userPermissions = await this.getUserPermissions(userId);

    // Super admin bypass
    if (userPermissions.includes('admin:full_access')) {
      return true;
    }

    return userPermissions.includes(permissionName);
  }

  /**
   * Check if user has any of the specified permissions
   */
  async userHasAnyPermission(
    userId: number,
    permissionNames: string[],
  ): Promise<boolean> {
    const userPermissions = await this.getUserPermissions(userId);

    // Super admin bypass
    if (userPermissions.includes('admin:full_access')) {
      return true;
    }

    return permissionNames.some((permission) =>
      userPermissions.includes(permission),
    );
  }

  /**
   * Get users by permission
   */
  async getUsersByPermission(permissionName: string): Promise<
    Array<{
      id: number;
      email: string;
      name: string | null;
      roleName: string | null;
    }>
  > {
    const users = await this.prisma.user.findMany({
      where: {
        deletedAt: null,
        role: {
          permissions: {
            some: {
              name: permissionName,
              deletedAt: null,
            },
          },
        },
      },
      include: {
        role: {
          select: { name: true },
        },
      },
    });

    return users.map((user) => ({
      id: user.id,
      email: user.email,
      name: user.name,
      roleName: user.role?.name || null,
    }));
  }

  /**
   * Sync permissions from constants to database
   */
  async syncPermissions(): Promise<{
    created: number;
    updated: number;
    errors: string[];
  }> {
    const errors: string[] = [];
    let created = 0;
    let updated = 0;

    try {
      for (const permissionName of ALL_PERMISSIONS) {
        try {
          const permission = await this.prisma.permission.upsert({
            where: { name: permissionName },
            update: {
              description: `Permission to ${permissionName.replace(':', ' ')}`,
              updatedAt: new Date(),
            },
            create: {
              name: permissionName,
              description: `Permission to ${permissionName.replace(':', ' ')}`,
            },
          });

          if (permission.createdAt === permission.updatedAt) {
            created++;
          } else {
            updated++;
          }
        } catch (error) {
          errors.push(
            `Failed to sync permission ${permissionName}: ${error.message}`,
          );
        }
      }
    } catch (error) {
      errors.push(`Sync operation failed: ${error.message}`);
    }

    return { created, updated, errors };
  }

  /**
   * Get category from permission name
   */
  private getCategoryFromPermission(permissionName: string): string {
    const [category] = permissionName.split(':');
    return category.charAt(0).toUpperCase() + category.slice(1);
  }

  /**
   * Get permission usage statistics
   */
  async getPermissionStats(): Promise<{
    totalPermissions: number;
    totalRoles: number;
    totalUsers: number;
    permissionsPerCategory: Record<string, number>;
    rolesWithoutPermissions: number;
    usersWithoutRoles: number;
  }> {
    const [
      totalPermissions,
      totalRoles,
      totalUsers,
      permissions,
      rolesWithoutPermissions,
      usersWithoutRoles,
    ] = await Promise.all([
      this.prisma.permission.count({ where: { deletedAt: null } }),
      this.prisma.role.count({ where: { deletedAt: null } }),
      this.prisma.user.count({ where: { deletedAt: null } }),
      this.prisma.permission.findMany({
        where: { deletedAt: null },
        select: { name: true },
      }),
      this.prisma.role.count({
        where: {
          deletedAt: null,
          permissions: { none: {} },
        },
      }),
      this.prisma.user.count({
        where: {
          deletedAt: null,
          roleId: null,
        },
      }),
    ]);

    const permissionsPerCategory = permissions.reduce(
      (acc, permission) => {
        const category = this.getCategoryFromPermission(permission.name);
        acc[category] = (acc[category] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      totalPermissions,
      totalRoles,
      totalUsers,
      permissionsPerCategory,
      rolesWithoutPermissions,
      usersWithoutRoles,
    };
  }
}
