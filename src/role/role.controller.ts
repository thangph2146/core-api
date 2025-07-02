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
} from '@nestjs/common'
import {
	ApiTags,
	ApiOperation,
	ApiResponse,
	ApiBearerAuth,
} from '@nestjs/swagger'
import { RoleService } from './role.service'
import {
	CreateRoleDto,
	UpdateRoleDto,
	RoleQueryDto,
	BulkRoleOperationDto,
	BulkDeleteResponseDto,
	BulkRestoreResponseDto,
	BulkPermanentDeleteResponseDto,
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
	async findAll(@Query() query: RoleQueryDto) {
		return this.roleService.findAll({ ...query, deleted: false })
	}

	@Get('deleted')
	@CrudPermissions.Roles.Read()
	async findDeleted(@Query() query: RoleQueryDto) {
		return this.roleService.findAll({ ...query, deleted: true })
	}

	@Get('stats')
	@CrudPermissions.Roles.Read()
	async getRoleStats(@Query('deleted') deleted: string) {
		const isDeleted = deleted === 'true'
		return this.roleService.getRoleStats(isDeleted)
	}

	@Get('options')
	@Public()
	async getRoleOptions() {
		return this.roleService.getRoleOptions()
	}

	/**
	 * POST /api/roles/bulk/delete
	 * Bulk soft delete roles
	 */
	@Post('bulk/delete')
	@HttpCode(HttpStatus.OK)
	@CrudPermissions.Roles.FullAccess()
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
	@CrudPermissions.Roles.FullAccess()
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
	@CrudPermissions.Roles.FullAccess()
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
	async findOne(@Param('id', ParseIntPipe) id: number) {
		return this.roleService.findWithPermissions(id)
	}

	@Post()
	@HttpCode(HttpStatus.CREATED)
	@CrudPermissions.Roles.Create()
	async create(@Body() createRoleDto: CreateRoleDto) {
		return this.roleService.create(createRoleDto)
	}

	@Patch(':id')
	@CrudPermissions.Roles.Update()
	async update(
		@Param('id', ParseIntPipe) id: number,
		@Body() updateRoleDto: UpdateRoleDto,
	) {
		return this.roleService.update(id, updateRoleDto)
	}

	@Delete(':id')
	@HttpCode(HttpStatus.NO_CONTENT)
	@CrudPermissions.Roles.Delete()
	async remove(@Param('id', ParseIntPipe) id: number) {
		await this.roleService.delete(id)
	}

	@Post(':id/restore')
	@HttpCode(HttpStatus.OK)
	@CrudPermissions.Roles.Restore()
	async restore(@Param('id', ParseIntPipe) id: number) {
		return this.roleService.restore(id)
	}

	@Delete(':id/permanent')
	@HttpCode(HttpStatus.NO_CONTENT)
	@CrudPermissions.Roles.FullAccess()
	async permanentDelete(@Param('id', ParseIntPipe) id: number) {
		await this.roleService.permanentDelete(id)
	}
}
