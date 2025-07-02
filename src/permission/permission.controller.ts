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
import { PermissionService } from './permission.service'
import {
	CreatePermissionDto,
	UpdatePermissionDto,
	PermissionQueryDto,
	BulkPermissionOperationDto,
	BulkDeleteResponseDto,
	BulkRestoreResponseDto,
	BulkPermanentDeleteResponseDto,
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
	@CrudPermissions.Roles.Read()
	async findAll(@Query() query: PermissionQueryDto) {
		return this.permissionService.findAll({ ...query, deleted: false })
	}

	@Get('deleted')
	@CrudPermissions.Roles.Read()
	async findDeleted(@Query() query: PermissionQueryDto) {
		return this.permissionService.findAll({ ...query, deleted: true })
	}

	@Get('stats')
	@CrudPermissions.Roles.Read()
	async getPermissionStats(@Query('deleted') deleted: string) {
		const isDeleted = deleted === 'true'
		return this.permissionService.getPermissionStats(isDeleted)
	}

	@Get('options')
	@Public()
	async getPermissionOptions() {
		return this.permissionService.getPermissionOptions()
	}

	/**
	 * POST /api/permissions/bulk/delete
	 * Bulk soft delete permissions
	 */
	@Post('bulk/delete')
	@HttpCode(HttpStatus.OK)
	@CrudPermissions.Roles.FullAccess()
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
	@CrudPermissions.Roles.FullAccess()
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
	@CrudPermissions.Roles.FullAccess()
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
	@CrudPermissions.Roles.Read()
	async findOne(@Param('id', ParseIntPipe) id: number) {
		return this.permissionService.findById(id)
	}

	@Post()
	@HttpCode(HttpStatus.CREATED)
	@CrudPermissions.Roles.Create()
	async create(@Body() createPermissionDto: CreatePermissionDto) {
		return this.permissionService.create(createPermissionDto)
	}

	@Patch(':id')
	@CrudPermissions.Roles.Update()
	async update(
		@Param('id', ParseIntPipe) id: number,
		@Body() updatePermissionDto: UpdatePermissionDto,
	) {
		return this.permissionService.update(id, updatePermissionDto)
	}

	@Delete(':id')
	@HttpCode(HttpStatus.NO_CONTENT)
	@CrudPermissions.Roles.Delete()
	async remove(@Param('id', ParseIntPipe) id: number) {
		await this.permissionService.delete(id)
	}

	@Post(':id/restore')
	@HttpCode(HttpStatus.OK)
	@CrudPermissions.Roles.Restore()
	async restore(@Param('id', ParseIntPipe) id: number) {
		return this.permissionService.restore(id)
	}

	@Delete(':id/permanent')
	@HttpCode(HttpStatus.NO_CONTENT)
	@CrudPermissions.Roles.FullAccess()
	async permanentDelete(@Param('id', ParseIntPipe) id: number) {
		await this.permissionService.permanentDelete(id)
	}
}
