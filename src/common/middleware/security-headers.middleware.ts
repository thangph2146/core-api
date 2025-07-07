import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class SecurityHeadersMiddleware implements NestMiddleware {
  private readonly logger = new Logger(SecurityHeadersMiddleware.name);

  use(req: Request, res: Response, next: NextFunction) {
    // Basic security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader(
      'Permissions-Policy',
      'camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), speaker=(), fullscreen=(), sync-xhr=()',
    );

    // Content Security Policy
    const cspPolicy = this.buildCSPPolicy();
    res.setHeader('Content-Security-Policy', cspPolicy);

    // HSTS (only in production with HTTPS)
    if (process.env.NODE_ENV === 'production') {
      res.setHeader(
        'Strict-Transport-Security',
        'max-age=31536000; includeSubDomains; preload',
      );
    }

    // Additional security headers
    res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
    res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');

    // Remove server information
    res.removeHeader('X-Powered-By');
    res.removeHeader('Server');

    // Log security headers application in development
    if (process.env.NODE_ENV === 'development') {
      this.logger.debug(`Security headers applied for ${req.method} ${req.url}`);
    }

    next();
  }

  private buildCSPPolicy(): string {
    const policies = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'", // Allow inline scripts for development
      "style-src 'self' 'unsafe-inline'", // Allow inline styles
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self'",
      "media-src 'self'",
      "object-src 'none'",
      "child-src 'none'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ];

    // More restrictive CSP for production
    if (process.env.NODE_ENV === 'production') {
      policies[1] = "script-src 'self'"; // Remove unsafe-inline in production
      policies.push("upgrade-insecure-requests");
    }

    return policies.join('; ');
  }
}
