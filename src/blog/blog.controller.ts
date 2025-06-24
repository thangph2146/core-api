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
} from '@nestjs/common';
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
} from './dto/blog.dto';
import { AuthenticatedRequest } from 'src/common/interfaces';
import { AuthGuard } from '../auth/auth.guard';

@Controller('api/blogs')
@UseGuards(AuthGuard)
export class BlogController {
	constructor(private readonly blogService: BlogService) {}

	// =================================================================================
	// PUBLIC ENDPOINTS
	// =================================================================================

	@Get()
	@Public()
	async findPublished(@Query() query: BlogQueryDto) {
		return await this.blogService.findPublished(query.page, query.limit);
	}

	@Get('featured')
	@Public()
	async getFeatured(@Query('limit') limit: string = '5') {
		return await this.blogService.findFeatured(parseInt(limit, 10));
	}

	@Get(':slug')
	@Public()
	async findBySlug(@Param('slug') slug: string) {
		const blog = await this.blogService.findBySlug(slug);
		// Increment view count without waiting for it to complete
		this.blogService.incrementViewCount(blog.id);
		return blog;
	}

	// =================================================================================
	// ADMIN ENDPOINTS
	// =================================================================================

	@Get('admin/all')
	@CrudPermissions.Blogs.Read()
	async findAllForAdmin(@Query() query: AdminBlogQueryDto) {
		return await this.blogService.findAllForAdmin(query);
	}

	@Get('admin/:id')
	@CrudPermissions.Blogs.Read()
	async findOneForAdmin(@Param('id', ParseIntPipe) id: number) {
		return await this.blogService.findOneForAdmin(id);
	}

	@Post()
	@HttpCode(HttpStatus.CREATED)
	@CrudPermissions.Blogs.Create()
	async create(
		@Body() createBlogDto: CreateBlogDto,
		@Request() req: AuthenticatedRequest,
	) {
		return await this.blogService.create(createBlogDto, req.user.id);
	}

	@Patch(':id')
	@CrudPermissions.Blogs.Update()
	@RequireOwnership('BLOGS')
	async update(
		@Param('id', ParseIntPipe) id: number,
		@Body() updateBlogDto: UpdateBlogDto,
	) {
		return await this.blogService.update(id, updateBlogDto);
	}

	@Delete(':id')
	@HttpCode(HttpStatus.NO_CONTENT)
	@CrudPermissions.Blogs.Delete()
	@RequireOwnership('BLOGS')
	async remove(@Param('id', ParseIntPipe) id: number) {
		return await this.blogService.remove(id);
	}

	@Post(':id/restore')
	@HttpCode(HttpStatus.OK)
	@CrudPermissions.Blogs.Restore()
	async restore(@Param('id', ParseIntPipe) id: number) {
		return this.blogService.restore(id);
	}

	@Patch(':id/publish')
	@HttpCode(HttpStatus.OK)
	@CrudPermissions.Blogs.FullAccess()
	async publish(@Param('id', ParseIntPipe) id: number) {
		return this.blogService.publish(id);
	}

	@Patch(':id/unpublish')
	@HttpCode(HttpStatus.OK)
	@CrudPermissions.Blogs.FullAccess()
	async unpublish(@Param('id', ParseIntPipe) id: number) {
		return this.blogService.unpublish(id);
	}
}
