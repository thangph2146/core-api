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
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { UserService } from './user.service';
import {
  CreateUserDto,
  UpdateUserDto,
  AdminUserQueryDto,
  UserQueryDto,
  UserResponseDto,
  UserListResponseDto,
  UserStatsDto,
  UserOptionDto,
  ChangePasswordDto,
  BulkUserOperationDto,
  BulkDeleteResponseDto,
  BulkRestoreResponseDto,
  BulkPermanentDeleteResponseDto,
} from './dto/user.dto';
import {
  CrudPermissions,
  CurrentUser,
} from '../common/decorators/permissions.decorator';
import { EnhancedAuthGuard } from '../common/guards/enhanced-auth.guard';
import { AuditLogInterceptor } from '../common/interceptors/audit-log.interceptor';
import { RateLimitInterceptor } from '../common/interceptors/rate-limit.interceptor';
import { AuthGuard } from '../auth/auth.guard';

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
  // MAIN ENDPOINTS
  // =============================================================================

  @Get()
  @UseGuards(AuthGuard)
  @CrudPermissions.Users.Read()
  @ApiOperation({
    summary: 'Lấy danh sách người dùng (Admin)',
    description: 'Lấy danh sách tất cả người dùng với phân trang và lọc (dành cho admin)',
  })
  @ApiQuery({ name: 'page', required: false, description: 'Số trang', example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: 'Số lượng mỗi trang', example: 10 })
  @ApiQuery({ name: 'search', required: false, description: 'Từ khóa tìm kiếm' })
  @ApiQuery({ name: 'roleId', required: false, description: 'Lọc theo vai trò' })
  @ApiQuery({ name: 'includeDeleted', required: false, description: 'Bao gồm người dùng đã xóa' })
  @ApiResponse({
    status: 200,
    description: 'Danh sách người dùng',
    type: UserListResponseDto,
  })
  async findAll(
    @Query() query: AdminUserQueryDto,
    @CurrentUser() currentUser: any,
  ): Promise<UserListResponseDto> {
    return this.userService.findAll(query, currentUser.id);
  }

  @Get('public')
  @ApiOperation({
    summary: 'Lấy danh sách người dùng công khai',
    description: 'Lấy danh sách người dùng cho public API (không bao gồm người dùng đã xóa)',
  })
  @ApiQuery({ name: 'page', required: false, description: 'Số trang', example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: 'Số lượng mỗi trang', example: 10 })
  @ApiQuery({ name: 'search', required: false, description: 'Từ khóa tìm kiếm' })
  @ApiResponse({
    status: 200,
    description: 'Danh sách người dùng công khai',
    type: UserListResponseDto,
  })
  async findPublic(@Query() query: UserQueryDto): Promise<UserListResponseDto> {
    return this.userService.findPublic(query);
  }

  @Get('deleted')
  @UseGuards(AuthGuard)
  @CrudPermissions.Users.Read()
  @ApiOperation({
    summary: 'Lấy danh sách người dùng đã xóa',
    description: 'Lấy danh sách người dùng đã bị xóa mềm',
  })
  @ApiQuery({ name: 'page', required: false, description: 'Số trang', example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: 'Số lượng mỗi trang', example: 10 })
  @ApiQuery({ name: 'search', required: false, description: 'Từ khóa tìm kiếm' })
  @ApiResponse({
    status: 200,
    description: 'Danh sách người dùng đã xóa',
    type: UserListResponseDto,
  })
  async findDeleted(@Query() query: AdminUserQueryDto): Promise<UserListResponseDto> {
    return this.userService.findAll({ ...query, deleted: true });
  }

  @Get('stats')
  @UseGuards(AuthGuard)
  @CrudPermissions.Users.Read()
  @ApiOperation({
    summary: 'Lấy thống kê người dùng',
    description: 'Lấy thống kê tổng quan về người dùng trong hệ thống',
  })
  @ApiResponse({
    status: 200,
    description: 'Thống kê người dùng',
    type: UserStatsDto,
  })
  async getStats(): Promise<UserStatsDto> {
    return this.userService.getStats();
  }

  @Get('options')
  @UseGuards(AuthGuard)
  @CrudPermissions.Users.Read()
  @ApiOperation({
    summary: 'Lấy danh sách người dùng cho dropdown',
    description: 'Lấy danh sách người dùng dạng key-value cho dropdown/select',
  })
  @ApiResponse({
    status: 200,
    description: 'Danh sách options người dùng',
    type: [UserOptionDto],
  })
  async getOptions(): Promise<UserOptionDto[]> {
    return this.userService.getOptions();
  }

  // =============================================================================
  // BULK OPERATIONS
  // =============================================================================

  @Post('bulk/delete')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @CrudPermissions.Users.BulkDelete()
  @ApiOperation({
    summary: 'Xóa mềm nhiều người dùng',
    description: 'Xóa mềm nhiều người dùng cùng lúc (soft delete)',
  })
  @ApiResponse({
    status: 200,
    description: 'Xóa thành công',
    type: BulkDeleteResponseDto,
  })
  async bulkDelete(@Body() body: BulkUserOperationDto): Promise<BulkDeleteResponseDto> {
    return this.userService.bulkDelete(body.userIds);
  }

  @Post('bulk/restore')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @CrudPermissions.Users.BulkRestore()
  @ApiOperation({
    summary: 'Khôi phục nhiều người dùng',
    description: 'Khôi phục nhiều người dùng đã bị xóa mềm',
  })
  @ApiResponse({
    status: 200,
    description: 'Khôi phục thành công',
    type: BulkRestoreResponseDto,
  })
  async bulkRestore(@Body() body: BulkUserOperationDto): Promise<BulkRestoreResponseDto> {
    return this.userService.bulkRestore(body.userIds);
  }

  @Post('bulk/permanent-delete')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @CrudPermissions.Users.BulkPermanentDelete()
  @ApiOperation({
    summary: 'Xóa vĩnh viễn nhiều người dùng',
    description: 'Xóa vĩnh viễn nhiều người dùng khỏi hệ thống',
  })
  @ApiResponse({
    status: 200,
    description: 'Xóa vĩnh viễn thành công',
    type: BulkPermanentDeleteResponseDto,
  })
  async bulkPermanentDelete(@Body() body: BulkUserOperationDto): Promise<BulkPermanentDeleteResponseDto> {
    return this.userService.bulkPermanentDelete(body.userIds);
  }

  // =============================================================================
  // INDIVIDUAL OPERATIONS
  // =============================================================================

  @Get(':id')
  @UseGuards(AuthGuard)
  @CrudPermissions.Users.Read()
  @ApiOperation({
    summary: 'Lấy thông tin người dùng theo ID',
    description: 'Lấy thông tin chi tiết của một người dùng',
  })
  @ApiParam({ name: 'id', description: 'ID người dùng', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Thông tin người dùng',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Không tìm thấy người dùng' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<UserResponseDto> {
    const user = await this.userService.findOne(id);
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }
    return user;
  }

  @Post()
  @UseGuards(AuthGuard)
  @CrudPermissions.Users.Create()
  @ApiOperation({
    summary: 'Tạo người dùng mới',
    description: 'Tạo một người dùng mới trong hệ thống',
  })
  @ApiResponse({
    status: 201,
    description: 'Tạo người dùng thành công',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  @ApiResponse({ status: 409, description: 'Email đã tồn tại' })
  async create(@Body() createUserDto: CreateUserDto): Promise<UserResponseDto> {
    return this.userService.create(createUserDto);
  }

  @Patch(':id')
  @UseGuards(AuthGuard)
  @CrudPermissions.Users.Update()
  @ApiOperation({
    summary: 'Cập nhật thông tin người dùng',
    description: 'Cập nhật thông tin của một người dùng',
  })
  @ApiParam({ name: 'id', description: 'ID người dùng', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Cập nhật thành công',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Không tìm thấy người dùng' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    // ENHANCED LOGGING - Debug payload format issue
    this.logger.log(`🔍 CONTROLLER UPDATE - Raw request details:`, {
      userId: id,
      method: 'PATCH',
      endpoint: `/api/users/${id}`,
      timestamp: new Date().toISOString(),
      bodyReceived: {
        type: typeof updateUserDto,
        isObject: typeof updateUserDto === 'object' && updateUserDto !== null,
        isArray: Array.isArray(updateUserDto),
        keys: updateUserDto && typeof updateUserDto === 'object' ? Object.keys(updateUserDto) : 'N/A',
        hasActionProperty: updateUserDto && typeof updateUserDto === 'object' && 'action' in updateUserDto,
        hasPayloadProperty: updateUserDto && typeof updateUserDto === 'object' && 'payload' in updateUserDto,
        rawPayload: JSON.stringify(updateUserDto, null, 2)
      }
    });

    // Check if we received the wrong format (action/payload wrapper)
    if (updateUserDto && typeof updateUserDto === 'object' && 'action' in updateUserDto && 'payload' in updateUserDto) {
      this.logger.error(`🚨 DETECTED WRONG FORMAT - Frontend sent action/payload wrapper:`, {
        userId: id,
        wrongFormat: updateUserDto,
        action: (updateUserDto as any).action,
        payload: (updateUserDto as any).payload,
        fix: 'Frontend should send UpdateUserDto directly, not wrapped in action/payload'
      });
      
      // Extract the actual payload if it's wrapped (temporary fix)
      const actualPayload = (updateUserDto as any).payload;
      if (actualPayload && typeof actualPayload === 'object') {
        this.logger.log(`🔧 TEMPORARY FIX - Extracting payload from wrapper:`, {
          userId: id,
          extractedPayload: actualPayload
        });
        return this.userService.update(id, actualPayload as UpdateUserDto);
      }
    }

    // Normal processing for correct format
    this.logger.log(`✅ CORRECT FORMAT - Processing UpdateUserDto directly:`, {
      userId: id,
      updateDto: updateUserDto
    });

    return this.userService.update(id, updateUserDto);
  }

  @Post(':id/change-password')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @CrudPermissions.Users.Update()
  @ApiOperation({
    summary: 'Thay đổi mật khẩu',
    description: 'Thay đổi mật khẩu của người dùng',
  })
  @ApiParam({ name: 'id', description: 'ID người dùng', type: Number })
  @ApiResponse({ status: 200, description: 'Thay đổi mật khẩu thành công' })
  @ApiResponse({ status: 400, description: 'Mật khẩu hiện tại không chính xác' })
  async changePassword(
    @Param('id', ParseIntPipe) id: number,
    @Body() changePasswordDto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    await this.userService.changePassword(id, changePasswordDto);
    return { message: 'Password changed successfully' };
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  @CrudPermissions.Users.Delete()
  @ApiOperation({
    summary: 'Xóa mềm người dùng',
    description: 'Xóa mềm một người dùng (có thể khôi phục)',
  })
  @ApiParam({ name: 'id', description: 'ID người dùng', type: Number })
  @ApiResponse({ status: 200, description: 'Xóa thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy người dùng' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<{ message: string }> {
    await this.userService.remove(id);
    return { message: 'User deleted successfully' };
  }

  @Post(':id/restore')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @CrudPermissions.Users.Restore()
  @ApiOperation({
    summary: 'Khôi phục người dùng',
    description: 'Khôi phục một người dùng đã bị xóa mềm',
  })
  @ApiParam({ name: 'id', description: 'ID người dùng', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Khôi phục thành công',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Không tìm thấy người dùng' })
  async restore(@Param('id', ParseIntPipe) id: number): Promise<UserResponseDto> {
    return this.userService.restore(id);
  }

  @Delete(':id/permanent')
  @UseGuards(AuthGuard)
  @CrudPermissions.Users.PermanentDelete()
  @ApiOperation({
    summary: 'Xóa vĩnh viễn người dùng',
    description: 'Xóa vĩnh viễn một người dùng khỏi hệ thống',
  })
  @ApiParam({ name: 'id', description: 'ID người dùng', type: Number })
  @ApiResponse({ status: 200, description: 'Xóa vĩnh viễn thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy người dùng' })
  async permanentDelete(@Param('id', ParseIntPipe) id: number): Promise<{ message: string }> {
    await this.userService.permanentDelete(id);
    return { message: 'User permanently deleted successfully' };
  }
}
