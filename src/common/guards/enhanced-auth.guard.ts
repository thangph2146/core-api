import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '../../auth/jwt.service';
import { SessionService } from '../../auth/session.service';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class EnhancedAuthGuard implements CanActivate {
  private readonly logger = new Logger(EnhancedAuthGuard.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly sessionService: SessionService,
    private readonly prisma: PrismaService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const startTime = Date.now();

    try {
      // Get token from Authorization header or cookies
      const token = this.extractToken(request);
      if (!token) {
        this.logger.warn('No access token found in request');
        throw new UnauthorizedException('Token truy cập không tìm thấy');
      }

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
        this.logger.warn(`User not found: ${payload.userId}`);
        throw new UnauthorizedException('Người dùng không tồn tại');
      }

      // Verify session if sessionId exists
      if (request.cookies?.sessionId) {
        const session = await this.sessionService.getSession(
          request.cookies.sessionId,
        );
        if (!session || session.userId !== payload.userId) {
          this.logger.warn(`Invalid session for user: ${payload.userId}`);
          throw new UnauthorizedException('Phiên đăng nhập không hợp lệ');
        }
      }

      // Attach user with permissions to request
      const userPermissions = user.role?.permissions?.map((p) => p.name) || [];
      request.user = {
        ...user,
        permissions: userPermissions,
      };

      // Log user access
      this.logger.log(
        `User access: ${user.email} (${user.role?.name || 'No role'}) - ${userPermissions.length} permissions`,
      );

      // Check permissions
      const hasAccess = await this.checkPermissions(
        context,
        userPermissions,
        user,
      );

      if (!hasAccess) {
        this.logger.warn(
          `Permission denied for user: ${user.email} on ${request.method} ${request.url}`,
        );
        throw new ForbiddenException('Không có quyền truy cập chức năng này');
      }

      // Log successful authorization
      const duration = Date.now() - startTime;
      this.logger.debug(
        `Authorization successful for ${user.email} in ${duration}ms`,
      );

      return true;
    } catch (error) {
      const duration = Date.now() - startTime;

      if (
        error instanceof ForbiddenException ||
        error instanceof UnauthorizedException
      ) {
        this.logger.warn(
          `Authorization failed in ${duration}ms: ${error.message}`,
        );
        throw error;
      }

      this.logger.error(`Authentication error in ${duration}ms:`, error);
      throw new UnauthorizedException('Token không hợp lệ hoặc đã hết hạn');
    }
  }

  private extractToken(request: any): string | undefined {
    const authHeader = request.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    if (request.cookies?.accessToken) {
      return request.cookies.accessToken;
    }

    return undefined;
  }

  private async checkPermissions(
    context: ExecutionContext,
    userPermissions: string[],
    user: any,
  ): Promise<boolean> {
    // Super admin bypass
    if (userPermissions.includes('admin:full_access')) {
      this.logger.debug(`Super admin access granted for: ${user.email}`);
      return true;
    }

    // Check required permissions
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      'permissions',
      [context.getHandler(), context.getClass()],
    );

    // If no permissions required, allow access
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    // Check if user has all required permissions
    const hasAllPermissions = requiredPermissions.every((permission) =>
      userPermissions.includes(permission),
    );

    if (hasAllPermissions) {
      this.logger.debug(
        `Permission check passed for: ${user.email} - Required: [${requiredPermissions.join(', ')}]`,
      );
      return true;
    }

    // Check "any permission" requirement
    const anyPermissions = this.reflector.getAllAndOverride<string[]>(
      'anyPermissions',
      [context.getHandler(), context.getClass()],
    );

    if (anyPermissions && anyPermissions.length > 0) {
      const hasAnyPermission = anyPermissions.some((permission) =>
        userPermissions.includes(permission),
      );

      if (hasAnyPermission) {
        this.logger.debug(`Any permission check passed for: ${user.email}`);
        return true;
      }
    }

    // Check resource ownership
    const ownership = this.reflector.getAllAndOverride<{
      resourceType: string;
    }>('ownership', [context.getHandler(), context.getClass()]);

    if (ownership) {
      const hasOwnership = await this.checkResourceOwnership(
        context,
        user.id,
        ownership.resourceType,
      );

      if (hasOwnership) {
        this.logger.debug(`Resource ownership check passed for: ${user.email}`);
        return true;
      }
    }

    this.logger.warn(
      `Permission denied for ${user.email}: Required [${requiredPermissions.join(', ')}], User has [${userPermissions.join(', ')}]`,
    );

    return false;
  }

  private async checkResourceOwnership(
    context: ExecutionContext,
    userId: number,
    resourceType: string,
  ): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const resourceId = request.params.id;

    if (!resourceId) {
      return false;
    }

    try {
      switch (resourceType) {
        case 'blog':
          const blog = await this.prisma.blog.findUnique({
            where: { id: parseInt(resourceId) },
            select: { authorId: true },
          });
          return blog?.authorId === userId;

        case 'recruitment':
          const recruitment = await this.prisma.recruitment.findUnique({
            where: { id: parseInt(resourceId) },
            select: { authorId: true },
          });
          return recruitment?.authorId === userId;

        case 'media':
          const media = await this.prisma.media.findUnique({
            where: { id: parseInt(resourceId) },
            select: { uploadedById: true },
          });
          return media?.uploadedById === userId;

        case 'user':
          return parseInt(resourceId) === userId;

        default:
          this.logger.warn(
            `Unknown resource type for ownership check: ${resourceType}`,
          );
          return false;
      }
    } catch (error) {
      this.logger.error(`Error checking resource ownership:`, error);
      return false;
    }
  }
}
