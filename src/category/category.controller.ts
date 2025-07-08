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
import {
	ApiTags,
	ApiOperation,
	ApiResponse,
	ApiBearerAuth,
	ApiParam,
	ApiQuery,
	ApiOkResponse,
	ApiNoContentResponse,
	ApiNotFoundResponse,
} from '@nestjs/swagger'
import { CategoryService } from './category.service'
import {
	Public,
	CrudPermissions,
} from '../common/decorators/permissions.decorator'
import {
	CreateCategoryDto,
	UpdateCategoryDto,
	CategoryQueryDto,
	BulkCategoryOperationDto,
	BulkDeleteResponseDto,
	BulkRestoreResponseDto,
	BulkPermanentDeleteResponseDto,
	CategoryListResponseDto,
	CategoryResponseDto,
	CategoryStatsDto,
	CategoryOptionDto,
	CategoryType,
} from './dto/category.dto'
import { AuthGuard } from '../auth/auth.guard'

@ApiTags('Categories')
@ApiBearerAuth()
@Controller('categories')
export class CategoryController {
	constructor(private readonly categoryService: CategoryService) {}

	// =============================================================================
	// MAIN ENDPOINTS
	// =============================================================================

	@Get()
	@UseGuards(AuthGuard)
	@CrudPermissions.Categories.Read()
	@ApiOperation({
		summary: 'Lấy danh sách danh mục (Admin)',
		description: 'Lấy danh sách tất cả danh mục với quyền admin, bao gồm cả danh mục đã xóa',
	})
	@ApiResponse({
		status: 200,
		description: 'Danh sách danh mục',
		type: CategoryListResponseDto,
	})
	async findAll(@Query() query: CategoryQueryDto): Promise<CategoryListResponseDto> {
		return this.categoryService.findAll(query)
	}

	@Get('public')
	@Public()
	@ApiOperation({
		summary: 'Lấy danh sách danh mục công khai',
		description: 'Lấy danh sách danh mục cho người dùng công khai',
	})
	@ApiResponse({
		status: 200,
		description: 'Danh sách danh mục công khai',
		type: CategoryListResponseDto,
	})
	async findPublic(@Query() query: CategoryQueryDto): Promise<CategoryListResponseDto> {
		return this.categoryService.findPublic(query)
	}

	@Get('deleted')
	@UseGuards(AuthGuard)
	@CrudPermissions.Categories.Read()
	@ApiOperation({
		summary: 'Lấy danh sách danh mục đã xóa',
		description: 'Lấy danh sách danh mục đã bị xóa mềm',
	})
	@ApiResponse({
		status: 200,
		description: 'Danh sách danh mục đã xóa',
		type: CategoryListResponseDto,
	})
	async findDeleted(@Query() query: CategoryQueryDto): Promise<CategoryListResponseDto> {
		const deletedQuery = { ...query, deleted: true }
		return this.categoryService.findAll(deletedQuery)
	}

	@Get('stats')
	@UseGuards(AuthGuard)
	@CrudPermissions.Categories.Read()
	@ApiOperation({
		summary: 'Lấy thống kê danh mục',
		description: 'Lấy thống kê tổng quan về danh mục trong hệ thống',
	})
	@ApiResponse({
		status: 200,
		description: 'Thống kê danh mục',
		type: CategoryStatsDto,
	})
	async getStats(): Promise<CategoryStatsDto> {
		return this.categoryService.getStats()
	}

	/**
	 * Get category options for dropdowns/select
	 */
	@Get('options')
	@UseGuards(AuthGuard)
	@CrudPermissions.Categories.Read()
	@ApiOperation({
		summary: 'Lấy danh sách tùy chọn danh mục',
		description: 'Lấy danh sách danh mục dạng tùy chọn cho dropdown/select',
	})
	@ApiQuery({ name: 'type', required: false, description: 'Loại danh mục' })
	@ApiResponse({
		status: 200,
		description: 'Danh sách tùy chọn danh mục',
		type: [CategoryOptionDto],
	})
	getOptions(@Query('type') type?: string) {
		return this.categoryService.getOptions(type as CategoryType)
	}

