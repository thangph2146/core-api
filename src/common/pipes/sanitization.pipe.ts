import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  Logger,
} from '@nestjs/common';
import * as DOMPurify from 'isomorphic-dompurify';

@Injectable()
export class SanitizationPipe implements PipeTransform<any> {
  private readonly logger = new Logger(SanitizationPipe.name);

  // Cache for compiled regex patterns
  private static readonly SQL_PATTERNS = [
    /(\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b)/gi,
    /(\b(or|and)\s+\d+\s*=\s*\d+)/gi,
    /(;\s*--)/gi,
    /(\b(xp_|sp_)\w+)/gi,
  ];

  private static readonly SCRIPT_PATTERNS = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /<script[^>]*>.*?<\/script>/gi,
    /<script[^>]*>/gi,
    /<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
    /<object[^>]*>.*?<\/object>/gi,
    /<embed[^>]*>/gi,
    /<applet[^>]*>.*?<\/applet>/gi,
    /<meta[^>]*>/gi,
    /<link[^>]*>/gi,
  ];

  private static readonly PATH_PATTERNS = [
    /\.\.\//g,
    /\.\.\\+/g,
    /%2e%2e%2f/gi,
    /%2e%2e%5c/gi,
  ];

  private static readonly DANGEROUS_KEYS = new Set([
    '__proto__',
    'constructor',
    'prototype',
    'eval',
    'function',
    'require',
    'process',
    'global',
  ]);

  async transform(value: any, { metatype }: ArgumentMetadata) {
    // Skip validation for basic types and let ValidationPipe handle DTO validation
    if (!metatype || !this.toValidate(metatype)) {
      return this.sanitizeInput(value);
    }

    // Only sanitize, don't validate (let ValidationPipe handle validation)
    return this.sanitizeInput(value);
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
    if (!str || typeof str !== 'string') return str;

    // First, remove script tags and dangerous HTML
    let sanitized = this.preventScriptInjection(str);
    
    // Then use DOMPurify for additional HTML sanitization
    sanitized = DOMPurify.sanitize(sanitized, {
      ALLOWED_TAGS: [], // Remove all HTML tags
      ALLOWED_ATTR: [], // Remove all attributes
      KEEP_CONTENT: true, // Keep text content
    });

    // Additional protections
    sanitized = this.preventSQLInjection(sanitized);
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
    let cleaned = str;
    
    for (const pattern of SanitizationPipe.SQL_PATTERNS) {
      if (pattern.test(cleaned)) {
        this.logger.warn(`Potential SQL injection detected`);
        cleaned = cleaned.replace(pattern, '');
      }
    }

    return cleaned;
  }

  private preventScriptInjection(str: string): string {
    let cleaned = str;
    
    for (const pattern of SanitizationPipe.SCRIPT_PATTERNS) {
      if (pattern.test(cleaned)) {
        this.logger.warn(`Potential script injection detected`);
        cleaned = cleaned.replace(pattern, '');
      }
    }

    return cleaned;
  }

  private preventPathTraversal(str: string): string {
    let cleaned = str;
    
    for (const pattern of SanitizationPipe.PATH_PATTERNS) {
      if (pattern.test(cleaned)) {
        this.logger.warn(`Potential path traversal detected`);
        cleaned = cleaned.replace(pattern, '');
      }
    }

    return cleaned;
  }

  private isDangerousKey(key: string): boolean {
    const lowerKey = key.toLowerCase();
    return Array.from(SanitizationPipe.DANGEROUS_KEYS).some((dangerous) =>
      lowerKey.includes(dangerous.toLowerCase()),
    );
  }
}
