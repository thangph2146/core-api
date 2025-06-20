import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import * as DOMPurify from 'isomorphic-dompurify';

@Injectable()
export class SanitizationPipe implements PipeTransform<any> {
  private readonly logger = new Logger(SanitizationPipe.name);

  async transform(value: any, { metatype }: ArgumentMetadata) {
    if (!metatype || !this.toValidate(metatype)) {
      return this.sanitizeInput(value);
    }

    // Sanitize string inputs
    const sanitizedValue = this.sanitizeInput(value);

    // Transform and validate
    const object = plainToInstance(metatype, sanitizedValue);
    const errors = await validate(object);

    if (errors.length > 0) {
      const messages = errors
        .map((error) => Object.values(error.constraints || {}).join(', '))
        .join('; ');
      throw new BadRequestException(`Dữ liệu không hợp lệ: ${messages}`);
    }

    return object;
  }

  private toValidate(metatype: Function): boolean {
    const types: Function[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }

  private sanitizeInput(input: any): any {
    if (input === null || input === undefined) {
      return input;
    }

    if (typeof input === 'string') {
      return this.sanitizeString(input);
    }

    if (Array.isArray(input)) {
      return input.map((item) => this.sanitizeInput(item));
    }

    if (input && typeof input === 'object') {
      return this.sanitizeObject(input);
    }

    return input;
  }

  private sanitizeString(str: string): string {
    // Basic XSS protection
    let sanitized = DOMPurify.sanitize(str, {
      ALLOWED_TAGS: [], // Remove all HTML tags
      ALLOWED_ATTR: [], // Remove all attributes
    });

    // Additional protections
    sanitized = this.preventSQLInjection(sanitized);
    sanitized = this.preventScriptInjection(sanitized);
    sanitized = this.preventPathTraversal(sanitized);

    return sanitized.trim();
  }

  private sanitizeObject(obj: any): any {
    if (!obj || typeof obj !== 'object') return obj;

    const sanitized = {};

    for (const [key, value] of Object.entries(obj)) {
      // Sanitize key names
      const sanitizedKey = this.sanitizeString(key);

      // Skip potentially dangerous keys
      if (this.isDangerousKey(sanitizedKey)) {
        this.logger.warn(`Dangerous key detected and removed: ${key}`);
        continue;
      }

      sanitized[sanitizedKey] = this.sanitizeInput(value);
    }

    return sanitized;
  }

  private preventSQLInjection(str: string): string {
    // Remove or escape common SQL injection patterns
    const sqlPatterns = [
      /(\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b)/gi,
      /(\b(or|and)\s+\d+\s*=\s*\d+)/gi,
      /(;\s*--)/gi,
      /(\b(xp_|sp_)\w+)/gi,
    ];

    let cleaned = str;
    sqlPatterns.forEach((pattern) => {
      if (pattern.test(cleaned)) {
        this.logger.warn(`Potential SQL injection detected`);
        cleaned = cleaned.replace(pattern, '');
      }
    });

    return cleaned;
  }

  private preventScriptInjection(str: string): string {
    // Remove script-related content
    const scriptPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
    ];

    let cleaned = str;
    scriptPatterns.forEach((pattern) => {
      if (pattern.test(cleaned)) {
        this.logger.warn(`Potential script injection detected`);
        cleaned = cleaned.replace(pattern, '');
      }
    });

    return cleaned;
  }

  private preventPathTraversal(str: string): string {
    // Remove path traversal patterns
    const pathPatterns = [/\.\.\//g, /\.\.\\+/g, /%2e%2e%2f/gi, /%2e%2e%5c/gi];

    let cleaned = str;
    pathPatterns.forEach((pattern) => {
      if (pattern.test(cleaned)) {
        this.logger.warn(`Potential path traversal detected`);
        cleaned = cleaned.replace(pattern, '');
      }
    });

    return cleaned;
  }
  private isDangerousKey(key: string): boolean {
    const dangerousKeys = [
      '__proto__',
      'constructor',
      'prototype',
      'eval',
      'function',
      'require',
      'process',
      'global',
    ];

    return dangerousKeys.some((dangerous) =>
      key.toLowerCase().includes(dangerous.toLowerCase()),
    );
  }
}
