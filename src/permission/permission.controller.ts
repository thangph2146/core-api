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
	UseGuards,
	NotFoundException,
} from '@nestjs/common'
import {
	ApiTags,
	ApiOperation,
	ApiResponse,
	ApiBearerAuth,
	ApiParam,
	ApiQuery,
} from '@nestjs/swagger'
import { PermissionService } from './permission.service'
import {
	CreatePermissionDto,
	UpdatePermissionDto,
	AdminPermissionQueryDto,
	PermissionQueryDto,
	BulkPermissionOperationDto,
	BulkDeleteResponseDto,
	BulkRestoreResponseDto,
	BulkPermanentDeleteResponseDto,
	PermissionListResponseDto,
	PermissionResponseDto,
	PermissionStatsDto,
	PermissionGroupDto,
} from './dto/permission.dto'
import { AuthGuard } from '../auth/auth.guard'
import {
	CrudPermissions,
	Public,
} from '../common/decorators/permissions.decorator'

@ApiTags('Permissions')
@ApiBearerAuth()
@Controller('permissions')
@UseGuards(AuthGuard)
export class PermissionController {
	constructor(private readonly permissionService: PermissionService) {}

	@Get()
	@CrudPermissions.Permissions.Read()
	@ApiOperation({ summary: 'Lấy danh sách permissions', description: 'Lấy danh sách permissions với phân trang và tìm kiếm' })
	@ApiResponse({ status: 200, description: 'Danh sách permissions', type: PermissionListResponseDto })
	async findAll(@Query() query: AdminPermissionQueryDto): Promise<PermissionListResponseDto> {
		return this.permissionService.findAll({ ...query, deleted: false })
	}

	@Get('deleted')
	@CrudPermissions.Permissions.Read()
	@ApiOperation({ summary: 'Lấy danh sách permissions đã xóa', description: 'Lấy danh sách permissions đã bị xóa mềm' })
	@ApiResponse({ status: 200, description: 'Danh sách permissions đã xóa', type: PermissionListResponseDto })
	async findDeleted(@Query() query: AdminPermissionQueryDto): Promise<PermissionListResponseDto> {
		return this.permissionService.findAll({ ...query, deleted: true })
	}

	@Get('stats')
	@CrudPermissions.Permissions.Read()
	@ApiOperation({ summary: 'Thống kê permissions', description: 'Lấy thống kê tổng quan về permissions' })
	@ApiResponse({ status: 200, description: 'Thống kê permissions', type: PermissionStatsDto })
	async getPermissionStats(@Query('deleted') deleted: string): Promise<PermissionStatsDto> {
		const isDeleted = deleted === 'true'
		return this.permissionService.getPermissionStats(isDeleted)
	}

	@Get('options')
	@Public()
	@ApiOperation({ summary: 'Lấy options permissions', description: 'Lấy danh sách permissions dạng options cho dropdown' })
	@ApiResponse({ status: 200, description: 'Options permissions', type: [PermissionGroupDto] })
	async getPermissionOptions(): Promise<PermissionGroupDto[]> {
		return this.permissionService.getPermissionOptions()
	}

	/**
	 * POST /api/permissions/bulk/delete
	 * Bulk soft delete permissions
	 */
	@Post('bulk/delete')
	@HttpCode(HttpStatus.OK)
	@CrudPermissions.Permissions.BulkDelete()
	@ApiOperation({
		summary: 'Xóa mềm nhiều permissions',
		description: 'Xóa mềm nhiều permissions dựa trên danh sách ID',
	})
	@ApiResponse({
		status: 200,
		description: 'Thao tác xóa mềm hàng loạt hoàn tất',
		type: BulkDeleteResponseDto,
	})
	async bulkDelete(@Body() bulkDto: BulkPermissionOperationDto): Promise<BulkDeleteResponseDto> {
		return this.permissionService.bulkDelete(bulkDto.permissionIds)
	}

	/**
	 * POST /api/permissions/bulk/restore
	 * Bulk restore permissions
	 */
	@Post('bulk/restore')
	@HttpCode(HttpStatus.OK)
	@CrudPermissions.Permissions.BulkRestore()
	@ApiOperation({
		summary: 'Khôi phục nhiều permissions',
		description: 'Khôi phục nhiều permissions đã bị xóa mềm',
	})
	@ApiResponse({
		status: 200,
		description: 'Thao tác khôi phục hàng loạt hoàn tất',
		type: BulkRestoreResponseDto,
	})
	async bulkRestore(@Body() bulkDto: BulkPermissionOperationDto): Promise<BulkRestoreResponseDto> {
		return this.permissionService.bulkRestore(bulkDto.permissionIds)
	}

	/**
	 * POST /api/permissions/bulk/permanent-delete
	 * Bulk permanent delete permissions
	 */
	@Post('bulk/permanent-delete')
	@HttpCode(HttpStatus.OK)
	@CrudPermissions.Permissions.BulkPermanentDelete()
	@ApiOperation({
		summary: 'Xóa vĩnh viễn nhiều permissions',
		description: 'Xóa vĩnh viễn nhiều permissions và tất cả dữ liệu liên quan',
	})
	@ApiResponse({
		status: 200,
		description: 'Thao tác xóa vĩnh viễn hàng loạt hoàn tất',
		type: BulkPermanentDeleteResponseDto,
	})
	async bulkPermanentDelete(@Body() bulkDto: BulkPermissionOperationDto): Promise<BulkPermanentDeleteResponseDto> {
		return this.permissionService.bulkPermanentDelete(bulkDto.permissionIds)
	}

