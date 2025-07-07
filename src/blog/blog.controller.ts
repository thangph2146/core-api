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
	Request,
	HttpCode,
	HttpStatus,
	UseGuards,
	NotFoundException,
} from '@nestjs/common';
import {
	ApiTags,
	ApiOperation,
	ApiResponse,
	ApiBearerAuth,
	ApiParam,
	ApiQuery,
} from '@nestjs/swagger';
import { BlogService } from './blog.service';
import {
	CrudPermissions,
	RequireOwnership,
	Public,
} from '../common/decorators/permissions.decorator';
import {
	CreateBlogDto,
	UpdateBlogDto,
	AdminBlogQueryDto,
	BlogQueryDto,
	BulkBlogOperationDto,
	BulkDeleteResponseDto,
	BulkRestoreResponseDto,
	BulkPermanentDeleteResponseDto,
	BlogListResponseDto,
	BlogResponseDto,
	BlogStatsDto,
	BlogOptionDto,
} from './dto/blog.dto';
import { AuthenticatedRequest } from 'src/common/interfaces';
import { AuthGuard } from '../auth/auth.guard';

@ApiTags('Blogs')
@ApiBearerAuth()
@Controller('blogs')
export class BlogController {
	constructor(private readonly blogService: BlogService) {}

	// =============================================================================
	// MAIN ENDPOINTS
	// =============================================================================

	@Get()
	@UseGuards(AuthGuard)
	@CrudPermissions.Blogs.Read()
	@ApiOperation({
		summary: 'Lấy danh sách blog (Admin)',
		description: 'Lấy danh sách tất cả blog với quyền admin, bao gồm cả blog đã xóa',
	})
	@ApiResponse({
		status: 200,
		description: 'Danh sách blog',
		type: BlogListResponseDto,
	})
	async findAll(@Query() query: AdminBlogQueryDto): Promise<BlogListResponseDto> {
		return this.blogService.findAll(query);
	}

	@Get('public')
	@Public()
	@ApiOperation({
		summary: 'Lấy danh sách blog công khai',
		description: 'Lấy danh sách blog đã được xuất bản cho người dùng công khai',
	})
	@ApiResponse({
		status: 200,
		description: 'Danh sách blog công khai',
		type: BlogListResponseDto,
	})
	async findPublic(@Query() query: BlogQueryDto): Promise<BlogListResponseDto> {
		return this.blogService.findPublic(query);
	}

	@Get('deleted')
	@UseGuards(AuthGuard)
	@CrudPermissions.Blogs.Read()
	@ApiOperation({
		summary: 'Lấy danh sách blog đã xóa',
		description: 'Lấy danh sách blog đã bị xóa mềm',
	})
	@ApiResponse({
		status: 200,
		description: 'Danh sách blog đã xóa',
		type: BlogListResponseDto,
	})
	async findDeleted(@Query() query: AdminBlogQueryDto): Promise<BlogListResponseDto> {
		const deletedQuery = { ...query, deleted: true };
		return this.blogService.findAll(deletedQuery);
	}

	@Get('stats')
	@UseGuards(AuthGuard)
	@CrudPermissions.Blogs.Read()
	@ApiOperation({
		summary: 'Lấy thống kê blog',
		description: 'Lấy thống kê tổng quan về blog trong hệ thống',
	})
	@ApiResponse({
		status: 200,
		description: 'Thống kê blog',
		type: BlogStatsDto,
	})
	async getStats(): Promise<BlogStatsDto> {
		return this.blogService.getStats();
	}

	@Get('options')
	@UseGuards(AuthGuard)
	@CrudPermissions.Blogs.Read()
	@ApiOperation({
		summary: 'Lấy danh sách tùy chọn blog',
		description: 'Lấy danh sách blog dạng tùy chọn cho dropdown/select',
	})
	@ApiResponse({
		status: 200,
		description: 'Danh sách tùy chọn blog',
		type: [BlogOptionDto],
	})
	async getOptions(): Promise<BlogOptionDto[]> {
		return this.blogService.getOptions();
	}

	@Get('featured')
	@Public()
	@ApiOperation({
		summary: 'Lấy danh sách blog nổi bật',
		description: 'Lấy danh sách blog nổi bật cho trang chủ',
	})
	@ApiQuery({ name: 'limit', required: false, description: 'Số lượng blog', example: 5 })
	@ApiResponse({
		status: 200,
		description: 'Danh sách blog nổi bật',
	})
	async getFeatured(@Query('limit') limit: string = '5') {
		return this.blogService.findFeatured(parseInt(limit, 10));
	}

