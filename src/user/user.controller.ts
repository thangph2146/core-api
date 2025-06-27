import {
	Controller,
	Get,
	Post,
	Put,
	Body,
	Patch,
	Param,
	Delete,
	Query,
	ParseIntPipe,
	HttpCode,
	HttpStatus,
	UseGuards,
	UseInterceptors,
	Logger,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger'
import { UserService } from './user.service'
import {
	CreateUserDto,
	UpdateUserDto,
	UserQueryDto,
	UserResponseDto,
	UserListResponseDto,
	UserStatsQueryDto,
	UserStatsResponseDto,
	BulkUserOperationDto,
	BulkDeleteResponseDto,
	BulkRestoreResponseDto,
	BulkPermanentDeleteResponseDto,
	BulkUpdateResponseDto,
	BulkUpdateUserDto,
	ChangePasswordDto,
	AdminUserActionDto,
	UserExportDto,
	ForgotPasswordDto,
	ResetPasswordDto,
} from './dto/user.dto'
import { CrudPermissions, Public, RequireOwnership } from '../common/decorators/permissions.decorator'
import { SanitizationPipe } from '../common/pipes/sanitization.pipe'
import { EnhancedAuthGuard } from '../common/guards/enhanced-auth.guard'
import { AuditLogInterceptor } from '../common/interceptors/audit-log.interceptor'
import { RateLimitInterceptor } from '../common/interceptors/rate-limit.interceptor'
import { PERMISSIONS } from '../common/constants/permissions.constants'

/**
 * User Controller - REST API Layer
 * 
 * Controller này cung cấp REST API endpoints cho User management với:
 * 
 * 🔍 SEPARATED READ APIs:
 * - GET /api/users → ACTIVE users only (CrudPermissions.Users.Read)
 * - GET /api/users/deleted → DELETED users only (CrudPermissions.Users.ViewDeleted)
 * - GET /api/users/stats → User statistics (CrudPermissions.Users.Read)
 * - GET /api/users/:id → User details (CrudPermissions.Users.Read)
 * 
 * ✏️ WRITE OPERATIONS:
 * - POST /api/users → Create user (CrudPermissions.Users.Create)
 * - PATCH /api/users/:id → Update user (CrudPermissions.Users.Update)
 * - DELETE /api/users/:id → Soft delete (CrudPermissions.Users.Delete)
 * - POST /api/users/:id/restore → Restore user (CrudPermissions.Users.Restore)
 * 
 * 🔄 BULK OPERATIONS:
 * - POST /api/users/bulk/delete → Bulk soft delete
 * - POST /api/users/bulk/restore → Bulk restore
 * - POST /api/users/bulk/permanent-delete → Bulk permanent delete
 * - PUT /api/users/bulk/update → Bulk update
 * 
 * 🔐 SECURITY FEATURES:
 * - JWT Authentication required (EnhancedAuthGuard)
 * - Permission-based authorization (@CrudPermissions)
 * - Rate limiting (RateLimitInterceptor)
 * - Input sanitization (SanitizationPipe)
 * - Audit logging (AuditLogInterceptor)
 * 
 * 📚 API DOCUMENTATION:
 * - Comprehensive Swagger documentation
 * - Request/Response examples
 * - Error response documentation
 * - Permission requirements
 * 
 * @version 2.1.0 - Complete API Separation
 * @author PHGroup Development Team
 */
@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(EnhancedAuthGuard)
@UseInterceptors(AuditLogInterceptor, RateLimitInterceptor)
export class UserController {
	private readonly logger = new Logger(UserController.name)

	constructor(private readonly userService: UserService) {
		this.logger.log('🚀 UserController initialized with separated API endpoints')
	}

	// =============================================================================
	// READ OPERATIONS - LISTS AND QUERIES
	// =============================================================================

	/**
	 * GET /api/users
	 * Lấy danh sách người dùng với pagination và filtering
	 */
	@Get()
	@CrudPermissions.Users.Read()
	@ApiOperation({ 
		summary: 'Lấy danh sách người dùng',
		description: 'Lấy danh sách người dùng với các tùy chọn phân trang, tìm kiếm và lọc'
	})
	@ApiResponse({ 
		status: 200, 
		description: 'Danh sách người dùng được trả về thành công',
		type: UserListResponseDto 
	})
	async findAll(@Query() query: UserQueryDto): Promise<UserListResponseDto> {
		this.logger.log(`🔍 GET /api/users - ACTIVE users only - Query: ${JSON.stringify(query)}`)
		return this.userService.findAll(query)
	}

	/**
	 * GET /api/users/deleted
	 * Lấy danh sách người dùng đã xóa
	 */
	@Get('deleted')
	@CrudPermissions.Users.ViewDeleted()
	@ApiOperation({ 
		summary: 'Lấy danh sách người dùng đã xóa',
		description: 'Lấy danh sách các người dùng đã bị xóa mềm'
	})
	@ApiResponse({ 
		status: 200, 
		description: 'Danh sách người dùng đã xóa',
		type: UserListResponseDto 
	})
	async findDeleted(@Query() query: UserQueryDto): Promise<UserListResponseDto> {
		this.logger.log(`🗑️ GET /api/users/deleted - DELETED users only - Query: ${JSON.stringify(query)}`)
		return this.userService.findDeleted(query)
	}

	/**
	 * GET /api/users/stats
	 * Lấy thống kê người dùng
	 */
	@Get('stats')
	@CrudPermissions.Users.Read()
	@ApiOperation({ 
		summary: 'Lấy thống kê người dùng',
		description: 'Lấy các thống kê chi tiết về người dùng trong hệ thống'
	})
	@ApiResponse({ 
		status: 200, 
		description: 'Thống kê người dùng',
		type: UserStatsResponseDto 
	})
	async getUserStats(@Query() query: UserStatsQueryDto): Promise<UserStatsResponseDto> {
		this.logger.log(`GET /users/stats - Query: ${JSON.stringify(query)}`)
		return this.userService.getUserStats(query)
	}

	/**
	 * GET /api/users/:id
	 * Lấy thông tin chi tiết người dùng theo ID
	 */
	@Get(':id')
	@CrudPermissions.Users.Read()
	@ApiOperation({ 
		summary: 'Lấy thông tin người dùng',
		description: 'Lấy thông tin chi tiết của một người dùng theo ID'
	})
	@ApiResponse({ 
		status: 200, 
		description: 'Thông tin người dùng',
		type: UserResponseDto 
	})
	@ApiResponse({ 
		status: 404, 
		description: 'Không tìm thấy người dùng' 
	})
	async findOne(@Param('id', ParseIntPipe) id: number): Promise<UserResponseDto> {
		this.logger.log(`GET /users/${id}`)
		// Allow finding deleted users by ID if explicitly requested by an admin
		const user = await this.userService.findOne(id, true)
		return user
	}

	/**
	 * GET /api/users/email/:email
	 * Lấy thông tin chi tiết người dùng theo email
	 */
	@Get('email/:email')
	@CrudPermissions.Users.Read()
	@ApiOperation({
		summary: 'Lấy thông tin người dùng theo email',
		description: 'Lấy thông tin chi tiết của một người dùng theo địa chỉ email.'
	})
	@ApiResponse({
		status: 200,
		description: 'Thông tin người dùng',
		type: UserResponseDto
	})
	@ApiResponse({
		status: 404,
		description: 'Không tìm thấy người dùng'
	})
	async findByEmail(@Param('email') email: string): Promise<UserResponseDto> {
		this.logger.log(`GET /users/email/${email}`)
		// Allow finding deleted users by email if explicitly requested by an admin
		return this.userService.findByEmail(email, true)
	}

	// =============================================================================
	// WRITE OPERATIONS - CREATE, UPDATE, DELETE
	// =============================================================================

	/**
	 * POST /api/users
	 * Tạo người dùng mới
	 */
	@Post()
	@HttpCode(HttpStatus.CREATED)
	@CrudPermissions.Users.Create()
	@ApiOperation({ 
		summary: 'Tạo người dùng mới',
		description: 'Tạo một người dùng mới trong hệ thống'
	})
	@ApiResponse({ 
		status: 201, 
		description: 'Người dùng được tạo thành công',
		type: UserResponseDto 
	})
	@ApiResponse({ 
		status: 400, 
		description: 'Dữ liệu đầu vào không hợp lệ' 
	})
	@ApiResponse({ 
		status: 409, 
		description: 'Email đã được sử dụng' 
	})
	async create(
		@Body(new SanitizationPipe()) createUserDto: CreateUserDto,
	): Promise<UserResponseDto> {
		this.logger.log(`POST /users - Tạo user với email: ${createUserDto.email}`)
		return this.userService.create(createUserDto)
	}

	/**
	 * PATCH /api/users/:id
	 * Cập nhật thông tin người dùng
	 */
	@Patch(':id')
	@CrudPermissions.Users.Update()
	@ApiOperation({ 
		summary: 'Cập nhật người dùng',
		description: 'Cập nhật thông tin của một người dùng theo ID'
	})
	@ApiResponse({ 
		status: 200, 
		description: 'Người dùng được cập nhật thành công',
		type: UserResponseDto 
	})
	@ApiResponse({ 
		status: 404, 
		description: 'Không tìm thấy người dùng' 
	})
	async update(
		@Param('id', ParseIntPipe) id: number,
		@Body(new SanitizationPipe()) updateUserDto: UpdateUserDto,
	): Promise<UserResponseDto> {
		this.logger.log(`PATCH /users/${id}`)
		return this.userService.update(id, updateUserDto)
	}

	/**
	 * PATCH /api/users/:id/change-password
	 * Thay đổi mật khẩu người dùng
	 */
	@Patch(':id/change-password')
	@RequireOwnership('USER')
	@CrudPermissions.Users.Update()
	@HttpCode(HttpStatus.NO_CONTENT)
	@ApiOperation({
		summary: 'Thay đổi mật khẩu người dùng',
		description: 'Cho phép người dùng tự thay đổi mật khẩu của mình. Yêu cầu mật khẩu hiện tại.'
	})
	@ApiResponse({
		status: 204,
		description: 'Mật khẩu đã được thay đổi thành công'
	})
	@ApiResponse({
		status: 400,
		description: 'Mật khẩu không hợp lệ hoặc không khớp'
	})
	@ApiResponse({
		status: 403,
		description: 'Không có quyền thay đổi mật khẩu của người dùng này'
	})
	async changePassword(
		@Param('id', ParseIntPipe) id: number,
		@Body(new SanitizationPipe()) changePasswordDto: ChangePasswordDto,
	): Promise<void> {
		this.logger.log(`PATCH /users/${id}/change-password - User attempting to change password`)
		await this.userService.changePassword(id, changePasswordDto)
	}

	/**
	 * DELETE /api/users/:id
	 * Xóa mềm người dùng
	 */
	@Delete(':id')
	@HttpCode(HttpStatus.NO_CONTENT)
	@CrudPermissions.Users.Delete()
	@ApiOperation({ 
		summary: 'Xóa người dùng',
		description: 'Xóa mềm một người dùng (có thể khôi phục)'
	})
	@ApiResponse({ 
		status: 204, 
		description: 'Người dùng được xóa thành công' 
	})
	@ApiResponse({ 
		status: 404, 
		description: 'Không tìm thấy người dùng' 
	})
	async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
		this.logger.log(`DELETE /users/${id} - Xóa mềm`)
		return this.userService.remove(id)
	}

	// =============================================================================
	// RESTORATION OPERATIONS
	// =============================================================================

	/**
	 * POST /api/users/:id/restore
	 * Khôi phục người dùng đã xóa
	 */
	@Post(':id/restore')
	@CrudPermissions.Users.Restore()
	@ApiOperation({ 
		summary: 'Khôi phục người dùng',
		description: 'Khôi phục một người dùng đã bị xóa mềm'
	})
	@ApiResponse({ 
		status: 200, 
		description: 'Người dùng được khôi phục thành công',
		type: UserResponseDto 
	})
	@ApiResponse({ 
		status: 404, 
		description: 'Không tìm thấy người dùng đã xóa' 
	})
	async restore(@Param('id', ParseIntPipe) id: number): Promise<UserResponseDto> {
		this.logger.log(`POST /users/${id}/restore - Khôi phục cá nhân`)
		return this.userService.restore(id)
	}

	/**
	 * DELETE /api/users/:id/permanent
	 * Xóa vĩnh viễn người dùng
	 */
	@Delete(':id/permanent')
	@HttpCode(HttpStatus.NO_CONTENT)
	@CrudPermissions.Users.PermanentDelete()
	@ApiOperation({ 
		summary: 'Xóa vĩnh viễn người dùng',
		description: 'Xóa vĩnh viễn một người dùng (không thể khôi phục)'
	})
	@ApiResponse({ 
		status: 204, 
		description: 'Người dùng được xóa vĩnh viễn' 
	})
	@ApiResponse({ 
		status: 404, 
		description: 'Không tìm thấy người dùng' 
	})
	async permanentDelete(@Param('id', ParseIntPipe) id: number): Promise<void> {
		this.logger.log(`DELETE /users/${id}/permanent - Xóa vĩnh viễn`)
		return this.userService.permanentDelete(id)
	}

	// =============================================================================
	// BULK OPERATIONS
	// =============================================================================

	/**
	 * POST /api/users/bulk/delete
	 * Bulk soft delete users
	 */
	@Post('bulk/delete')
	@HttpCode(HttpStatus.OK)
	@CrudPermissions.Users.BulkDelete()
	@ApiOperation({
		summary: 'Xóa mềm nhiều người dùng',
		description: 'Xóa mềm nhiều người dùng dựa trên danh sách ID'
	})
	@ApiResponse({
		status: 200,
		description: 'Thao tác xóa mềm hàng loạt hoàn tất',
		type: BulkDeleteResponseDto
	})
	async bulkDelete(
		@Body() body: BulkUserOperationDto,
	): Promise<BulkDeleteResponseDto> {
		this.logger.log(`POST /users/bulk/delete - IDs: ${body.userIds.join(', ')}`)
		return this.userService.bulkDelete(body.userIds)
	}

	/**
	 * POST /api/users/bulk/permanent-delete
	 * Xóa vĩnh viễn nhiều người dùng
	 */
	@Post('bulk/permanent-delete')
	@CrudPermissions.Users.PermanentDelete()
	@HttpCode(HttpStatus.OK)
	@ApiOperation({
		summary: 'Xóa vĩnh viễn nhiều người dùng',
		description: 'Xóa vĩnh viễn nhiều người dùng và tất cả dữ liệu liên quan của họ.',
	})
	@ApiResponse({
		status: 200,
		description: 'Số người dùng đã được xóa vĩnh viễn thành công',
		type: BulkPermanentDeleteResponseDto,
	})
	async bulkPermanentDelete(
		@Body() body: BulkUserOperationDto,
	): Promise<BulkPermanentDeleteResponseDto> {
		this.logger.log(
			`POST /users/bulk/permanent-delete - IDs: ${body.userIds.join(', ')}`,
		)
		return this.userService.bulkPermanentDelete(body.userIds)
	}

	/**
	 * POST /api/users/bulk/restore
	 * Khôi phục nhiều người dùng đã xóa
	 */
	@Post('bulk/restore')
	@CrudPermissions.Users.Restore()
	@HttpCode(HttpStatus.OK)
	@ApiOperation({
		summary: 'Khôi phục nhiều người dùng',
		description: 'Khôi phục nhiều người dùng đã bị xóa mềm.',
	})
	@ApiResponse({
		status: 200,
		description: 'Số người dùng đã được khôi phục thành công',
		type: BulkRestoreResponseDto,
	})
	async bulkRestore(
		@Body() body: BulkUserOperationDto,
	): Promise<BulkRestoreResponseDto> {
		this.logger.log(`POST /users/bulk/restore - IDs: ${body.userIds.join(', ')}`)
		return this.userService.bulkRestore(body.userIds)
	}

	/**
	 * PUT /api/users/bulk/update
	 * Cập nhật nhiều người dùng
	 */
	@Put('bulk/update')
	@HttpCode(HttpStatus.OK)
	@CrudPermissions.Users.FullAccess()
	@ApiOperation({
		summary: 'Cập nhật hàng loạt người dùng',
		description: 'Cập nhật thông tin cho nhiều người dùng cùng lúc, ví dụ: thay đổi role'
	})
	@ApiResponse({
		status: 200,
		description: 'Thao tác cập nhật hàng loạt hoàn tất',
		type: BulkUpdateResponseDto
	})
	async bulkUpdate(
		@Body(new SanitizationPipe()) body: BulkUpdateUserDto
	): Promise<BulkUpdateResponseDto> {
		this.logger.log(`PUT /users/bulk/update - Updating users: ${body.userIds.join(', ')}`)
		return this.userService.bulkUpdate(body.userIds, body.updateData)
	}

	// =============================================================================
	// ADMIN & SPECIAL OPERATIONS
	// =============================================================================

	/**
	 * POST /api/users/:id/admin-action
	 * Thực hiện các hành động quản trị viên
	 */
	@Post(':id/admin-action')
	@CrudPermissions.Users.FullAccess()
	@HttpCode(HttpStatus.OK)
	@ApiOperation({
		summary: 'Thực hiện hành động quản trị',
		description: 'Thực hiện các hành động đặc biệt của quản trị viên trên một người dùng (ví dụ: treo, kích hoạt, xác minh email).'
	})
	@ApiResponse({
		status: 200,
		description: 'Hành động quản trị viên được thực hiện thành công',
		type: UserResponseDto
	})
	async adminAction(
		@Param('id', ParseIntPipe) id: number,
		@Body(new SanitizationPipe()) actionDto: AdminUserActionDto,
	): Promise<UserResponseDto> {
		this.logger.log(`POST /users/${id}/admin-action - Action: ${actionDto.action}`)
		return this.userService.adminAction(id, actionDto)
	}

	/**
	 * POST /api/users/export
	 * Xuất dữ liệu người dùng
	 */
	@Post('export')
	@CrudPermissions.Users.Read()
	@HttpCode(HttpStatus.OK)
	@ApiOperation({
		summary: 'Xuất dữ liệu người dùng',
		description: 'Xuất danh sách người dùng ra một định dạng file (ví dụ: CSV, JSON).'
	})
	@ApiResponse({
		status: 200,
		description: 'Dữ liệu người dùng được xuất thành công'
	})
	async exportUsers(
		@Body(new SanitizationPipe()) exportDto: UserExportDto,
	): Promise<any> {
		this.logger.log(`POST /users/export - Exporting users with format: ${exportDto.format}`)
		const users = await this.userService.exportUsers(exportDto)
		// Note: In a real app, you would stream a file (e.g., res.send(csv_data))
		return users
	}

	// =============================================================================
	// PASSWORD RESET FLOW
	// =============================================================================

	/**
	 * POST /api/users/forgot-password
	 * Yêu cầu reset mật khẩu
	 */
	@Post('forgot-password')
	@Public()
	@HttpCode(HttpStatus.NO_CONTENT)
	@ApiOperation({
		summary: 'Yêu cầu reset mật khẩu',
		description: 'Bắt đầu quy trình quên mật khẩu bằng cách gửi email chứa token reset.'
	})
	@ApiResponse({
		status: 204,
		description: 'Nếu email tồn tại, một email reset sẽ được gửi đi.'
	})
	async forgotPassword(
		@Body(new SanitizationPipe()) forgotPasswordDto: ForgotPasswordDto
	): Promise<void> {
		this.logger.log(`POST /users/forgot-password for email: ${forgotPasswordDto.email}`);
		return this.userService.forgotPassword(forgotPasswordDto);
	}

	/**
	 * POST /api/users/reset-password
	 * Reset mật khẩu bằng token
	 */
	@Post('reset-password')
	@Public()
	@HttpCode(HttpStatus.NO_CONTENT)
	@ApiOperation({
		summary: 'Hoàn tất reset mật khẩu',
		description: 'Đặt lại mật khẩu người dùng bằng token đã được gửi qua email.'
	})
	@ApiResponse({
		status: 204,
		description: 'Mật khẩu đã được reset thành công.'
	})
	@ApiResponse({
		status: 400,
		description: 'Token không hợp lệ hoặc đã hết hạn.'
	})
	async resetPassword(
		@Body(new SanitizationPipe()) resetPasswordDto: ResetPasswordDto
	): Promise<void> {
		this.logger.log(`POST /users/reset-password`);
		return this.userService.resetPassword(resetPasswordDto);
	}

	// =============================================================================
	// HEALTH CHECK
	// =============================================================================
	
	/**
	 * GET /api/users/health
	 * Kiểm tra "sức khỏe" của controller
	 */
	@Get('health')
	@Public()
	@ApiOperation({ 
		summary: 'Kiểm tra sức khỏe',
		description: 'Kiểm tra xem User service có đang hoạt động hay không'
	})
	async healthCheck(): Promise<{ status: string; timestamp: string }> {
		return {
			status: 'ok',
			timestamp: new Date().toISOString(),
		}
	}
}
