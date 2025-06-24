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
import { RoleService } from './role.service'
import {
	CreateRoleDto,
	UpdateRoleDto,
	RoleQueryDto,
	BulkRoleOperationDto,
} from './dto/role.dto'
import { AuthGuard } from '../auth/auth.guard'
import {
	CrudPermissions,
	Public,
} from '../common/decorators/permissions.decorator'

@Controller('api/roles')
@UseGuards(AuthGuard)
export class RoleController {
	constructor(private readonly roleService: RoleService) {}

	@Get()
	@CrudPermissions.Roles.Read()
	async findAll(@Query() query: RoleQueryDto) {
		return this.roleService.findAll(query)
	}

	@Get('stats')
	@CrudPermissions.Roles.Read()
	async getRoleStats(@Query('deleted') deleted: boolean) {
		return this.roleService.getRoleStats(deleted)
	}

	@Get('options')
	@Public()
	async getRoleOptions() {
		return this.roleService.getRoleOptions()
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

	@Post('bulk/delete')
	@HttpCode(HttpStatus.OK)
	@CrudPermissions.Roles.FullAccess()
	async bulkDelete(@Body() bulkDto: BulkRoleOperationDto) {
		return this.roleService.bulkDelete(bulkDto.roleIds)
	}

	@Post('bulk/restore')
	@HttpCode(HttpStatus.OK)
	@CrudPermissions.Roles.FullAccess()
	async bulkRestore(@Body() bulkDto: BulkRoleOperationDto) {
		return this.roleService.bulkRestore(bulkDto.roleIds)
	}

	@Post('bulk/permanent-delete')
	@HttpCode(HttpStatus.OK)
	@CrudPermissions.Roles.FullAccess()
	async bulkPermanentDelete(@Body() bulkDto: BulkRoleOperationDto) {
		return this.roleService.bulkPermanentDelete(bulkDto.roleIds)
	}
}
