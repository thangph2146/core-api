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
  Request,
} from '@nestjs/common';
import { BlogService } from './blog.service';
import { AuthGuard } from '../auth/auth.guard';
import {
  RequirePermissions,
  Public,
} from '../common/decorators/roles.decorator';
import { CreateBlogDto, UpdateBlogDto } from './dto/blog.dto';

@Controller('api/blogs')
export class BlogController {
  constructor(private readonly blogService: BlogService) {}

  // Public endpoints (no authentication required)
  @Get()
  @Public()
  async findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);

    return await this.blogService.findPublished(pageNumber, limitNumber);
  }

  @Get('featured')
  @Public()
  async getFeatured(@Query('limit') limit: string = '5') {
    const limitNumber = parseInt(limit, 10);
    return await this.blogService.findFeatured(limitNumber);
  }

  @Get('published')
  @Public()
  async getPublished(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);

    return await this.blogService.findPublished(pageNumber, limitNumber);
  }

  // Admin endpoints (require authentication and permissions)
  @Get('admin/all')
  @RequirePermissions('blogs.read')
  async findAllForAdmin(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('status') status?: string,
    @Query('authorId') authorId?: string,
  ) {
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const authorIdNumber = authorId ? parseInt(authorId, 10) : undefined;

    return await this.blogService.findAllForAdmin({
      page: pageNumber,
      limit: limitNumber,
      status,
      authorId: authorIdNumber,
    });
  }

  @Post()
  @RequirePermissions('blogs.create')
  async create(@Body() createBlogDto: CreateBlogDto, @Request() req: any) {
    return await this.blogService.create({
      ...createBlogDto,
      authorId: req.user.id,
    });
  }

  @Patch(':id')
  @RequirePermissions('blogs.update')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateBlogDto: UpdateBlogDto,
    @Request() req: any,
  ) {
    return await this.blogService.update(id, updateBlogDto, req.user);
  }

  @Delete(':id')
  @RequirePermissions('blogs.delete')
  async remove(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    return await this.blogService.remove(id, req.user);
  }

  @Post(':id/restore')
  @RequirePermissions('blogs.restore')
  async restore(@Param('id', ParseIntPipe) id: number) {
    return await this.blogService.restore(id);
  }

  @Post(':id/publish')
  @RequirePermissions('blogs.publish')
  async publish(@Param('id', ParseIntPipe) id: number) {
    return await this.blogService.publish(id);
  }

  @Post(':id/unpublish')
  @RequirePermissions('blogs.publish')
  async unpublish(@Param('id', ParseIntPipe) id: number) {
    return await this.blogService.unpublish(id);
  }

  // This should be last to avoid conflicts with other routes
  @Get(':identifier')
  @Public()
  async findOne(@Param('identifier') identifier: string) {
    // Check if identifier is a number (ID) or string (slug)
    const isNumeric = /^\d+$/.test(identifier);

    let blog;
    if (isNumeric) {
      const id = parseInt(identifier, 10);
      blog = await this.blogService.findOne(id);
      if (blog) {
        // Increment view count
        await this.blogService.incrementViewCount(id);
      }
    } else {
      blog = await this.blogService.findBySlug(identifier);
      if (blog) {
        // Increment view count
        await this.blogService.incrementViewCount(blog.id);
      }
    }

    return blog;
  }
}
