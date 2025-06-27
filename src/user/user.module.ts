import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { PrismaModule } from '../prisma/prisma.module';

/**
 * User Module
 * 
 * Module này quản lý tất cả chức năng liên quan đến người dùng bao gồm:
 * 
 * CORE FEATURES:
 * - CRUD operations cho users (Tạo, Đọc, Cập nhật, Xóa)
 * - Xác thực và phân quyền user
 * - Quản lý profile và thông tin cá nhân
 * - Bulk operations (Xóa hàng loạt, Khôi phục hàng loạt)
 * - Thống kê và báo cáo user
 * 
 * SECURITY FEATURES:
 * - Password hashing và validation
 * - Email verification
 * - Role-based access control (RBAC)
 * - Rate limiting cho API endpoints
 * - Input sanitization và validation
 * - Audit logging cho các thao tác quan trọng
 * 
 * BUSINESS LOGIC:
 * - Password reset và forgot password
 * - User statistics và analytics
 * - Export user data
 * - Admin operations (suspend, activate, verify)
 * - Soft delete với khả năng restore
 * 
 * DEPENDENCIES:
 * - PrismaModule: Truy cập database thông qua Prisma ORM
 * - Common guards, interceptors, pipes được import trực tiếp trong controller
 *   để tránh circular dependencies và duy trì separation of concerns
 * 
 * INTEGRATION:
 * - Module này có thể được import bởi các modules khác cần UserService
 * - UserService được export để sử dụng trong AuthModule, BlogModule, etc.
 * - Controller handle REST API endpoints với full documentation
 * 
 * @version 2.0.0
 * @author PHGroup Development Team
 * @since 2024
 */
@Module({
	imports: [
		PrismaModule,     // Database access layer
	],
	controllers: [
		UserController,   // REST API endpoints với Swagger documentation
	],
	providers: [
		UserService,      // Business logic và data operations
	],
	exports: [
		UserService,      // Export để sử dụng trong modules khác
	],
})
export class UserModule {
	/**
	 * Module configuration notes:
	 * 
	 * 1. Guards, interceptors, và pipes được configure trực tiếp trong controller
	 *    để avoid circular dependencies và improve maintainability
	 * 
	 * 2. UserService được export để Auth module và các modules khác có thể inject
	 * 
	 * 3. Không import AuthModule ở đây để tránh circular dependency
	 *    (Auth depends on User, nên User không nên depend on Auth)
	 * 
	 * 4. Security middleware được handle ở global level hoặc controller level
	 * 
	 * 5. Database transaction support được handle trong service layer
	 */
}
