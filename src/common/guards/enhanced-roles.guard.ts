import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY, PERMISSIONS_KEY } from '../decorators/roles.decorator';
import { PERMISSIONS } from '../constants/permissions.constants';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If no roles or permissions required, allow access
    if (!requiredRoles && !requiredPermissions) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Super Admin bypass - if user has Super Admin permission, allow all actions
    if (this.isSuperAdmin(user)) {
      return true;
    }

    // Check roles
    if (requiredRoles && !this.hasRequiredRoles(user, requiredRoles)) {
      throw new ForbiddenException(
        `Access denied. Required roles: ${requiredRoles.join(', ')}`
      );
    }

    // Check permissions
    if (requiredPermissions && !this.hasRequiredPermissions(user, requiredPermissions)) {
      const userPermissions = this.getUserPermissions(user);
      const missingPermissions = requiredPermissions.filter(
        (permission) => !userPermissions.includes(permission)
      );
      throw new ForbiddenException(
        `Access denied. Missing permissions: ${missingPermissions.join(', ')}`
      );
    }

    return true;
  }

  /**
   * Check if user is Super Admin
   */
  private isSuperAdmin(user: any): boolean {
    const userPermissions = this.getUserPermissions(user);
    return userPermissions.includes(PERMISSIONS.ADMIN.FULL_ACCESS);
  }

  /**
   * Check if user has required roles
   */
  private hasRequiredRoles(user: any, requiredRoles: string[]): boolean {
    const userRole = user.role?.name;
    return requiredRoles.includes(userRole);
  }

  /**
   * Check if user has required permissions
   */
  private hasRequiredPermissions(user: any, requiredPermissions: string[]): boolean {
    const userPermissions = this.getUserPermissions(user);
    return requiredPermissions.every((permission) =>
      userPermissions.includes(permission)
    );
  }

  /**
   * Get user permissions array
   */
  private getUserPermissions(user: any): string[] {
    return user.role?.permissions?.map((perm: any) => perm.name) || [];
  }
}

/**
 * Enhanced guard for resource ownership checking
 */
@Injectable()
export class ResourceOwnershipGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Super Admin bypass
    if (this.isSuperAdmin(user)) {
      return true;
    }

    // Get resource info from request
    const resourceId = request.params.id;
    const resourceType = this.getResourceType(context);
    
    // Check if user can manage all resources of this type
    if (this.canManageAllResources(user, resourceType)) {
      return true;
    }

    // For ownership check, we need the resource data
    // This should be handled in the service layer or through custom logic
    // For now, we'll allow the request to pass and let the service handle ownership
    return true;
  }

  private isSuperAdmin(user: any): boolean {
    const userPermissions = user.role?.permissions?.map((perm: any) => perm.name) || [];
    return userPermissions.includes(PERMISSIONS.ADMIN.FULL_ACCESS);
  }

  private getResourceType(context: ExecutionContext): string {
    const controllerClass = context.getClass();
    const className = controllerClass.name.toLowerCase();
    
    if (className.includes('user')) return 'users';
    if (className.includes('blog')) return 'blogs';
    if (className.includes('media')) return 'media';
    if (className.includes('recruitment')) return 'recruitment';
    
    return 'unknown';
  }

  private canManageAllResources(user: any, resourceType: string): boolean {
    const userPermissions = user.role?.permissions?.map((perm: any) => perm.name) || [];
    
    switch (resourceType) {
      case 'users':
        return userPermissions.includes(PERMISSIONS.USERS.MANAGE_ALL);
      case 'blogs':
        return userPermissions.includes(PERMISSIONS.BLOGS.MANAGE_ALL);
      case 'media':
        return userPermissions.includes(PERMISSIONS.MEDIA.MANAGE_ALL);
      case 'recruitment':
        return userPermissions.includes(PERMISSIONS.RECRUITMENT.MANAGE_ALL);
      default:
        return false;
    }
  }
}
