import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SanitizationPipe } from './common/pipes/sanitization.pipe';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  // Set global API prefix
  app.setGlobalPrefix('api');

  // Use cookie parser
  app.use(cookieParser());
  // Enable CORS with security headers
  app.enableCors({
    origin: ['http://localhost:3000', 'https://www.phgrouptechs.com'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'X-API-Key',
      'X-Request-ID',
      'X-CSRF-Token',
      'X-User-Agent',
      'X-Forwarded-For',
      'Cache-Control',
    ],
    exposedHeaders: [
      'X-Request-ID',
      'X-RateLimit-Limit',
      'X-RateLimit-Remaining',
      'X-RateLimit-Reset',
    ],
  });

  // Add global pipes for validation and sanitization
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Remove properties that are not in the DTO
      forbidNonWhitelisted: false, // Temporarily disable to debug
      transform: true, // Automatically transform payloads to DTO instances
      transformOptions: {
        enableImplicitConversion: true, // Allow automatic conversion of basic types
      },
      disableErrorMessages: false, // Show detailed error messages for debugging
    }),
    new SanitizationPipe(), // Apply sanitization to all incoming data
  );

  const port = process.env.PORT ?? 5678;
  await app.listen(port);
  // Using console.log for server startup message as it's important startup information
  logger.log(`🚀 Application is running on: http://localhost:${port}`);
}
bootstrap();
