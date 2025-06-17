import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Use cookie parser
  app.use(cookieParser());
  
  // Enable CORS
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'https://www.phgrouptechs.com',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'X-API-Key',
    ],
  });
  
  const port = process.env.PORT ?? 5678;
  await app.listen(port);
  // Using console.log for server startup message as it's important startup information
  console.log(`🚀 Application is running on: http://localhost:${port}`);
}
bootstrap();
