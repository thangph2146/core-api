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
    const startTime = Date.now();
    const request = context.switchToHttp().getRequest();

    // Extract audit information
    const { method, url, user, body, params, query } = request;
    const userAgent = request.headers['user-agent'];
    const ipAddress = this.getClientIp(request);

    // Determine if this action should be audited
    if (!this.shouldAudit(method, url) || !user) {
      return next.handle();
    }

    const auditData: Partial<AuditLogData> = {
      userId: user.id,
      userEmail: user.email,
      action: this.extractAction(method, url),
      resource: this.extractResource(url),
      resourceId: params?.id || body?.id,
      details: this.sanitizeDetails({ body, params, query }),
      ipAddress,
      userAgent,
      timestamp: new Date(),
    };

    return next.handle().pipe(
      tap((data) => {
        // Success case
        const duration = Date.now() - startTime;
        this.logAudit({
          ...auditData,
          status: 'success',
          duration,
        } as AuditLogData);
      }),
      catchError((error) => {
        // Error case
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
      /\/api\/auth\/signin/,
      /\/api\/auth\/signout/,
      /\/api\/blogs.*\/delete/,
      /\/api\/blogs.*\/restore/,
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
    // Handle specific patterns
    if (url.includes('/restore')) return 'restore';
    if (url.includes('/delete')) return 'delete';
    if (url.includes('/signin')) return 'signin';
    if (url.includes('/signout')) return 'signout';
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
      contacts: 'contact',
      newsletter: 'newsletter',
      auth: 'auth',
    };

    for (const segment of segments) {
      if (resourceMap[segment]) {
        return resourceMap[segment];
      }
    }

    return 'unknown';
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
      // Log to console for development
      this.logger.log(
        `AUDIT: ${auditData.userEmail} ${auditData.action} ${auditData.resource}` +
          `${auditData.resourceId ? ` (ID: ${auditData.resourceId})` : ''} - ${auditData.status} (${auditData.duration}ms)`,
      );

      // Enhanced logging for production
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
      }; // Write to audit log
      if (process.env.NODE_ENV === 'production') {
        console.log('AUDIT_LOG:', JSON.stringify(logEntry));
      }
    } catch (error) {
      this.logger.error('Failed to create audit log:', error);
    }
  }
}
