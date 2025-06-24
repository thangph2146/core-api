import { Injectable, NestMiddleware, ForbiddenException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import { ResourceOwnershipService } from '../services/resource-ownership.service';
import { PERMISSIONS } from '../constants/permissions.constants';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
    role?: {
      name: string;
      permissions: Array<{ name: string }>;
    };
    permissions?: string[];
  };
}

@Injectable()
export class PermissionMiddleware implements NestMiddleware {
  constructor(
    private readonly prisma: PrismaService,
    private readonly resourceOwnership: ResourceOwnershipService,
  ) {}

  async use(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    // Skip middleware for public routes
    if (!req.user) {
      return next();
    }

    // Add resource ownership checking for specific routes
    const { method, originalUrl } = req;
    const pathSegments = originalUrl.split('/').filter(Boolean);

    // Extract resource type and ID from URL
    const resourceInfo = this.extractResourceInfo(pathSegments);

    if (resourceInfo) {
      const { resourceType, resourceId, action } = resourceInfo;

      try {
        // Check if user can access this resource
        await this.resourceOwnership.requireResourceAccess(
          req.user,
          resourceType,
          resourceId,
          action,
        );
      } catch (error) {
        throw new ForbiddenException(
          `Access denied: You don't have permission to ${action} this ${resourceType}`,
        );
      }
    }

    next();
  }

  /**
   * Extract resource information from URL path
   */
  private extractResourceInfo(pathSegments: string[]): {
    resourceType: string;
    resourceId: string;
    action: string;
  } | null {
    // Pattern: /api/{resource}/{id}
    if (pathSegments.length >= 3 && pathSegments[0] === 'api') {
      const resourceType = pathSegments[1];
      const resourceId = pathSegments[2];

      // Skip if ID is not numeric (e.g., /api/users/stats)
      if (!/^\d+$/.test(resourceId)) {
        return null;
      }

      // Determine action based on HTTP method
      const actionMap: Record<string, string> = {
        GET: 'read',
        POST: 'create',
        PUT: 'update',
        PATCH: 'update',
        DELETE: 'delete',
      };

      return {
        resourceType,
        resourceId,
        action: actionMap[pathSegments.length > 3 ? 'GET' : 'GET'] || 'read',
      };
    }

    return null;
  }
}

/**
 * Middleware specifically for checking ownership on resource operations
 */
@Injectable()
export class ResourceOwnershipMiddleware implements NestMiddleware {
  constructor(private readonly resourceOwnership: ResourceOwnershipService) {}

  async use(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    if (!req.user) {
      return next();
    }

    const { method, params } = req;
    const resourceId = params?.id;

    // Only check ownership for specific operations with resource IDs
    if (!resourceId || !/^\d+$/.test(resourceId)) {
      return next();
    }

    // Determine resource type from URL
    const resourceType = this.getResourceTypeFromUrl(req.originalUrl);

    if (!resourceType) {
      return next();
    }

    // Determine action from HTTP method
    const action = this.getActionFromMethod(method);

    // Check ownership for ownership-required actions
    const ownershipActions = ['update', 'delete'];
    if (ownershipActions.includes(action)) {
      try {
        await this.resourceOwnership.requireResourceAccess(
          req.user,
          resourceType,
          resourceId,
          action,
        );
      } catch (error) {
        throw new ForbiddenException(error.message);
      }
    }

    next();
  }

  private getResourceTypeFromUrl(url: string): string | null {
    const match = url.match(/\/api\/([^\/]+)/);
    return match ? match[1] : null;
  }

  private getActionFromMethod(method: string): string {
    const actionMap: Record<string, string> = {
      GET: 'read',
      POST: 'create',
      PUT: 'update',
      PATCH: 'update',
      DELETE: 'delete',
    };
    return actionMap[method] || 'read';
  }
}

/**
 * Middleware for logging permission checks (for auditing)
 */
@Injectable()
export class PermissionAuditMiddleware implements NestMiddleware {
  constructor(private readonly prisma: PrismaService) {}

  async use(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    const { user, method, originalUrl, ip } = req;

    // Log permission-related actions
    if (user && this.shouldAuditRequest(originalUrl)) {
      try {
        // Create audit log entry (you may want to create an AuditLog model)
        console.log('Permission Audit:', {
          userId: user.id,
          email: user.email,
          action: `${method} ${originalUrl}`,
          ip,
          timestamp: new Date().toISOString(),
          userRole: user.role?.name,
          userPermissions: user.permissions?.length || 0,
        });

        // You can also store this in database if needed
        // await this.prisma.auditLog.create({ ... });
      } catch (error) {
        console.error('Audit logging failed:', error);
      }
    }

    next();
  }

  private shouldAuditRequest(url: string): boolean {
    // Define URLs that should be audited
    const auditPatterns = [
      '/api/users',
      '/api/roles',
      '/api/permissions',
      '/api/admin',
    ];

    return auditPatterns.some((pattern) => url.includes(pattern));
  }
}
