import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { PrismaService } from '../../prisma/prisma.service';

interface AuditLogData {
  userId: number;
  userEmail: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
  status: 'success' | 'error';
  errorMessage?: string;
  duration: number;
  timestamp: Date;
}

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditLogInterceptor.name);

  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body, params, user } = request;
    const startTime = Date.now();

    // Skip non-sensitive operations
    if (!this.shouldAudit(method, url)) {
      return next.handle();
    }

    // Prepare audit data
    const auditData: Partial<AuditLogData> = {
      userId: user?.id,
      userEmail: user?.email || 'unknown',
      action: this.extractAction(method, url),
      resource: this.extractResource(url),
      resourceId: this.extractResourceId(url, params, body),
      details: this.sanitizeDetails({ body, params }),
      ipAddress: this.getClientIp(request),
      userAgent: request.headers['user-agent'],
      timestamp: new Date(),
    };

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - startTime;
        this.logAudit({
          ...auditData,
          status: 'success',
          duration,
        } as AuditLogData);
      }),
      catchError((error) => {
        const duration = Date.now() - startTime;
        this.logAudit({
          ...auditData,
          status: 'error',
          errorMessage: error.message || 'Unknown error',
          duration,
        } as AuditLogData);
        throw error;
      }),
    );
  }

  private shouldAudit(method: string, url: string): boolean {
    // Audit sensitive operations
    const sensitivePatterns = [
      /\/api\/users/,
      /\/api\/roles/,
      /\/api\/permissions/,
      /\/api\/auth\/login/,
      /\/api\/auth\/logout/,
      /\/api\/blogs.*\/delete/,
      /\/api\/blogs.*\/restore/,
      /\/api\/categories.*\/delete/,
      /\/api\/categories.*\/restore/,
      /\/api\/tags.*\/delete/,
      /\/api\/tags.*\/restore/,
      /\/api\/media.*\/delete/,
      /\/api\/recruitment/,
      /\/api\/settings/,
    ];

    // Audit state-changing methods
    const auditMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];

    return (
      auditMethods.includes(method) &&
      sensitivePatterns.some((pattern) => pattern.test(url))
    );
  }

  private extractAction(method: string, url: string): string {
    // Handle bulk operations
    if (url.includes('/bulk/restore')) return 'bulk_restore';
    if (url.includes('/bulk/delete')) return 'bulk_delete';
    if (url.includes('/bulk/permanent-delete')) return 'bulk_permanent_delete';
    
    // Handle specific patterns
    if (url.includes('/restore')) return 'restore';
    if (url.includes('/permanent-delete')) return 'permanent_delete';
    if (url.includes('/delete')) return 'delete';
    if (url.includes('/login')) return 'login';
    if (url.includes('/logout')) return 'logout';
    if (url.includes('/assign-role')) return 'assign_role';
    if (url.includes('/upload')) return 'upload';

    // Map HTTP methods to actions
    switch (method) {
      case 'POST':
        return 'create';
      case 'PUT':
      case 'PATCH':
        return 'update';
      case 'DELETE':
        return 'delete';
      default:
        return 'unknown';
    }
  }

  private extractResource(url: string): string {
    const segments = url.split('/').filter(Boolean);

    // Find the main resource from URL segments
    const resourceMap = {
      users: 'user',
      roles: 'role',
      permissions: 'permission',
      blogs: 'blog',
      categories: 'category',
      tags: 'tag',
      media: 'media',
      recruitment: 'recruitment',
      services: 'service',
      status: 'status',
      auth: 'auth',
    };

    for (const segment of segments) {
      if (resourceMap[segment]) {
        return resourceMap[segment];
      }
    }

    return 'unknown';
  }

  private extractResourceId(url: string, params: any, body: any): string | undefined {
    // Skip ID extraction for bulk operations
    if (url.includes('/bulk')) {
      return undefined;
    }
    return params?.id || body?.id;
  }

  private sanitizeDetails(details: any): any {
    if (!details || typeof details !== 'object') return details;

    // Remove sensitive information
    const sensitiveFields = [
      'password',
      'hashedPassword',
      'token',
      'accessToken',
      'refreshToken',
      'sessionId',
    ];

    const sanitizeObject = (obj: any): any => {
      if (!obj || typeof obj !== 'object') return obj;

      const result = Array.isArray(obj) ? [] : {};

      for (const [key, value] of Object.entries(obj)) {
        if (
          sensitiveFields.some((field) =>
            key.toLowerCase().includes(field.toLowerCase()),
          )
        ) {
          result[key] = '[REDACTED]';
        } else if (typeof value === 'object') {
          result[key] = sanitizeObject(value);
        } else {
          result[key] = value;
        }
      }

      return result;
    };

    return sanitizeObject(details);
  }

  private getClientIp(request: any): string {
    return (
      request.headers['x-forwarded-for']?.split(',')[0] ||
      request.headers['x-real-ip'] ||
      request.connection?.remoteAddress ||
      request.socket?.remoteAddress ||
      request.ip ||
      'unknown'
    );
  }

  private async logAudit(auditData: AuditLogData): Promise<void> {
    try {
      // Create dynamic log message
      let logMessage = `AUDIT: ${auditData.userEmail} ${auditData.action} ${auditData.resource}`;
      
      // Add resource ID or bulk info
      if (auditData.resourceId) {
        logMessage += ` (ID: ${auditData.resourceId})`;
      } else if (auditData.action.startsWith('bulk_')) {
        const bulkData = auditData.details?.body;
        if (bulkData?.userIds || bulkData?.roleIds || bulkData?.blogIds || bulkData?.categoryIds || bulkData?.tagIds) {
          const ids = bulkData.userIds || bulkData.roleIds || bulkData.blogIds || bulkData.categoryIds || bulkData.tagIds;
          const count = Array.isArray(ids) ? ids.length : 1;
          logMessage += ` (${count} items)`;
        }
      }
      
      logMessage += ` - ${auditData.status} (${auditData.duration}ms)`;
      
      // Log to console
      if (auditData.status === 'success') {
        this.logger.log(logMessage);
      } else {
        this.logger.error(logMessage);
      }

      // Enhanced logging for production
      if (process.env.NODE_ENV === 'production') {
        const logEntry = {
          timestamp: auditData.timestamp.toISOString(),
          user: {
            id: auditData.userId,
            email: auditData.userEmail,
          },
          action: {
            type: auditData.action,
            resource: auditData.resource,
            resourceId: auditData.resourceId,
          },
          request: {
            ipAddress: auditData.ipAddress,
            userAgent: auditData.userAgent,
          },
          result: {
            status: auditData.status,
            duration: auditData.duration,
            errorMessage: auditData.errorMessage,
          },
          details: auditData.details,
        };

        console.log('AUDIT_LOG:', JSON.stringify(logEntry));
      }
    } catch (error) {
      this.logger.error('Failed to create audit log:', error);
    }
  }
}
