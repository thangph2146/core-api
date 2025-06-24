import {
	Controller,
	Get,
	Post,
	Patch,
	Delete,
	Param,
	Query,
	Body,
	ParseIntPipe,
	UseGuards,
	HttpCode,
	HttpStatus,
} from '@nestjs/common'
import { TagService } from './tag.service'
import { CreateTagDto, UpdateTagDto, TagQueryDto } from './dto/tag.dto'
import { AuthGuard } from '../auth/auth.guard'
import {
	CrudPermissions,
	Public,
} from '../common/decorators/permissions.decorator'

@Controller('api/tags')
@UseGuards(AuthGuard)
export class TagController {
	constructor(private readonly tagService: TagService) {}

	@Get('options')
	@Public()
	async getTagOptions() {
		return this.tagService.getTagOptions()
	}

	@Post()
	@HttpCode(HttpStatus.CREATED)
	@CrudPermissions.ContentTypes.Create()
	async create(@Body() createTagDto: CreateTagDto) {
		return this.tagService.create(createTagDto)
	}

	@Get()
	@CrudPermissions.ContentTypes.Read()
	async findAll(@Query() query: TagQueryDto) {
		return this.tagService.findAll(query)
	}

	@Get(':id')
	@CrudPermissions.ContentTypes.Read()
	async findOne(@Param('id', ParseIntPipe) id: number) {
		return this.tagService.findOne(id)
	}

	@Patch(':id')
	@CrudPermissions.ContentTypes.Update()
	async update(
		@Param('id', ParseIntPipe) id: number,
		@Body() updateTagDto: UpdateTagDto,
	) {
		return this.tagService.update(id, updateTagDto)
	}

	@Delete(':id')
	@HttpCode(HttpStatus.NO_CONTENT)
	@CrudPermissions.ContentTypes.Delete()
	async remove(@Param('id', ParseIntPipe) id: number) {
		return this.tagService.delete(id)
	}

	@Post(':id/restore')
	@HttpCode(HttpStatus.OK)
	@CrudPermissions.ContentTypes.Restore()
	async restore(@Param('id', ParseIntPipe) id: number) {
		return this.tagService.restore(id)
	}

	@Delete(':id/permanent')
	@HttpCode(HttpStatus.NO_CONTENT)
	@CrudPermissions.ContentTypes.Delete() // Reuse delete permission for permanent delete
	async permanentDelete(@Param('id', ParseIntPipe) id: number) {
		return this.tagService.permanentDelete(id)
	}
}
