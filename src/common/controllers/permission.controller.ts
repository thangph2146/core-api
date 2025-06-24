import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  ParseIntPipe,
  HttpStatus,
  HttpCode,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '../../auth/auth.guard';
import {
  PermissionManagement,
  RoleManagement,
  AdminManagement,
} from '../decorators/permissions.decorator';
import { PermissionManagementService } from '../services/permission-management.service';

interface AssignPermissionsDto {
  permissionIds: number[];
}

interface RemovePermissionsDto {
  permissionIds: number[];
}

@Controller('api/permissions')
@UseGuards(AuthGuard)
export class PermissionController {
  constructor(
    private readonly permissionService: PermissionManagementService,
  ) {}

  @Get()
  @PermissionManagement.Read()
  async getAllPermissions() {
    try {
      const permissions = await this.permissionService.getAllPermissions();
      return {
        success: true,
        data: permissions,
        message: 'Permissions retrieved successfully',
      };
    } catch (error) {
      throw new BadRequestException(
        error.message || 'Failed to retrieve permissions',
      );
    }
  }

  @Get('by-category')
  @PermissionManagement.Read()
  async getPermissionsByCategory() {
    try {
      const permissions =
        await this.permissionService.getPermissionsByCategory();
      return {
        success: true,
        data: permissions,
        message: 'Permissions by category retrieved successfully',
      };
    } catch (error) {
      throw new BadRequestException(
        error.message || 'Failed to retrieve permissions by category',
      );
    }
  }

  @Get('stats')
  @AdminManagement.ViewLogs()
  async getPermissionStats() {
    try {
      const stats = await this.permissionService.getPermissionStats();
      return {
        success: true,
        data: stats,
        message: 'Permission statistics retrieved successfully',
      };
    } catch (error) {
      throw new BadRequestException(
        error.message || 'Failed to retrieve permission statistics',
      );
    }
  }

  @Get('users/:permissionName')
  @AdminManagement.FullAccess()
  async getUsersByPermission(@Param('permissionName') permissionName: string) {
    try {
      const users =
        await this.permissionService.getUsersByPermission(permissionName);
      return {
        success: true,
        data: users,
        message: `Users with permission ${permissionName} retrieved successfully`,
      };
    } catch (error) {
      throw new BadRequestException(
        error.message || 'Failed to retrieve users by permission',
      );
    }
  }

  @Post('sync')
  @HttpCode(HttpStatus.OK)
  @AdminManagement.FullAccess()
  async syncPermissions() {
    try {
      const result = await this.permissionService.syncPermissions();
      return {
        success: true,
        data: result,
        message: 'Permissions synchronized successfully',
      };
    } catch (error) {
      throw new BadRequestException(
        error.message || 'Failed to sync permissions',
      );
    }
  }
}

@Controller('api/roles')
@UseGuards(AuthGuard)
export class RolePermissionController {
  constructor(
    private readonly permissionService: PermissionManagementService,
  ) {}

  @Get()
  @RoleManagement.Read()
  async getAllRoles() {
    try {
      const roles = await this.permissionService.getAllRolesWithPermissions();
      return {
        success: true,
        data: roles,
        message: 'Roles retrieved successfully',
      };
    } catch (error) {
      throw new BadRequestException(
        error.message || 'Failed to retrieve roles',
      );
    }
  }

  @Get(':id')
  @RoleManagement.Read()
  async getRole(@Param('id', ParseIntPipe) id: number) {
    try {
      const role = await this.permissionService.getRoleWithPermissions(id);
      return {
        success: true,
        data: role,
        message: 'Role retrieved successfully',
      };
    } catch (error) {
      throw new BadRequestException(error.message || 'Failed to retrieve role');
    }
  }

  @Post(':id/permissions')
  @HttpCode(HttpStatus.OK)
  @RoleManagement.AssignPermissions()
  async assignPermissions(
    @Param('id', ParseIntPipe) id: number,
    @Body() assignPermissionsDto: AssignPermissionsDto,
  ) {
    try {
      const { permissionIds } = assignPermissionsDto;

      if (!Array.isArray(permissionIds) || permissionIds.length === 0) {
        throw new BadRequestException(
          'Permission IDs must be a non-empty array',
        );
      }

      const role = await this.permissionService.assignPermissionsToRole(
        id,
        permissionIds,
      );
      return {
        success: true,
        data: role,
        message: 'Permissions assigned successfully',
      };
    } catch (error) {
      throw new BadRequestException(
        error.message || 'Failed to assign permissions',
      );
    }
  }

  @Delete(':id/permissions')
  @HttpCode(HttpStatus.OK)
  @RoleManagement.AssignPermissions()
  async removePermissions(
    @Param('id', ParseIntPipe) id: number,
    @Body() removePermissionsDto: RemovePermissionsDto,
  ) {
    try {
      const { permissionIds } = removePermissionsDto;

      if (!Array.isArray(permissionIds) || permissionIds.length === 0) {
        throw new BadRequestException(
          'Permission IDs must be a non-empty array',
        );
      }

      const role = await this.permissionService.removePermissionsFromRole(
        id,
        permissionIds,
      );
      return {
        success: true,
        data: role,
        message: 'Permissions removed successfully',
      };
    } catch (error) {
      throw new BadRequestException(
        error.message || 'Failed to remove permissions',
      );
    }
  }
}

@Controller('api/user-permissions')
@UseGuards(AuthGuard)
export class UserPermissionController {
  constructor(
    private readonly permissionService: PermissionManagementService,
  ) {}

  @Get(':userId')
  @PermissionManagement.Read()
  async getUserPermissions(@Param('userId', ParseIntPipe) userId: number) {
    try {
      const permissions =
        await this.permissionService.getUserPermissions(userId);
      return {
        success: true,
        data: permissions,
        message: 'User permissions retrieved successfully',
      };
    } catch (error) {
      throw new BadRequestException(
        error.message || 'Failed to retrieve user permissions',
      );
    }
  }

  @Post(':userId/check')
  @HttpCode(HttpStatus.OK)
  @PermissionManagement.Read()
  async checkUserPermission(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() body: { permission: string },
  ) {
    try {
      const { permission } = body;

      if (!permission) {
        throw new BadRequestException('Permission name is required');
      }

      const hasPermission = await this.permissionService.userHasPermission(
        userId,
        permission,
      );
      return {
        success: true,
        data: { hasPermission },
        message: 'Permission check completed',
      };
    } catch (error) {
      throw new BadRequestException(
        error.message || 'Failed to check user permission',
      );
    }
  }

  @Post(':userId/check-any')
  @HttpCode(HttpStatus.OK)
  @PermissionManagement.Read()
  async checkUserAnyPermission(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() body: { permissions: string[] },
  ) {
    try {
      const { permissions } = body;

      if (!Array.isArray(permissions) || permissions.length === 0) {
        throw new BadRequestException('Permissions must be a non-empty array');
      }

      const hasAnyPermission =
        await this.permissionService.userHasAnyPermission(userId, permissions);
      return {
        success: true,
        data: { hasAnyPermission },
        message: 'Permission check completed',
      };
    } catch (error) {
      throw new BadRequestException(
        error.message || 'Failed to check user permissions',
      );
    }
  }
}
