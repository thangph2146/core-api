import { 
  Controller, 
  Get, 
  Param, 
  Query, 
  ParseIntPipe,
} from '@nestjs/common';
import { BlogService } from './blog.service';

@Controller('api/blogs')
export class BlogController {
  constructor(private readonly blogService: BlogService) {}

  @Get()
  async findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10'
  ) {
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    
    return await this.blogService.findPublished(pageNumber, limitNumber);
  }

  @Get('featured')
  async getFeatured(@Query('limit') limit: string = '5') {
    const limitNumber = parseInt(limit, 10);
    return await this.blogService.findFeatured(limitNumber);
  }

  @Get('published')
  async getPublished(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10'
  ) {
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    
    return await this.blogService.findPublished(pageNumber, limitNumber);
  }

  @Get(':identifier')
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
