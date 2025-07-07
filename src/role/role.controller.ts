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
import { RoleService } from './role.service'
import {
	CreateRoleDto,
	UpdateRoleDto,
	AdminRoleQueryDto,
	RoleQueryDto,
	BulkRoleOperationDto,
	BulkDeleteResponseDto,
	BulkRestoreResponseDto,
	BulkPermanentDeleteResponseDto,
	RoleListResponseDto,
	RoleResponseDto,
	RoleStatsDto,
	RoleOptionDto,
} from './dto/role.dto'
import { AuthGuard } from '../auth/auth.guard'
import {
	CrudPermissions,
	Public,
} from '../common/decorators/permissions.decorator'

@ApiTags('Roles')
@ApiBearerAuth()
@Controller('roles')
@UseGuards(AuthGuard)
export class RoleController {
	constructor(private readonly roleService: RoleService) {}

	@Get()
	@CrudPermissions.Roles.Read()
	@ApiOperation({ summary: 'Lấy danh sách vai trò', description: 'Lấy danh sách vai trò với phân trang và tìm kiếm' })
	@ApiResponse({ status: 200, description: 'Danh sách vai trò', type: RoleListResponseDto })
	async findAll(@Query() query: AdminRoleQueryDto): Promise<RoleListResponseDto> {
		return this.roleService.findAll({ ...query, deleted: false })
	}

	@Get('deleted')
	@CrudPermissions.Roles.Read()
	@ApiOperation({ summary: 'Lấy danh sách vai trò đã xóa', description: 'Lấy danh sách vai trò đã bị xóa mềm' })
	@ApiResponse({ status: 200, description: 'Danh sách vai trò đã xóa', type: RoleListResponseDto })
	async findDeleted(@Query() query: AdminRoleQueryDto): Promise<RoleListResponseDto> {
		return this.roleService.findAll({ ...query, deleted: true })
	}

	@Get('stats')
	@CrudPermissions.Roles.Read()
	@ApiOperation({ summary: 'Thống kê vai trò', description: 'Lấy thống kê tổng quan về vai trò' })
	@ApiResponse({ status: 200, description: 'Thống kê vai trò', type: RoleStatsDto })
	async getRoleStats(@Query('deleted') deleted: string): Promise<RoleStatsDto> {
		const isDeleted = deleted === 'true'
		return this.roleService.getRoleStats(isDeleted)
	}

	@Get('options')
	@Public()
	@ApiOperation({ summary: 'Lấy options vai trò', description: 'Lấy danh sách vai trò dạng options cho dropdown' })
	@ApiResponse({ status: 200, description: 'Options vai trò', type: [RoleOptionDto] })
	async getRoleOptions(): Promise<RoleOptionDto[]> {
		return this.roleService.getRoleOptions()
	}

	/**
	 * POST /api/roles/bulk/delete
	 * Bulk soft delete roles
	 */
	@Post('bulk/delete')
	@HttpCode(HttpStatus.OK)
	@CrudPermissions.Roles.BulkDelete()
	@ApiOperation({
		summary: 'Xóa mềm nhiều vai trò',
		description: 'Xóa mềm nhiều vai trò dựa trên danh sách ID',
	})
	@ApiResponse({
		status: 200,
		description: 'Thao tác xóa mềm hàng loạt hoàn tất',
		type: BulkDeleteResponseDto,
	})
	async bulkDelete(@Body() bulkDto: BulkRoleOperationDto): Promise<BulkDeleteResponseDto> {
		return this.roleService.bulkDelete(bulkDto.roleIds)
	}

	/**
	 * POST /api/roles/bulk/restore
	 * Bulk restore roles
	 */
	@Post('bulk/restore')
	@HttpCode(HttpStatus.OK)
	@CrudPermissions.Roles.BulkRestore()
	@ApiOperation({
		summary: 'Khôi phục nhiều vai trò',
		description: 'Khôi phục nhiều vai trò đã bị xóa mềm',
	})
	@ApiResponse({
		status: 200,
		description: 'Thao tác khôi phục hàng loạt hoàn tất',
		type: BulkRestoreResponseDto,
	})
	async bulkRestore(@Body() bulkDto: BulkRoleOperationDto): Promise<BulkRestoreResponseDto> {
		return this.roleService.bulkRestore(bulkDto.roleIds)
	}

	/**
	 * POST /api/roles/bulk/permanent-delete
	 * Bulk permanent delete roles
	 */
	@Post('bulk/permanent-delete')
	@HttpCode(HttpStatus.OK)
	@CrudPermissions.Roles.BulkPermanentDelete()
	@ApiOperation({
		summary: 'Xóa vĩnh viễn nhiều vai trò',
		description: 'Xóa vĩnh viễn nhiều vai trò và tất cả dữ liệu liên quan',
	})
	@ApiResponse({
		status: 200,
		description: 'Thao tác xóa vĩnh viễn hàng loạt hoàn tất',
		type: BulkPermanentDeleteResponseDto,
	})
	async bulkPermanentDelete(@Body() bulkDto: BulkRoleOperationDto): Promise<BulkPermanentDeleteResponseDto> {
		return this.roleService.bulkPermanentDelete(bulkDto.roleIds)
	}

