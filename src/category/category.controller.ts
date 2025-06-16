import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { CategoryService } from './category.service';

@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get()
  async findAll(@Query('type') type?: string) {
    if (type) {
      return this.categoryService.findByType(type);
    }
    return this.categoryService.findAll();
  }

  @Get('type/:type')
  async findByType(@Param('type') type: string) {
    return this.categoryService.findByType(type);
  }

  @Get(':identifier')
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

  @Post()
  async create(@Body() createCategoryDto: any) {
    return this.categoryService.create(createCategoryDto);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateCategoryDto: any) {
    return this.categoryService.update({
      where: { id: parseInt(id, 10) },
      data: updateCategoryDto,
    });
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.categoryService.delete({ id: parseInt(id, 10) });
  }
}