	// =============================================================================
	// BULK OPERATIONS
	// =============================================================================

	@Post('bulk/delete')
	@HttpCode(HttpStatus.OK)
	@UseGuards(AuthGuard)
	@CrudPermissions.Blogs.BulkDelete()
	@ApiOperation({
		summary: 'Xóa mềm nhiều blog',
		description: 'Xóa mềm nhiều blog cùng lúc',
	})
	@ApiResponse({
		status: 200,
		description: 'Xóa thành công',
		type: BulkDeleteResponseDto,
	})
	async bulkDelete(@Body() body: BulkBlogOperationDto): Promise<BulkDeleteResponseDto> {
		return this.blogService.bulkDelete(body.blogIds);
	}

	@Post('bulk/restore')
	@HttpCode(HttpStatus.OK)
	@UseGuards(AuthGuard)
	@CrudPermissions.Blogs.BulkRestore()
	@ApiOperation({
		summary: 'Khôi phục nhiều blog',
		description: 'Khôi phục nhiều blog đã bị xóa mềm',
	})
	@ApiResponse({
		status: 200,
		description: 'Khôi phục thành công',
		type: BulkRestoreResponseDto,
	})
	async bulkRestore(@Body() body: BulkBlogOperationDto): Promise<BulkRestoreResponseDto> {
		return this.blogService.bulkRestore(body.blogIds);
	}

	@Post('bulk/permanent-delete')
	@HttpCode(HttpStatus.OK)
	@UseGuards(AuthGuard)
	@CrudPermissions.Blogs.BulkPermanentDelete()
	@ApiOperation({
		summary: 'Xóa vĩnh viễn nhiều blog',
		description: 'Xóa vĩnh viễn nhiều blog khỏi hệ thống',
	})
	@ApiResponse({
		status: 200,
		description: 'Xóa vĩnh viễn thành công',
		type: BulkPermanentDeleteResponseDto,
	})
	async bulkPermanentDelete(@Body() body: BulkBlogOperationDto): Promise<BulkPermanentDeleteResponseDto> {
		return this.blogService.bulkPermanentDelete(body.blogIds);
	}

	// =============================================================================
	// INDIVIDUAL OPERATIONS
	// =============================================================================

	@Get('slug/:slug')
	@Public()
	@ApiOperation({
		summary: 'Lấy blog theo slug',
		description: 'Lấy thông tin chi tiết blog theo slug (tự động tăng view count)',
	})
	@ApiParam({ name: 'slug', description: 'Slug của blog', example: 'huong-dan-su-dung-nestjs' })
	@ApiResponse({
		status: 200,
		description: 'Thông tin blog',
	})
	@ApiResponse({ status: 404, description: 'Không tìm thấy blog' })
	async findBySlug(@Param('slug') slug: string) {
		const blog = await this.blogService.findBySlug(slug);
		if (!blog) {
			throw new NotFoundException('Không tìm thấy blog');
		}
		// Increment view count without waiting for it to complete
		this.blogService.incrementViewCount(blog.id);
		return blog;
	}

	@Get(':id')
	@UseGuards(AuthGuard)
	@CrudPermissions.Blogs.Read()
	@ApiOperation({
		summary: 'Lấy thông tin blog theo ID',
		description: 'Lấy thông tin chi tiết của một blog theo ID',
	})
	@ApiParam({ name: 'id', description: 'ID blog', type: Number })
	@ApiResponse({
		status: 200,
		description: 'Thông tin blog',
		type: BlogResponseDto,
	})
	@ApiResponse({ status: 404, description: 'Không tìm thấy blog' })
	async findOne(@Param('id', ParseIntPipe) id: number): Promise<BlogResponseDto> {
		const blog = await this.blogService.findOne(id);
		if (!blog) {
			throw new NotFoundException('Không tìm thấy blog');
		}
		return blog as any;
	}

	@Post()
	@UseGuards(AuthGuard)
	@CrudPermissions.Blogs.Create()
	@ApiOperation({
		summary: 'Tạo blog mới',
		description: 'Tạo một blog mới trong hệ thống',
	})
	@ApiResponse({
		status: 201,
		description: 'Tạo blog thành công',
	})
	@ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
	@ApiResponse({ status: 409, description: 'Slug đã tồn tại' })
	async create(
		@Body() createBlogDto: CreateBlogDto,
		@Request() req: AuthenticatedRequest,
	) {
		return this.blogService.create(createBlogDto, req.user.id);
	}

