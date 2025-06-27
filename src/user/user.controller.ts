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
	Put,
	UsePipes,
	ValidationPipe,
	NotFoundException,
} from '@nestjs/common'
import { UserService } from './user.service'
import {
	CreateUserDto,
	UpdateUserDto,
	UserQueryDto,
	BulkUserOperationDto,
} from './dto/user.dto'
import { CrudPermissions } from '../common/decorators/permissions.decorator'
import { SanitizationPipe } from '../common/pipes/sanitization.pipe'

@Controller('api/users')
@UsePipes(
	new SanitizationPipe(),
	new ValidationPipe({
		transform: true,
		whitelist: true,
		forbidNonWhitelisted: true,
		transformOptions: {
			enableImplicitConversion: true,
		},
	})
)
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

	@Get('deleted')
	@CrudPermissions.Users.Read()
	async findDeleted(@Query() query: UserQueryDto) {
		return this.userService.findDeleted(query)
	}

	@Get('stats')
	@CrudPermissions.Users.Read()
	async getUserStats(@Query('deleted') deleted: string) {
		return this.userService.getUserStats(deleted === 'true')
	}

	@Get('email/:email')
	@CrudPermissions.Users.Read()
	async findByEmail(@Param('email') email: string) {
		const user = await this.userService.findByEmail(email)
		if (!user) {
			throw new NotFoundException('User not found')
		}
		return user
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

	@Put(':id')
	@CrudPermissions.Users.Update()
	async putUpdate(
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
		console.log('🔄 Individual restore controller - id:', id, 'type:', typeof id)
		return this.userService.restore(id)
	}

	@Delete(':id/permanent')
	@HttpCode(HttpStatus.NO_CONTENT)
	@CrudPermissions.Users.FullAccess()
	async permanentDelete(@Param('id', ParseIntPipe) id: number) {
		await this.userService.permanentDelete(id)
	}

	// ====== BULK OPERATIONS ======

	@Post('bulk/restore')
	@HttpCode(HttpStatus.OK)
	@CrudPermissions.Users.FullAccess()
	async bulkRestore(@Body() body: BulkUserOperationDto) {
		return this.userService.bulkRestore(body.userIds)
	}

	@Post('bulk/restore-users')
	@HttpCode(HttpStatus.OK)
	@CrudPermissions.Users.FullAccess()
	async bulkRestoreUsers(@Body() body: BulkUserOperationDto) {
		console.log('🔄 Bulk restore controller - raw body:', JSON.stringify(body, null, 2))
		console.log('🔄 Bulk restore controller - userIds:', body.userIds)
		console.log('🔄 Bulk restore controller - userIds type:', typeof body.userIds)
		console.log('🔄 Bulk restore controller - userIds[0] type:', typeof body.userIds?.[0])
		return this.userService.bulkRestore(body.userIds)
	}

	@Post('bulk/delete')
	@HttpCode(HttpStatus.OK)
	@CrudPermissions.Users.FullAccess()
	async bulkDelete(@Body() body: BulkUserOperationDto) {
		return this.userService.bulkDelete(body.userIds)
	}

	@Post('bulk/permanent-delete')
	@HttpCode(HttpStatus.OK)
	@CrudPermissions.Users.FullAccess()
	async bulkPermanentDelete(@Body() body: BulkUserOperationDto) {
		return this.userService.bulkPermanentDelete(body.userIds)
	}


}
