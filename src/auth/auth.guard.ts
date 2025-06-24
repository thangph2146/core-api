import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from './jwt.service';
import { SessionService } from './session.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  PUBLIC_KEY,
  PERMISSIONS_KEY,
  OWNERSHIP_KEY,
} from '../common/decorators/permissions.decorator';
import { PERMISSIONS } from '../common/constants/permissions.constants';
import { AuthenticatedUser } from '../common/interfaces';

type ResourceType = 'BLOGS' | 'MEDIA' | 'RECRUITMENT';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly sessionService: SessionService,
    private readonly prisma: PrismaService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if the endpoint is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>(PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();

    // Try to get token from Authorization header first
    const authHeader = request.headers.authorization;
    let token: string | undefined;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (request.cookies?.accessToken) {
      // Fallback to cookie if no Authorization header
      token = request.cookies.accessToken;
    }

    if (!token) {
      throw new UnauthorizedException('Token truy cập không tìm thấy');
    }

    try {
      // Verify JWT token
      const payload = this.jwtService.verifyAccessToken(token);

      // Get full user data with role and permissions
      const user = await this.prisma.user.findUnique({
        where: {
          id: payload.userId,
          deletedAt: null,
        },
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
        throw new UnauthorizedException('Người dùng không tồn tại');
      }

      // Verify session if sessionId exists in cookies
      if (request.cookies?.sessionId) {
        const session = await this.sessionService.getSession(
          request.cookies.sessionId,
        );
        if (!session || session.userId !== payload.userId) {
          throw new UnauthorizedException('Phiên đăng nhập không hợp lệ');
        }
      }

      // Attach user with permissions to request
      request.user = {
        ...user,
        permissions: user.role?.permissions?.map((p) => p.name) || [],
      };

      // Check required permissions
      const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
        PERMISSIONS_KEY,
        [context.getHandler(), context.getClass()],
      );

      if (requiredPermissions && requiredPermissions.length > 0) {
        const userPermissions = request.user.permissions;

        // Super admin bypass
        if (userPermissions.includes(PERMISSIONS.ADMIN.FULL_ACCESS)) {
          return true;
        }

        // Check if user has required permissions
        const hasPermission = requiredPermissions.every((permission) =>
          userPermissions.includes(permission),
        );

        if (!hasPermission) {
          const missingPermissions = requiredPermissions.filter(
            (permission) => !userPermissions.includes(permission),
          );
          throw new ForbiddenException(
            `Access denied. Missing permissions: ${missingPermissions.join(', ')}`,
          );
        }
      }

      // Check for resource ownership if required
      const ownershipRule = this.reflector.getAllAndOverride<{
        resourceType: ResourceType;
      }>(OWNERSHIP_KEY, [context.getHandler(), context.getClass()]);

      if (ownershipRule) {
        const resourceId = request.params.id;
        if (!resourceId) {
          // This should not happen if the decorator is on a route with an :id param
          throw new ForbiddenException(
            'Ownership check failed: Resource ID not found in request.',
          );
        }

        const isOwner = await this.checkResourceOwnership(
          request.user,
          ownershipRule.resourceType,
          parseInt(resourceId, 10),
        );

        if (!isOwner) {
          throw new ForbiddenException(
            'Access denied. You do not have ownership of this resource.',
          );
        }
      }

      return true;
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      throw new UnauthorizedException('Token không hợp lệ hoặc đã hết hạn');
    }
  }

  private async checkResourceOwnership(
    user: AuthenticatedUser,
    resourceType: ResourceType,
    resourceId: number,
  ): Promise<boolean> {
    // Super Admins can do anything
    if (user.permissions.includes(PERMISSIONS.ADMIN.FULL_ACCESS)) {
      return true;
    }

    // Users with 'full_access' permission for the resource type can bypass ownership check
    const fullAccessPermission = `${resourceType.toLowerCase()}:full_access`;
    if (user.permissions.includes(fullAccessPermission)) {
      return true;
    }

    let resource;
    switch (resourceType) {
      case 'BLOGS':
        resource = await this.prisma.blog.findUnique({
          where: { id: resourceId },
          select: { authorId: true },
        });
        return resource?.authorId === user.id;
      case 'MEDIA':
        resource = await this.prisma.media.findUnique({
          where: { id: resourceId },
          select: { uploadedById: true },
        });
        return resource?.uploadedById === user.id;
      case 'RECRUITMENT':
        resource = await this.prisma.recruitment.findUnique({
          where: { id: resourceId },
          select: { authorId: true },
        });
        return resource?.authorId === user.id;
      default:
        return false;
    }
  }
}
