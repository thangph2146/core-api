import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { Reflector } from '@nestjs/core';

// Simple in-memory rate limiter (production should use Redis)
export const requestCounts = new Map<string, { count: number; resetTime: number }>();

@Injectable()
export class RateLimitInterceptor implements NestInterceptor {
  private readonly logger = new Logger(RateLimitInterceptor.name);

  constructor(private reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    // Get rate limit configuration
    const limit = this.getRateLimit(context);
    const windowMs = this.getRateLimitWindow(context);

    const key = this.getClientKey(request);
    const now = Date.now();

    // Clean expired entries
    this.cleanExpiredEntries(now);

    // Check and update rate limit
    const clientData = requestCounts.get(key) || {
      count: 0,
      resetTime: now + windowMs,
    };

    if (clientData.count >= limit) {
      const retryAfter = Math.ceil((clientData.resetTime - now) / 1000);
      
      this.logger.warn(
        `Rate limit exceeded for ${key}: ${clientData.count}/${limit} requests`
      );

      response.status(429).json({
        success: false,
        message: 'Quá nhiều yêu cầu, vui lòng thử lại sau',
        retryAfter,
      });
      
      return new Observable((observer) => observer.complete());
    }

    // Increment counter
    clientData.count++;
    requestCounts.set(key, clientData);

    // Set rate limit headers
    this.setRateLimitHeaders(response, limit, clientData);

    return next.handle();
  }

  private getRateLimit(context: ExecutionContext): number {
    const customLimit = this.reflector.get<number>('rateLimit', context.getHandler());
    
    if (customLimit) {
      return customLimit;
    }

    // Environment-based defaults
    switch (process.env.NODE_ENV) {
      case 'test':
        return 1000; // High limit for testing
      case 'development':
        return 200; // Moderate limit for development
      case 'production':
        return 60; // Conservative limit for production
      default:
        return 100;
    }
  }

  private getRateLimitWindow(context: ExecutionContext): number {
    return this.reflector.get<number>('rateLimitWindow', context.getHandler()) || 60000; // 1 minute
  }

  private getClientKey(request: any): string {
    // Use IP + User ID if authenticated, otherwise just IP
    const ip = this.getClientIp(request);
    const userId = request.user?.id;
    return userId ? `${ip}:${userId}` : ip;
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

  private cleanExpiredEntries(now: number): void {
    // Clean expired entries periodically
    for (const [key, data] of requestCounts.entries()) {
      if (data.resetTime <= now) {
        requestCounts.delete(key);
      }
    }
  }

  private setRateLimitHeaders(response: any, limit: number, clientData: any): void {
    response.setHeader('X-RateLimit-Limit', limit);
    response.setHeader(
      'X-RateLimit-Remaining',
      Math.max(0, limit - clientData.count),
    );
    response.setHeader(
      'X-RateLimit-Reset',
      new Date(clientData.resetTime).toISOString(),
    );
  }
}

// Decorator for custom rate limits
export const RateLimit =
  (limit: number, windowMs: number = 60000) =>
  (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata('rateLimit', limit, descriptor.value);
    Reflect.defineMetadata('rateLimitWindow', windowMs, descriptor.value);
  };
