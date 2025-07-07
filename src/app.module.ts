import {
	Module,
	MiddlewareConsumer,
	NestModule,
	ValidationPipe,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_PIPE, APP_INTERCEPTOR } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { BlogModule } from './blog/blog.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { RoleModule } from './role/role.module';
import { PermissionModule } from './permission/permission.module';
import { CategoryModule } from './category/category.module';
import { TagModule } from './tag/tag.module';
import { MediaModule } from './media/media.module';
import { RecruitmentModule } from './recruitment/recruitment.module';
import { ServiceModule } from './service/service.module';
import { StatusModule } from './status/status.module';
import { AuthGuard } from './auth/auth.guard';
import { SecurityHeadersMiddleware } from './common/middleware/security-headers.middleware';
import { RateLimitInterceptor } from './common/interceptors/rate-limit.interceptor';
import { AuditLogInterceptor } from './common/interceptors/audit-log.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    UserModule,
    RoleModule,
    PermissionModule,
    BlogModule,
    CategoryModule,
    TagModule,
    MediaModule,
    RecruitmentModule,
    ServiceModule,
    StatusModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Global Guards - Order matters!
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    // Global Pipes
    {
      provide: APP_PIPE,
      useFactory: () => new ValidationPipe({
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
        whitelist: true,
        forbidNonWhitelisted: false,
        disableErrorMessages: false,
      }),
    },
    // Global Interceptors
    {
      provide: APP_INTERCEPTOR,
      useClass: RateLimitInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditLogInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(SecurityHeadersMiddleware).forRoutes('*');
  }
}
