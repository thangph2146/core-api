import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Body,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
  UseInterceptors,
  Logger,
  SetMetadata,
  BadRequestException,
  DefaultValuePipe,
  ParseBoolPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { UserService } from './user.service';
import {
  CreateUserDto,
  UpdateUserDto,
  UserQueryDto,
  UserResponseDto,
  UserListResponseDto,
  UserStatsQueryDto,
  UserStatsResponseDto,
  BulkUserOperationDto,
  BulkRestoreUsersDto,
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
} from './dto/user.dto';
import {
  CrudPermissions,
  Public,
  RequireOwnership,
} from '../common/decorators/permissions.decorator';
import { EnhancedAuthGuard } from '../common/guards/enhanced-auth.guard';
import { AuditLogInterceptor } from '../common/interceptors/audit-log.interceptor';
import { RateLimitInterceptor } from '../common/interceptors/rate-limit.interceptor';

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
  private readonly logger = new Logger(UserController.name);

  constructor(private readonly userService: UserService) {
    this.logger.log(
      '🚀 UserController initialized with separated API endpoints',
    );
  }

  // =============================================================================
  // CRUD OPERATIONS
  // =============================================================================

  /**
   * GET /api/users
   * Lấy danh sách người dùng với phân trang và lọc
   */
  @Get()
  @CrudPermissions.Users.Read()
  @ApiOperation({
    summary: 'Lấy danh sách người dùng',
    description:
      'Lấy danh sách người dùng với khả năng phân trang, tìm kiếm và lọc',
  })
  @ApiResponse({
    status: 200,
    description: 'Danh sách người dùng được trả về thành công',
    type: UserListResponseDto,
  })
  async findAll(@Query() query: UserQueryDto): Promise<UserListResponseDto> {
    this.logger.log(
      `GET /users - Page: ${query.page}, Limit: ${query.limit}, Search: ${query.search}`,
    );
    return this.userService.findAll(query);
  }

  /**
   * GET /api/users/deleted
   * Lấy danh sách người dùng đã xóa
   */
  @Get('deleted')
  @CrudPermissions.Users.Read()
  @ApiOperation({
    summary: 'Lấy danh sách người dùng đã xóa',
    description: 'Lấy danh sách người dùng đã bị xóa mềm',
  })
  @ApiResponse({
    status: 200,
    description: 'Danh sách người dùng đã xóa được trả về thành công',
    type: UserListResponseDto,
  })
  async findDeleted(
    @Query() query: UserQueryDto,
  ): Promise<UserListResponseDto> {
    this.logger.log(`GET /users/deleted - Getting deleted users list`);
    return this.userService.findDeleted(query);
  }

  /**
   * GET /api/users/stats
   * Lấy thống kê người dùng
   */
  @Get('stats')
  @CrudPermissions.Users.Read()
  @ApiOperation({
    summary: 'Lấy thống kê người dùng',
    description: 'Lấy thống kê tổng quan về người dùng trong hệ thống',
  })
  @ApiResponse({
    status: 200,
    description: 'Thống kê người dùng được trả về thành công',
    type: UserStatsResponseDto,
  })
  async getUserStats(
    @Query() query: UserStatsQueryDto,
  ): Promise<UserStatsResponseDto> {
    this.logger.log(`GET /users/stats - Getting user statistics`);
    return this.userService.getUserStats(query);
  }

  // =============================================================================
  // BULK OPERATIONS - MUST BE BEFORE :id ROUTES
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
    description: 'Xóa mềm nhiều người dùng dựa trên danh sách ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Thao tác xóa mềm hàng loạt hoàn tất',
    type: BulkDeleteResponseDto,
  })
  async bulkDelete(
    @Body() body: BulkUserOperationDto,
  ): Promise<BulkDeleteResponseDto> {
    this.logger.log(
      `POST /users/bulk/delete - IDs: ${body.userIds.join(', ')}`,
    );
    return this.userService.bulkDelete(body.userIds);
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
    description:
      'Xóa vĩnh viễn nhiều người dùng và tất cả dữ liệu liên quan của họ.',
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
    );
    return this.userService.bulkPermanentDelete(body.userIds);
  }

  /**
   * POST /api/users/bulk/restore
   * Khôi phục nhiều người dùng đã xóa
   */
  @Post('bulk/restore')
  @HttpCode(HttpStatus.OK)
  @CrudPermissions.Users.Restore()
  @ApiOperation({
    summary: 'Khôi phục nhiều người dùng',
    description: 'Khôi phục nhiều người dùng đã bị xóa mềm',
  })
  @ApiResponse({
    status: 200,
    description: 'Số người dùng đã được khôi phục thành công',
    type: BulkRestoreResponseDto,
  })
  async bulkRestore(
    @Body() body: BulkRestoreUsersDto,
  ): Promise<BulkRestoreResponseDto> {
    this.logger.log(
      `POST /users/bulk/restore - Restoring user IDs: ${body.userIds.join(', ')}`,
    );
    return this.userService.bulkRestore(body.userIds);
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
    description:
      'Cập nhật thông tin cho nhiều người dùng cùng lúc, ví dụ: thay đổi role',
  })
  @ApiResponse({
    status: 200,
    description: 'Thao tác cập nhật hàng loạt hoàn tất',
    type: BulkUpdateResponseDto,
  })
  async bulkUpdate(
    @Body() body: BulkUpdateUserDto,
  ): Promise<BulkUpdateResponseDto> {
    this.logger.log(
      `PUT /users/bulk/update - User IDs: ${body.userIds.join(', ')}`,
    );
    return this.userService.bulkUpdate(body.userIds, body.updateData);
  }

  // =============================================================================
  // SINGLE USER OPERATIONS - AFTER BULK OPERATIONS
  // =============================================================================

  /**
   * GET /api/users/:id
   * Lấy thông tin chi tiết một người dùng
   */
  @Get(':id')
  @CrudPermissions.Users.Read()
  @ApiOperation({
    summary: 'Lấy thông tin người dùng',
    description: 'Lấy thông tin chi tiết của một người dùng theo ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Thông tin người dùng được trả về thành công',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy người dùng',
  })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @Query('includeDeleted', new DefaultValuePipe(false), ParseBoolPipe)
    includeDeleted: boolean,
  ): Promise<UserResponseDto> {
    this.logger.log(
      `GET /users/${id} - Getting user details, includeDeleted: ${includeDeleted}`,
    );
    return this.userService.findOne(id, includeDeleted);
  }

  /**
   * GET /api/users/email/:email
   * Tìm người dùng theo email
   */
  @Get('email/:email')
  @CrudPermissions.Users.Read()
  @ApiOperation({
    summary: 'Tìm người dùng theo email',
    description: 'Lấy thông tin người dùng dựa trên địa chỉ email',
  })
  @ApiResponse({
    status: 200,
    description: 'Thông tin người dùng được trả về thành công',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy người dùng với email này',
  })
  async findByEmail(@Param('email') email: string): Promise<UserResponseDto> {
    this.logger.log(`GET /users/email/${email} - Finding user by email`);
    return this.userService.findByEmail(email);
  }

  /**
   * POST /api/users
   * Tạo người dùng mới
   */
  @Post()
  @CrudPermissions.Users.Create()
  @ApiOperation({
    summary: 'Tạo người dùng mới',
    description:
      'Tạo một người dùng mới trong hệ thống với thông tin cơ bản và tùy chọn profile',
  })
  @ApiResponse({
    status: 201,
    description: 'Người dùng được tạo thành công',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Dữ liệu đầu vào không hợp lệ',
  })
  @ApiResponse({
    status: 409,
    description: 'Email đã được sử dụng',
  })
  async create(@Body() createUserDto: CreateUserDto): Promise<UserResponseDto> {
    this.logger.log(`POST /users - Creating new user: ${createUserDto.email}`);
    return this.userService.create(createUserDto);
  }

  /**
   * PUT /api/users/:id
   * Cập nhật thông tin người dùng
   */
  @Patch(':id')
  @CrudPermissions.Users.Update()
  @ApiOperation({
    summary: 'Cập nhật thông tin người dùng',
    description:
      'Cập nhật thông tin của một người dùng, bao gồm cả profile nếu có',
  })
  @ApiResponse({
    status: 200,
    description: 'Người dùng được cập nhật thành công',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy người dùng',
  })
  @ApiResponse({
    status: 409,
    description: 'Email đã được sử dụng bởi người dùng khác',
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    this.logger.log(`PUT /users/${id} - Updating user`);
    return this.userService.update(id, updateUserDto);
  }

  /**
   * POST /api/users/:id/change-password
   * Thay đổi mật khẩu
   */
  @Post(':id/change-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @CrudPermissions.Users.Update()
  @ApiOperation({
    summary: 'Thay đổi mật khẩu',
    description: 'Thay đổi mật khẩu cho một người dùng',
  })
  @ApiResponse({
    status: 204,
    description: 'Mật khẩu được thay đổi thành công',
  })
  @ApiResponse({
    status: 400,
    description: 'Mật khẩu hiện tại không đúng hoặc mật khẩu mới không hợp lệ',
  })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy người dùng',
  })
  async changePassword(
    @Param('id', ParseIntPipe) id: number,
    @Body() changePasswordDto: ChangePasswordDto,
  ): Promise<void> {
    this.logger.log(`POST /users/${id}/change-password - Changing password`);
    return this.userService.changePassword(id, changePasswordDto);
  }

  /**
   * DELETE /api/users/:id
   * Xóa mềm người dùng
   */
  @Delete(':id')
  @CrudPermissions.Users.Delete()
  @ApiOperation({
    summary: 'Xóa người dùng',
    description:
      'Đánh dấu người dùng là đã xóa (soft delete). Dữ liệu vẫn còn trong DB nhưng không thể truy cập.',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    this.logger.log(`DELETE /users/${id} - Soft deleting user`);
    return this.userService.remove(id);
  }

  /**
   * POST /api/users/:id/restore
   * Khôi phục người dùng đã xóa
   */
  @Post(':id/restore')
  @CrudPermissions.Users.Restore()
  @ApiOperation({
    summary: 'Khôi phục người dùng',
    description: 'Khôi phục một người dùng đã bị xóa mềm',
  })
  @ApiResponse({
    status: 200,
    description: 'Người dùng được khôi phục thành công',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy người dùng đã xóa',
  })
  async restore(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<UserResponseDto> {
    this.logger.log(`POST /users/${id}/restore - Khôi phục cá nhân`);
    return this.userService.restore(id);
  }

  /**
   * DELETE /api/users/:id/permanent
   * Xóa vĩnh viễn người dùng
   */
  @Delete(':id/permanent')
  @CrudPermissions.Users.PermanentDelete()
  @ApiOperation({
    summary: 'Xóa vĩnh viễn người dùng',
    description: 'Xóa vĩnh viễn một người dùng (không thể khôi phục)',
  })
  @ApiResponse({
    status: 204,
    description: 'Người dùng được xóa vĩnh viễn',
  })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy người dùng',
  })
  async permanentDelete(@Param('id', ParseIntPipe) id: number): Promise<void> {
    this.logger.log(`DELETE /users/${id}/permanent - Xóa vĩnh viễn`);
    return this.userService.permanentDelete(id);
  }

  /**
   * POST /api/users/:id/admin-action
   * Thực hiện hành động quản trị trên người dùng
   */
  @Post(':id/admin-action')
  @CrudPermissions.Users.Update()
  @ApiOperation({
    summary: 'Thực hiện hành động quản trị trên người dùng',
    description:
      'Thực hiện các hành động như suspend, activate, verify email...',
  })
  @ApiResponse({
    status: 200,
    description: 'Hành động quản trị được thực hiện thành công',
    type: UserResponseDto,
  })
  async adminAction(
    @Param('id', ParseIntPipe) id: number,
    @Body() actionDto: AdminUserActionDto,
  ): Promise<UserResponseDto> {
    this.logger.log(
      `POST /users/${id}/admin-action - Action: ${actionDto.action}`,
    );
    return this.userService.adminAction(id, actionDto);
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
    summary: 'Quên mật khẩu',
    description: 'Gửi yêu cầu reset mật khẩu cho một email',
  })
  @ApiResponse({
    status: 204,
    description: 'Yêu cầu đã được xử lý (email sẽ được gửi nếu tồn tại)',
  })
  async forgotPassword(
    @Body() forgotPasswordDto: ForgotPasswordDto,
  ): Promise<void> {
    this.logger.log(
      `POST /users/forgot-password - Email: ${forgotPasswordDto.email}`,
    );
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
    summary: 'Reset mật khẩu',
    description: 'Đặt lại mật khẩu bằng token đã nhận được qua email',
  })
  @ApiResponse({
    status: 204,
    description: 'Mật khẩu đã được reset thành công',
  })
  async resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto,
  ): Promise<void> {
    this.logger.log(`POST /users/reset-password - Bắt đầu quá trình reset`);
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
    description: 'Kiểm tra xem User service có đang hoạt động hay không',
  })
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
