import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  NotFoundException,
  UseGuards,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { PermissionService } from './permission.service';
import {
  CreatePermissionDto,
  UpdatePermissionDto,
  PermissionQueryDto,
  PermissionResponseDto,
  PermissionListResponseDto,
  PermissionStatsDto,
  PermissionGroupDto,
  BulkPermissionOperationDto,
  BulkDeleteResponseDto,
  BulkRestoreResponseDto,
} from './dto/permission.dto';
import { AuthGuard } from '../auth/auth.guard';
import { SuperAdminOnly } from '../common/decorators/permissions.decorator';

/**
 * Permission Controller - REST API Layer
 *
 * Controller này cung cấp REST API endpoints cho Permission management với:
 *
 * 🔍 READ APIs:
 * - GET /api/permissions → Danh sách permissions (phân trang)
 * - GET /api/permissions/stats → Thống kê permissions
 * - GET /api/permissions/options → Options cho MultiSelect (grouped)
 * - GET /api/permissions/:id → Chi tiết permission
 *
 * ✏️ WRITE OPERATIONS:
 * - POST /api/permissions → Tạo permission mới
 * - PATCH /api/permissions/:id → Cập nhật permission
 * - DELETE /api/permissions/:id → Soft delete permission
 * - POST /api/permissions/:id/restore → Khôi phục permission
 *
 * 🔄 BULK OPERATIONS:
 * - POST /api/permissions/bulk/delete → Bulk soft delete
 * - POST /api/permissions/bulk/restore → Bulk restore
 *
 * 🔐 SECURITY:
 * - JWT Authentication required
 * - Super Admin only access
 *
 * @version 1.0.0
 * @author PHGroup Development Team
 */
@ApiTags('Permissions')
@ApiBearerAuth()
@Controller('permissions')
@UseGuards(AuthGuard)
@SuperAdminOnly()
export class PermissionController {
  private readonly logger = new Logger(PermissionController.name);

  constructor(private readonly permissionService: PermissionService) {}

  // =============================================================================
  // BULK OPERATIONS - MUST BE BEFORE :id ROUTES
  // =============================================================================

