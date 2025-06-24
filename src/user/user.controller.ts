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
	HttpStatus,
	HttpCode,
} from '@nestjs/common'
import { UserService } from './user.service'
import {
	CreateUserDto,
	UpdateUserDto,
	UserQueryDto,
	BulkUserOperationDto,
} from './dto/user.dto'
import { CrudPermissions } from '../common/decorators/permissions.decorator'

@Controller('api/users')
export class UserController {
	constructor(private readonly userService: UserService) {}

	@Post()
	@HttpCode(HttpStatus.CREATED)
	@CrudPermissions.Users.Create()
	async create(@Body() createUserDto: CreateUserDto) {
		return this.userService.create(createUserDto)
	}

	@Get()
	@CrudPermissions.Users.Read()
	async findAll(@Query() query: UserQueryDto) {
		return this.userService.findAll(query)
	}

	@Get('stats')
	@CrudPermissions.Users.Read()
	async getUserStats(@Query('deleted') deleted: string) {
		return this.userService.getUserStats(deleted === 'true')
	}

	@Get('email/:email')
	@CrudPermissions.Users.Read()
	async findByEmail(@Param('email') email: string) {
		return this.userService.findByEmail(email)
	}

	@Get(':id')
	@CrudPermissions.Users.Read()
	async findOne(@Param('id', ParseIntPipe) id: number) {
		return this.userService.findOne(id)
	}

	@Patch(':id')
	@CrudPermissions.Users.Update()
	async update(
		@Param('id', ParseIntPipe) id: number,
		@Body() updateUserDto: UpdateUserDto,
	) {
		return this.userService.update(id, updateUserDto)
	}

	@Delete(':id')
	@HttpCode(HttpStatus.NO_CONTENT)
	@CrudPermissions.Users.Delete()
	async remove(@Param('id', ParseIntPipe) id: number) {
		await this.userService.remove(id)
	}

	@Post(':id/restore')
	@CrudPermissions.Users.Restore()
	async restore(@Param('id', ParseIntPipe) id: number) {
		return this.userService.restore(id)
	}

	@Delete(':id/permanent')
	@HttpCode(HttpStatus.NO_CONTENT)
	@CrudPermissions.Users.FullAccess()
	async permanentDelete(@Param('id', ParseIntPipe) id: number) {
		await this.userService.permanentDelete(id)
	}

	// ====== BULK OPERATIONS ======

	@Post('bulk/delete')
	@HttpCode(HttpStatus.OK)
	@CrudPermissions.Users.FullAccess()
	async bulkDelete(@Body() body: BulkUserOperationDto) {
		return this.userService.bulkDelete(body.userIds)
	}

	@Post('bulk/restore')
	@HttpCode(HttpStatus.OK)
	@CrudPermissions.Users.FullAccess()
	async bulkRestore(@Body() body: BulkUserOperationDto) {
		return this.userService.bulkRestore(body.userIds)
	}

	@Post('bulk/permanent-delete')
	@HttpCode(HttpStatus.OK)
	@CrudPermissions.Users.FullAccess()
	async bulkPermanentDelete(@Body() body: BulkUserOperationDto) {
		return this.userService.bulkPermanentDelete(body.userIds)
	}
}