	@Get(':id')
	@CrudPermissions.Permissions.Read()
	@ApiOperation({ summary: 'Lấy chi tiết permission', description: 'Lấy thông tin chi tiết của một permission' })
	@ApiParam({ name: 'id', description: 'ID của permission', type: Number })
	@ApiResponse({ status: 200, description: 'Chi tiết permission', type: PermissionResponseDto })
	@ApiResponse({ status: 404, description: 'Không tìm thấy permission' })
	async findOne(@Param('id', ParseIntPipe) id: number): Promise<{ data: PermissionResponseDto }> {
		const permission = await this.permissionService.findById(id)
		if (!permission) {
			throw new NotFoundException(`Permission với ID ${id} không tồn tại`)
		}
		return { data: permission }
	}

	@Post()
	@HttpCode(HttpStatus.CREATED)
	@CrudPermissions.Permissions.Create()
	@ApiOperation({ summary: 'Tạo permission mới', description: 'Tạo một permission mới trong hệ thống' })
	@ApiResponse({ status: 201, description: 'Permission được tạo thành công', type: PermissionResponseDto })
	@ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
	@ApiResponse({ status: 409, description: 'Permission đã tồn tại' })
	async create(@Body() createPermissionDto: CreatePermissionDto): Promise<{ data: PermissionResponseDto; message: string }> {
		const permission = await this.permissionService.create(createPermissionDto)
		return {
			data: permission,
			message: 'Permission đã được tạo thành công',
		}
	}

	@Patch(':id')
	@CrudPermissions.Permissions.Update()
	@ApiOperation({ summary: 'Cập nhật permission', description: 'Cập nhật thông tin của một permission' })
	@ApiParam({ name: 'id', description: 'ID của permission', type: Number })
	@ApiResponse({ status: 200, description: 'Permission được cập nhật thành công', type: PermissionResponseDto })
	@ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
	@ApiResponse({ status: 404, description: 'Không tìm thấy permission' })
	@ApiResponse({ status: 409, description: 'Permission đã tồn tại' })
	async update(
		@Param('id', ParseIntPipe) id: number,
		@Body() updatePermissionDto: UpdatePermissionDto,
	): Promise<{ data: PermissionResponseDto; message: string }> {
		const permission = await this.permissionService.update(id, updatePermissionDto)
		return {
			data: permission,
			message: 'Permission đã được cập nhật thành công',
		}
	}

	@Delete(':id')
	@HttpCode(HttpStatus.OK)
	@CrudPermissions.Permissions.Delete()
	@ApiOperation({ summary: 'Xóa mềm permission', description: 'Xóa mềm một permission (có thể khôi phục)' })
	@ApiParam({ name: 'id', description: 'ID của permission', type: Number })
	@ApiResponse({ status: 200, description: 'Permission đã được xóa mềm thành công' })
	@ApiResponse({ status: 404, description: 'Không tìm thấy permission' })
	async remove(@Param('id', ParseIntPipe) id: number): Promise<{ message: string }> {
		await this.permissionService.delete(id)
		return { message: 'Permission đã được xóa thành công' }
	}

	@Post(':id/restore')
	@HttpCode(HttpStatus.OK)
	@CrudPermissions.Permissions.Restore()
	@ApiOperation({ summary: 'Khôi phục permission', description: 'Khôi phục một permission đã bị xóa mềm' })
	@ApiParam({ name: 'id', description: 'ID của permission', type: Number })
	@ApiResponse({ status: 200, description: 'Permission được khôi phục thành công', type: PermissionResponseDto })
	@ApiResponse({ status: 404, description: 'Không tìm thấy permission' })
	async restore(@Param('id', ParseIntPipe) id: number): Promise<{ data: PermissionResponseDto; message: string }> {
		const permission = await this.permissionService.restore(id)
		return {
			data: permission,
			message: 'Permission đã được khôi phục thành công',
		}
	}

	@Delete(':id/permanent')
	@HttpCode(HttpStatus.OK)
	@CrudPermissions.Permissions.PermanentDelete()
	@ApiOperation({ summary: 'Xóa vĩnh viễn permission', description: 'Xóa vĩnh viễn một permission và tất cả dữ liệu liên quan' })
	@ApiParam({ name: 'id', description: 'ID của permission', type: Number })
	@ApiResponse({ status: 200, description: 'Permission đã được xóa vĩnh viễn thành công' })
	@ApiResponse({ status: 404, description: 'Không tìm thấy permission' })
	async permanentDelete(@Param('id', ParseIntPipe) id: number): Promise<{ message: string }> {
		await this.permissionService.permanentDelete(id)
		return { message: 'Permission đã được xóa vĩnh viễn thành công' }
	}
}