  /**
   * POST /api/permissions/bulk/delete
   * Bulk soft delete permissions
   */
  @Post('bulk/delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Xóa hàng loạt permissions',
    description: 'Xóa mềm nhiều permissions cùng lúc',
  })
  @ApiResponse({
    status: 200,
    description: 'Bulk delete thành công',
    type: BulkDeleteResponseDto,
  })
  async bulkDelete(@Body() bulkDto: BulkPermissionOperationDto): Promise<BulkDeleteResponseDto> {
    this.logger.log(`POST /permissions/bulk/delete - IDs: ${bulkDto.permissionIds.join(', ')}`);
    return this.permissionService.bulkDelete(bulkDto.permissionIds);
  }

  /**
   * POST /api/permissions/bulk/restore
   * Bulk restore permissions
   */
  @Post('bulk/restore')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Khôi phục hàng loạt permissions',
    description: 'Khôi phục nhiều permissions đã xóa cùng lúc',
  })
  @ApiResponse({
    status: 200,
    description: 'Bulk restore thành công',
    type: BulkRestoreResponseDto,
  })
  async bulkRestore(@Body() bulkDto: BulkPermissionOperationDto): Promise<BulkRestoreResponseDto> {
    this.logger.log(`POST /permissions/bulk/restore - IDs: ${bulkDto.permissionIds.join(', ')}`);
    return this.permissionService.bulkRestore(bulkDto.permissionIds);
  }

  // =============================================================================
  // CRUD OPERATIONS
  // =============================================================================

  /**
   * POST /api/permissions
   * Tạo permission mới
   */
  @Post()
  @ApiOperation({
    summary: 'Tạo permission mới',
    description: 'Tạo một permission mới trong hệ thống',
  })
  @ApiResponse({
    status: 201,
    description: 'Permission được tạo thành công',
    type: PermissionResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Dữ liệu đầu vào không hợp lệ',
  })
  @ApiResponse({
    status: 409,
    description: 'Permission đã tồn tại',
  })
  async create(@Body() createPermissionDto: CreatePermissionDto): Promise<PermissionResponseDto> {
    this.logger.log(`POST /permissions - Creating: ${createPermissionDto.name}`);
    return this.permissionService.create(createPermissionDto);
  }

  /**
   * GET /api/permissions
   * Lấy danh sách permissions
   */
  @Get()
  @ApiOperation({
    summary: 'Lấy danh sách permissions',
    description: 'Lấy danh sách permissions với phân trang và lọc',
  })
  @ApiResponse({
    status: 200,
    description: 'Danh sách permissions',
    type: PermissionListResponseDto,
  })
  async findAll(@Query() query: PermissionQueryDto): Promise<PermissionListResponseDto> {
    this.logger.log(`GET /permissions - Query: ${JSON.stringify(query)}`);
    return this.permissionService.findAll(query);
  }

  /**
   * GET /api/permissions/stats
   * Lấy thống kê permissions
   */
  @Get('stats')
  @ApiOperation({
    summary: 'Thống kê permissions',
    description: 'Lấy thống kê tổng quan về permissions',
  })
  @ApiResponse({
    status: 200,
    description: 'Thống kê permissions',
    type: PermissionStatsDto,
  })
  async getStats(): Promise<PermissionStatsDto> {
    this.logger.log('GET /permissions/stats');
    return this.permissionService.getStats();
  }

  /**
   * GET /api/permissions/options
   * Lấy options cho MultiSelect (grouped)
   */
  @Get('options')
  @ApiOperation({
    summary: 'Lấy options permissions',
    description: 'Lấy danh sách permissions dạng grouped options cho MultiSelect',
  })
  @ApiResponse({
    status: 200,
    description: 'Grouped permission options',
    type: [PermissionGroupDto],
  })
  async getOptions(): Promise<PermissionGroupDto[]> {
    this.logger.log('GET /permissions/options');
    return this.permissionService.getOptions();
  }

  /**
   * GET /api/permissions/:id
   * Lấy chi tiết permission
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Lấy chi tiết permission',
    description: 'Lấy thông tin chi tiết của một permission theo ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Chi tiết permission',
    type: PermissionResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Permission không tồn tại',
  })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<PermissionResponseDto> {
    this.logger.log(`GET /permissions/${id}`);
    const permission = await this.permissionService.findById(id);
    if (!permission) {
      throw new NotFoundException(`Permission với ID ${id} không tồn tại`);
    }
    return permission;
  }

  /**
   * PATCH /api/permissions/:id
   * Cập nhật permission
   */
  @Patch(':id')
  @ApiOperation({
    summary: 'Cập nhật permission',
    description: 'Cập nhật thông tin của một permission',
  })
  @ApiResponse({
    status: 200,
    description: 'Permission được cập nhật thành công',
    type: PermissionResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Permission không tồn tại',
  })
  @ApiResponse({
    status: 409,
    description: 'Tên permission đã được sử dụng',
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePermissionDto: UpdatePermissionDto,
  ): Promise<PermissionResponseDto> {
    this.logger.log(`PATCH /permissions/${id}`);
    return this.permissionService.update(id, updatePermissionDto);
  }

  /**
   * DELETE /api/permissions/:id
   * Xóa mềm permission
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Xóa permission',
    description: 'Xóa mềm một permission (có thể khôi phục)',
  })
  @ApiResponse({
    status: 204,
    description: 'Permission đã được xóa',
  })
  @ApiResponse({
    status: 404,
    description: 'Permission không tồn tại',
  })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    this.logger.log(`DELETE /permissions/${id}`);
    await this.permissionService.delete(id);
  }

  /**
   * POST /api/permissions/:id/restore
   * Khôi phục permission đã xóa
   */
  @Post(':id/restore')
  @ApiOperation({
    summary: 'Khôi phục permission',
    description: 'Khôi phục một permission đã bị xóa mềm',
  })
  @ApiResponse({
    status: 200,
    description: 'Permission đã được khôi phục',
    type: PermissionResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Permission đã xóa không tồn tại',
  })
  async restore(@Param('id', ParseIntPipe) id: number): Promise<PermissionResponseDto> {
    this.logger.log(`POST /permissions/${id}/restore`);
    return this.permissionService.restore(id);
  }
}