	@Patch(':id')
	@UseGuards(AuthGuard)
	@CrudPermissions.Blogs.Update()
	@RequireOwnership('BLOGS')
	@ApiOperation({
		summary: 'Cập nhật thông tin blog',
		description: 'Cập nhật thông tin của một blog',
	})
	@ApiParam({ name: 'id', description: 'ID blog', type: Number })
	@ApiResponse({
		status: 200,
		description: 'Cập nhật thành công',
	})
	@ApiResponse({ status: 404, description: 'Không tìm thấy blog' })
	async update(
		@Param('id', ParseIntPipe) id: number,
		@Body() updateBlogDto: UpdateBlogDto,
	) {
		return this.blogService.update(id, updateBlogDto);
	}

	@Delete(':id')
	@UseGuards(AuthGuard)
	@CrudPermissions.Blogs.Delete()
	@RequireOwnership('BLOGS')
	@ApiOperation({
		summary: 'Xóa mềm blog',
		description: 'Xóa mềm một blog (có thể khôi phục)',
	})
	@ApiParam({ name: 'id', description: 'ID blog', type: Number })
	@ApiResponse({ status: 200, description: 'Xóa thành công' })
	@ApiResponse({ status: 404, description: 'Không tìm thấy blog' })
	async remove(@Param('id', ParseIntPipe) id: number): Promise<{ message: string }> {
		await this.blogService.remove(id);
		return { message: 'Blog deleted successfully' };
	}

	@Post(':id/restore')
	@HttpCode(HttpStatus.OK)
	@UseGuards(AuthGuard)
	@CrudPermissions.Blogs.Restore()
	@ApiOperation({
		summary: 'Khôi phục blog',
		description: 'Khôi phục một blog đã bị xóa mềm',
	})
	@ApiParam({ name: 'id', description: 'ID blog', type: Number })
	@ApiResponse({
		status: 200,
		description: 'Khôi phục thành công',
	})
	@ApiResponse({ status: 404, description: 'Không tìm thấy blog' })
	async restore(@Param('id', ParseIntPipe) id: number) {
		return this.blogService.restore(id);
	}

	@Delete(':id/permanent')
	@UseGuards(AuthGuard)
	@CrudPermissions.Blogs.PermanentDelete()
	@ApiOperation({
		summary: 'Xóa vĩnh viễn blog',
		description: 'Xóa vĩnh viễn một blog khỏi hệ thống',
	})
	@ApiParam({ name: 'id', description: 'ID blog', type: Number })
	@ApiResponse({ status: 200, description: 'Xóa vĩnh viễn thành công' })
	@ApiResponse({ status: 404, description: 'Không tìm thấy blog' })
	async permanentDelete(@Param('id', ParseIntPipe) id: number): Promise<{ message: string }> {
		await this.blogService.permanentDelete(id);
		return { message: 'Blog permanently deleted successfully' };
	}

	// =============================================================================
	// SPECIAL OPERATIONS
	// =============================================================================

	@Patch(':id/publish')
	@HttpCode(HttpStatus.OK)
	@UseGuards(AuthGuard)
	@CrudPermissions.Blogs.Update()
	@ApiOperation({
		summary: 'Xuất bản blog',
		description: 'Xuất bản một blog (chuyển trạng thái thành published)',
	})
	@ApiParam({ name: 'id', description: 'ID blog', type: Number })
	@ApiResponse({
		status: 200,
		description: 'Xuất bản thành công',
	})
	@ApiResponse({ status: 404, description: 'Không tìm thấy blog' })
	async publish(@Param('id', ParseIntPipe) id: number) {
		return this.blogService.publish(id);
	}

	@Patch(':id/unpublish')
	@HttpCode(HttpStatus.OK)
	@UseGuards(AuthGuard)
	@CrudPermissions.Blogs.Update()
	@ApiOperation({
		summary: 'Hủy xuất bản blog',
		description: 'Hủy xuất bản một blog (chuyển trạng thái thành draft)',
	})
	@ApiParam({ name: 'id', description: 'ID blog', type: Number })
	@ApiResponse({
		status: 200,
		description: 'Hủy xuất bản thành công',
	})
	@ApiResponse({ status: 404, description: 'Không tìm thấy blog' })
	async unpublish(@Param('id', ParseIntPipe) id: number) {
		return this.blogService.unpublish(id);
	}
}
