import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  Query,
  UseGuards,
} from '@nestjs/common';
import { CategoryService } from './category.service';
import { AuthGuard } from '../auth/auth.guard';
import { RequirePermissions, Public } from '../common/decorators/roles.decorator';

@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  // Public endpoints
  @Get()
  @Public()
  async findAll(@Query('type') type?: string) {
    if (type) {
      return this.categoryService.findByType(type);
    }
    return this.categoryService.findAll();
  }

  @Get('type/:type')
  @Public()
  async findByType(@Param('type') type: string) {
    return this.categoryService.findByType(type);
  }

  @Get(':identifier')
  @Public()
  async findOne(
    @Param('identifier') identifier: string,
    @Query('type') type?: string
  ) {
    // Check if identifier is a number (ID) or string (slug)
    const isNumeric = /^\d+$/.test(identifier);
    
    if (isNumeric) {
      return this.categoryService.findOne(parseInt(identifier, 10));
    } else {
      if (!type) {
        throw new Error('Type parameter is required when searching by slug');
      }
      return this.categoryService.findBySlug(identifier, type);
    }
  }

  // Admin endpoints
  @Post()
  @RequirePermissions('categories.create')
  async create(@Body() createCategoryDto: any) {
    return this.categoryService.create(createCategoryDto);
  }

  @Put(':id')
  @RequirePermissions('categories.update')
  async update(@Param('id') id: string, @Body() updateCategoryDto: any) {
    return this.categoryService.update({
      where: { id: parseInt(id, 10) },
      data: updateCategoryDto,
    });
  }

  @Delete(':id')
  @RequirePermissions('categories.delete')
  async remove(@Param('id') id: string) {
    return this.categoryService.delete({ id: parseInt(id, 10) });
  }
}