	// =============================================================================
	// BULK OPERATIONS
	// =============================================================================

	@Post('bulk/delete')
	@HttpCode(HttpStatus.OK)
	@UseGuards(AuthGuard)
	@CrudPermissions.Categories.BulkDelete()
	@ApiOperation({
		summary: 'Xóa mềm nhiều danh mục',
		description: 'Xóa mềm nhiều danh mục cùng lúc',
	})
	@ApiResponse({
		status: 200,
		description: 'Xóa thành công',
		type: BulkDeleteResponseDto,
	})
	async bulkDelete(@Body() body: BulkCategoryOperationDto): Promise<BulkDeleteResponseDto> {
		return this.categoryService.bulkDelete(body.categoryIds)
	}

	@Post('bulk/restore')
	@HttpCode(HttpStatus.OK)
	@UseGuards(AuthGuard)
	@CrudPermissions.Categories.BulkRestore()
	@ApiOperation({
		summary: 'Khôi phục nhiều danh mục',
		description: 'Khôi phục nhiều danh mục đã bị xóa mềm',
	})
	@ApiResponse({
		status: 200,
		description: 'Khôi phục thành công',
		type: BulkRestoreResponseDto,
	})
	async bulkRestore(@Body() body: BulkCategoryOperationDto): Promise<BulkRestoreResponseDto> {
		return this.categoryService.bulkRestore(body.categoryIds)
	}

	@Post('bulk/permanent-delete')
	@HttpCode(HttpStatus.OK)
	@UseGuards(AuthGuard)
	@CrudPermissions.Categories.BulkPermanentDelete()
	@ApiOperation({
		summary: 'Xóa vĩnh viễn nhiều danh mục',
		description: 'Xóa vĩnh viễn nhiều danh mục khỏi hệ thống',
	})
	@ApiResponse({
		status: 200,
		description: 'Xóa vĩnh viễn thành công',
		type: BulkPermanentDeleteResponseDto,
	})
	async bulkPermanentDelete(@Body() body: BulkCategoryOperationDto): Promise<BulkPermanentDeleteResponseDto> {
		return this.categoryService.bulkPermanentDelete(body.categoryIds)
	}

	// =============================================================================
	// INDIVIDUAL OPERATIONS
	// =============================================================================

	@Get(':type/:slug')
	@Public()
	@ApiOperation({
		summary: 'Lấy danh mục theo slug và type',
		description: 'Lấy thông tin danh mục theo slug và type cho người dùng công khai',
	})
	@ApiParam({ name: 'type', description: 'Loại danh mục', example: 'BLOG' })
	@ApiParam({ name: 'slug', description: 'Slug danh mục', example: 'cong-nghe-thong-tin' })
	@ApiResponse({
		status: 200,
		description: 'Thông tin danh mục',
		type: CategoryResponseDto,
	})
	@ApiResponse({ status: 404, description: 'Không tìm thấy danh mục' })
	async findBySlugPublic(
		@Param('slug') slug: string,
		@Param('type') type: string,
	): Promise<CategoryResponseDto> {
		return this.categoryService.findBySlug(slug, type) as any
	}

	@Get(':id')
	@UseGuards(AuthGuard)
	@CrudPermissions.Categories.Read()
	@ApiOperation({
		summary: 'Lấy thông tin danh mục theo ID',
		description: 'Lấy thông tin chi tiết của một danh mục theo ID',
	})
	@ApiParam({ name: 'id', description: 'ID danh mục', type: Number })
	@ApiResponse({
		status: 200,
		description: 'Thông tin danh mục',
		type: CategoryResponseDto,
	})
	@ApiResponse({ status: 404, description: 'Không tìm thấy danh mục' })
	async findOne(@Param('id', ParseIntPipe) id: number): Promise<CategoryResponseDto> {
		return this.categoryService.findOne(id) as any
	}

