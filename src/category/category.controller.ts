import {
	Controller,
	Get,
	Post,
	Patch,
	Delete,
	Body,
	Param,
	Query,
	ParseIntPipe,
	HttpCode,
	HttpStatus,
	UseGuards,
} from '@nestjs/common'
import { CategoryService } from './category.service'
import {
	Public,
	CrudPermissions,
} from '../common/decorators/permissions.decorator'
import {
	CreateCategoryDto,
	UpdateCategoryDto,
	CategoryQueryDto,
} from './dto/category.dto'
import { AuthGuard } from '../auth/auth.guard'

@Controller('api/categories')
@UseGuards(AuthGuard)
export class CategoryController {
	constructor(private readonly categoryService: CategoryService) {}

	// =================================================================================
	// PUBLIC ENDPOINTS
	// =================================================================================

	@Get('public')
	@Public()
	async findAllPublic(@Query() query: CategoryQueryDto) {
		// Public queries should not see deleted items
		query.deleted = false
		return this.categoryService.findAll(query)
	}

	@Get(':type/:slug')
	@Public()
	async findBySlugPublic(
		@Param('slug') slug: string,
		@Param('type') type: string,
	) {
		return this.categoryService.findBySlug(slug, type)
	}

	@Get('options')
	@Public()
	async getCategoryOptions(@Query('type') type?: string) {
		return this.categoryService.getCategoryOptions(type)
	}

	// =================================================================================
	// ADMIN ENDPOINTS
	// =================================================================================

	@Get('admin/all')
	@CrudPermissions.ContentTypes.Read()
	async findAllAdmin(@Query() query: CategoryQueryDto) {
		return this.categoryService.findAll(query)
	}

	@Get('admin/:id')
	@CrudPermissions.ContentTypes.Read()
	async findOneAdmin(@Param('id', ParseIntPipe) id: number) {
		return this.categoryService.findOne(id)
	}

	@Post()
	@HttpCode(HttpStatus.CREATED)
	@CrudPermissions.ContentTypes.Create()
	async create(@Body() createCategoryDto: CreateCategoryDto) {
		return this.categoryService.create(createCategoryDto)
	}

	@Patch(':id')
	@CrudPermissions.ContentTypes.Update()
	async update(
		@Param('id', ParseIntPipe) id: number,
		@Body() updateCategoryDto: UpdateCategoryDto,
	) {
		return this.categoryService.update(id, updateCategoryDto)
	}

	@Delete(':id')
	@HttpCode(HttpStatus.NO_CONTENT)
	@CrudPermissions.ContentTypes.Delete()
	async remove(@Param('id', ParseIntPipe) id: number) {
		return this.categoryService.delete(id)
	}

	@Post(':id/restore')
	@CrudPermissions.ContentTypes.Restore()
	async restore(@Param('id', ParseIntPipe) id: number) {
		return this.categoryService.restore(id)
	}

	@Delete(':id/permanent')
	@HttpCode(HttpStatus.NO_CONTENT)
	@CrudPermissions.ContentTypes.FullAccess()
	async permanentDelete(@Param('id', ParseIntPipe) id: number) {
		return this.categoryService.permanentDelete(id)
	}
}
