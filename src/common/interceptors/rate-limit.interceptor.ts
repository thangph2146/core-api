import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Reflector } from '@nestjs/core';

// Simple in-memory rate limiter (production should use Redis)
const requestCounts = new Map<string, { count: number; resetTime: number }>();

@Injectable()
export class RateLimitInterceptor implements NestInterceptor {
  constructor(private reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    
    // Get rate limit from decorator or use default
    const limit = this.reflector.get<number>('rateLimit', context.getHandler()) || 100;
    const windowMs = this.reflector.get<number>('rateLimitWindow', context.getHandler()) || 60000; // 1 minute

    const key = this.getClientKey(request);
    const now = Date.now();
    const windowStart = now - windowMs;

    // Clean old entries
    if (requestCounts.has(key)) {
      const clientData = requestCounts.get(key)!;
      if (clientData.resetTime <= now) {
        requestCounts.delete(key);
      }
    }

    // Check rate limit
    const clientData = requestCounts.get(key) || { count: 0, resetTime: now + windowMs };
    
    if (clientData.count >= limit) {
      response.status(429).json({
        success: false,
        message: 'Quá nhiều yêu cầu, vui lòng thử lại sau',
        retryAfter: Math.ceil((clientData.resetTime - now) / 1000),
      });
      return new Observable(observer => observer.complete());
    }

    // Increment counter
    clientData.count++;
    requestCounts.set(key, clientData);

    // Set rate limit headers
    response.setHeader('X-RateLimit-Limit', limit);
    response.setHeader('X-RateLimit-Remaining', Math.max(0, limit - clientData.count));
    response.setHeader('X-RateLimit-Reset', new Date(clientData.resetTime).toISOString());

    return next.handle();
  }

  private getClientKey(request: any): string {
    // Use IP + User ID if authenticated, otherwise just IP
    const ip = request.ip || request.connection.remoteAddress;
    const userId = request.user?.id;
    return userId ? `${ip}:${userId}` : ip;
  }
}

// Decorator for custom rate limits
export const RateLimit = (limit: number, windowMs: number = 60000) =>
  (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata('rateLimit', limit, descriptor.value);
    Reflect.defineMetadata('rateLimitWindow', windowMs, descriptor.value);
  };