	@Post()
	@UseGuards(AuthGuard)
	@CrudPermissions.Categories.Create()
	@ApiOperation({
		summary: 'Tạo danh mục mới',
		description: 'Tạo một danh mục mới trong hệ thống',
	})
	@ApiResponse({
		status: 201,
		description: 'Tạo danh mục thành công',
		type: CategoryResponseDto,
	})
	@ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
	@ApiResponse({ status: 409, description: 'Tên hoặc slug đã tồn tại' })
	async create(@Body() createCategoryDto: CreateCategoryDto): Promise<CategoryResponseDto> {
		return this.categoryService.create(createCategoryDto) as any
	}

	@Patch(':id')
	@UseGuards(AuthGuard)
	@CrudPermissions.Categories.Update()
	@ApiOperation({
		summary: 'Cập nhật thông tin danh mục',
		description: 'Cập nhật thông tin của một danh mục',
	})
	@ApiParam({ name: 'id', description: 'ID danh mục', type: Number })
	@ApiResponse({
		status: 200,
		description: 'Cập nhật thành công',
		type: CategoryResponseDto,
	})
	@ApiResponse({ status: 404, description: 'Không tìm thấy danh mục' })
	async update(
		@Param('id', ParseIntPipe) id: number,
		@Body() updateCategoryDto: UpdateCategoryDto,
	): Promise<CategoryResponseDto> {
		return this.categoryService.update(id, updateCategoryDto) as any
	}

	/**
	 * Soft delete a category by ID
	 */
	@Delete(':id')
	@HttpCode(HttpStatus.NO_CONTENT)
	@UseGuards(AuthGuard)
	@CrudPermissions.Categories.Delete()
	@ApiOperation({
		summary: 'Xóa mềm danh mục',
		description: 'Xóa mềm một danh mục (có thể khôi phục)',
	})
	@ApiParam({ name: 'id', description: 'ID danh mục', type: Number })
	@ApiNoContentResponse({ description: 'Category deleted successfully' })
	@ApiNotFoundResponse({ description: 'Category not found' })
	async deleteCategory(@Param('id', ParseIntPipe) id: number): Promise<void> {
		await this.categoryService.remove(id)
	}

	@Post(':id/restore')
	@HttpCode(HttpStatus.OK)
	@UseGuards(AuthGuard)
	@CrudPermissions.Categories.Restore()
	@ApiOperation({
		summary: 'Khôi phục danh mục',
		description: 'Khôi phục một danh mục đã bị xóa mềm',
	})
	@ApiParam({ name: 'id', description: 'ID danh mục', type: Number })
	@ApiResponse({
		status: 200,
		description: 'Khôi phục thành công',
		type: CategoryResponseDto,
	})
	@ApiResponse({ status: 404, description: 'Không tìm thấy danh mục' })
	async restore(@Param('id', ParseIntPipe) id: number): Promise<CategoryResponseDto> {
		return this.categoryService.restore(id) as any
	}

	@Delete(':id/permanent')
	@UseGuards(AuthGuard)
	@CrudPermissions.Categories.PermanentDelete()
	@ApiOperation({
		summary: 'Xóa vĩnh viễn danh mục',
		description: 'Xóa vĩnh viễn một danh mục khỏi hệ thống',
	})
	@ApiParam({ name: 'id', description: 'ID danh mục', type: Number })
	@ApiResponse({ status: 200, description: 'Xóa vĩnh viễn thành công' })
	@ApiResponse({ status: 404, description: 'Không tìm thấy danh mục' })
	async permanentDelete(@Param('id', ParseIntPipe) id: number): Promise<{ message: string }> {
		await this.categoryService.permanentDelete(id)
		return { message: 'Category permanently deleted successfully' }
	}
}