	@Get(':id')
	@CrudPermissions.Roles.Read()
	@ApiOperation({ summary: 'Lấy chi tiết vai trò', description: 'Lấy thông tin chi tiết của một vai trò' })
	@ApiParam({ name: 'id', description: 'ID của vai trò', type: Number })
	@ApiResponse({ status: 200, description: 'Chi tiết vai trò', type: RoleResponseDto })
	@ApiResponse({ status: 404, description: 'Không tìm thấy vai trò' })
	async findOne(@Param('id', ParseIntPipe) id: number): Promise<{ data: RoleResponseDto }> {
		const role = await this.roleService.findWithPermissions(id)
		if (!role) {
			throw new NotFoundException(`Vai trò với ID ${id} không tồn tại`)
		}
		return { data: role }
	}

	@Post()
	@HttpCode(HttpStatus.CREATED)
	@CrudPermissions.Roles.Create()
	@ApiOperation({ summary: 'Tạo vai trò mới', description: 'Tạo một vai trò mới trong hệ thống' })
	@ApiResponse({ status: 201, description: 'Vai trò được tạo thành công', type: RoleResponseDto })
	@ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
	@ApiResponse({ status: 409, description: 'Vai trò đã tồn tại' })
	async create(@Body() createRoleDto: CreateRoleDto): Promise<{ data: RoleResponseDto; message: string }> {
		const role = await this.roleService.create(createRoleDto)
		return {
			data: role,
			message: 'Vai trò đã được tạo thành công',
		}
	}

	@Patch(':id')
	@CrudPermissions.Roles.Update()
	@ApiOperation({ summary: 'Cập nhật vai trò', description: 'Cập nhật thông tin của một vai trò' })
	@ApiParam({ name: 'id', description: 'ID của vai trò', type: Number })
	@ApiResponse({ status: 200, description: 'Vai trò được cập nhật thành công', type: RoleResponseDto })
	@ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
	@ApiResponse({ status: 404, description: 'Không tìm thấy vai trò' })
	@ApiResponse({ status: 409, description: 'Vai trò đã tồn tại' })
	async update(
		@Param('id', ParseIntPipe) id: number,
		@Body() updateRoleDto: UpdateRoleDto,
	): Promise<{ data: RoleResponseDto; message: string }> {
		const role = await this.roleService.update(id, updateRoleDto)
		return {
			data: role,
			message: 'Vai trò đã được cập nhật thành công',
		}
	}

	@Delete(':id')
	@HttpCode(HttpStatus.OK)
	@CrudPermissions.Roles.Delete()
	@ApiOperation({ summary: 'Xóa mềm vai trò', description: 'Xóa mềm một vai trò (có thể khôi phục)' })
	@ApiParam({ name: 'id', description: 'ID của vai trò', type: Number })
	@ApiResponse({ status: 200, description: 'Vai trò đã được xóa mềm thành công' })
	@ApiResponse({ status: 404, description: 'Không tìm thấy vai trò' })
	async remove(@Param('id', ParseIntPipe) id: number): Promise<{ message: string }> {
		await this.roleService.delete(id)
		return { message: 'Vai trò đã được xóa thành công' }
	}

	@Post(':id/restore')
	@HttpCode(HttpStatus.OK)
	@CrudPermissions.Roles.Restore()
	@ApiOperation({ summary: 'Khôi phục vai trò', description: 'Khôi phục một vai trò đã bị xóa mềm' })
	@ApiParam({ name: 'id', description: 'ID của vai trò', type: Number })
	@ApiResponse({ status: 200, description: 'Vai trò được khôi phục thành công', type: RoleResponseDto })
	@ApiResponse({ status: 404, description: 'Không tìm thấy vai trò' })
	async restore(@Param('id', ParseIntPipe) id: number): Promise<{ data: RoleResponseDto; message: string }> {
		const role = await this.roleService.restore(id)
		return {
			data: role,
			message: 'Vai trò đã được khôi phục thành công',
		}
	}

	@Delete(':id/permanent')
	@HttpCode(HttpStatus.OK)
	@CrudPermissions.Roles.PermanentDelete()
	@ApiOperation({ summary: 'Xóa vĩnh viễn vai trò', description: 'Xóa vĩnh viễn một vai trò và tất cả dữ liệu liên quan' })
	@ApiParam({ name: 'id', description: 'ID của vai trò', type: Number })
	@ApiResponse({ status: 200, description: 'Vai trò đã được xóa vĩnh viễn thành công' })
	@ApiResponse({ status: 404, description: 'Không tìm thấy vai trò' })
	async permanentDelete(@Param('id', ParseIntPipe) id: number): Promise<{ message: string }> {
		await this.roleService.permanentDelete(id)
		return { message: 'Vai trò đã được xóa vĩnh viễn thành công' }
	}
}
