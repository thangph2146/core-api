import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsEnum,
  IsInt,
  Min,
  Max,
  MinLength,
  MaxLength,
  ArrayMinSize,
  ArrayNotEmpty,
  IsArray,
  IsPositive,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

// =============================================================================
// ENUMS
// =============================================================================
export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export enum CategorySortBy {
  ID = 'id',
  NAME = 'name',
  SLUG = 'slug',
  TYPE = 'type',
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  DELETED_AT = 'deletedAt',
}

export enum CategoryType {
  BLOG = 'BLOG',
  PROJECT = 'PROJECT',
  SERVICE = 'SERVICE',
  RECRUITMENT = 'RECRUITMENT',
}

// =============================================================================
// CREATE & UPDATE DTOs
// =============================================================================
export class CreateCategoryDto {
  @ApiProperty({
    description: 'Tên danh mục',
    example: 'Công nghệ thông tin',
    minLength: 2,
    maxLength: 255,
  })
  @IsString()
  @MinLength(2, { message: 'Category name must be at least 2 characters long' })
  @MaxLength(255, { message: 'Category name must not exceed 255 characters' })
  name: string;

  @ApiProperty({
    description: 'Slug của danh mục (URL-friendly)',
    example: 'cong-nghe-thong-tin',
    minLength: 2,
    maxLength: 255,
  })
  @IsString()
  @MinLength(2, { message: 'Category slug must be at least 2 characters long' })
  @MaxLength(255, { message: 'Category slug must not exceed 255 characters' })
  slug: string;

  @ApiProperty({
    description: 'Loại danh mục',
    example: CategoryType.BLOG,
    enum: CategoryType,
  })
  @IsEnum(CategoryType)
  type: CategoryType;

  @ApiPropertyOptional({
    description: 'Mô tả danh mục',
    example: 'Danh mục về các bài viết công nghệ thông tin',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: 'Category description must not exceed 1000 characters' })
  description?: string;

  @ApiPropertyOptional({
    description: 'ID danh mục cha',
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @IsNumber()
  @IsPositive({ message: 'Parent ID must be positive' })
  parentId?: number;

  @ApiPropertyOptional({
    description: 'Meta title cho SEO',
    example: 'Công nghệ thông tin - Danh mục',
    maxLength: 60,
  })
  @IsOptional()
  @IsString()
  @MaxLength(60, { message: 'Meta title must not exceed 60 characters' })
  metaTitle?: string;

  @ApiPropertyOptional({
    description: 'Meta description cho SEO',
    example: 'Danh mục chứa các bài viết về công nghệ thông tin...',
    maxLength: 160,
  })
  @IsOptional()
  @IsString()
  @MaxLength(160, { message: 'Meta description must not exceed 160 characters' })
  metaDescription?: string;
}

export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {}

// =============================================================================
// QUERY DTOs
// =============================================================================
export class CategoryQueryDto {
  @ApiPropertyOptional({
    description: 'Số trang',
    example: 1,
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1, { message: 'Page must be at least 1' })
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Số lượng mỗi trang',
    example: 10,
    default: 10,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1, { message: 'Limit must be at least 1' })
  @Max(100, { message: 'Limit must not exceed 100' })
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Loại danh mục',
    example: CategoryType.BLOG,
    enum: CategoryType,
  })
  @IsOptional()
  @IsEnum(CategoryType)
  type?: CategoryType;

  @ApiPropertyOptional({
    description: 'Bao gồm danh mục đã xóa',
    example: false,
    default: false,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  deleted?: boolean;

  @ApiPropertyOptional({
    description: 'Từ khóa tìm kiếm',
    example: 'công nghệ',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255, { message: 'Search term must not exceed 255 characters' })
  search?: string;

  @ApiPropertyOptional({
    description: 'Sắp xếp theo trường',
    example: CategorySortBy.CREATED_AT,
    enum: CategorySortBy,
    default: CategorySortBy.CREATED_AT,
  })
  @IsOptional()
  @IsEnum(CategorySortBy)
  sortBy?: CategorySortBy = CategorySortBy.CREATED_AT;

  @ApiPropertyOptional({
    description: 'Thứ tự sắp xếp',
    example: SortOrder.DESC,
    enum: SortOrder,
    default: SortOrder.DESC,
  })
  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder = SortOrder.DESC;
}

// =============================================================================
// BULK OPERATION DTOs
// =============================================================================
export class BulkCategoryOperationDto {
  @ApiProperty({
    description: 'Danh sách ID danh mục',
    example: [1, 2, 3],
    type: [Number],
  })
  @IsArray()
  @ArrayNotEmpty({ message: 'Category IDs array cannot be empty' })
  @IsNumber({}, { each: true })
  @ArrayMinSize(1, { message: 'At least one category ID is required' })
  categoryIds: number[];
}

export class BulkDeleteResponseDto {
  @ApiProperty({ description: 'Thao tác thành công', example: true })
  success: boolean;

  @ApiProperty({ description: 'Số lượng danh mục đã xóa', example: 3 })
  deletedCount: number;

  @ApiProperty({ description: 'Số lượng danh mục bị bỏ qua', example: 0 })
  skippedCount: number;

  @ApiProperty({ description: 'Thông báo kết quả', example: 'Successfully deleted 3 categories' })
  message: string;

  @ApiPropertyOptional({
    description: 'Chi tiết thao tác',
    example: {
      successIds: [1, 2, 3],
      skippedIds: [],
      errors: [],
    },
  })
  details?: {
    successIds: number[];
    skippedIds: number[];
    errors?: string[];
  };
}

export class BulkRestoreResponseDto {
  @ApiProperty({ description: 'Thao tác thành công', example: true })
  success: boolean;

  @ApiProperty({ description: 'Số lượng danh mục đã khôi phục', example: 3 })
  restoredCount: number;

  @ApiProperty({ description: 'Số lượng danh mục bị bỏ qua', example: 0 })
  skippedCount: number;

  @ApiProperty({ description: 'Thông báo kết quả', example: 'Successfully restored 3 categories' })
  message: string;

  @ApiPropertyOptional({
    description: 'Chi tiết thao tác',
    example: {
      successIds: [1, 2, 3],
      skippedIds: [],
      errors: [],
    },
  })
  details?: {
    successIds: number[];
    skippedIds: number[];
    errors?: string[];
  };
}

export class BulkPermanentDeleteResponseDto {
  @ApiProperty({ description: 'Thao tác thành công', example: true })
  success: boolean;

  @ApiProperty({ description: 'Số lượng danh mục đã xóa vĩnh viễn', example: 3 })
  deletedCount: number;

  @ApiProperty({ description: 'Số lượng danh mục bị bỏ qua', example: 0 })
  skippedCount: number;

  @ApiProperty({ description: 'Thông báo kết quả', example: 'Successfully permanently deleted 3 categories' })
  message: string;

  @ApiPropertyOptional({
    description: 'Chi tiết thao tác',
    example: {
      successIds: [1, 2, 3],
      skippedIds: [],
      errors: [],
    },
  })
  details?: {
    successIds: number[];
    skippedIds: number[];
    errors?: string[];
  };
}

// =============================================================================
// RESPONSE DTOs
// =============================================================================
export class CategoryResponseDto {
  @ApiProperty({ description: 'ID danh mục', example: 1 })
  id: number;

  @ApiProperty({ description: 'Tên danh mục', example: 'Công nghệ thông tin' })
  name: string;

  @ApiProperty({ description: 'Slug danh mục', example: 'cong-nghe-thong-tin' })
  slug: string;

  @ApiProperty({ description: 'Loại danh mục', example: 'BLOG', enum: CategoryType })
  type: CategoryType;

  @ApiPropertyOptional({ description: 'Mô tả danh mục', example: 'Danh mục về công nghệ...' })
  description?: string;

  @ApiPropertyOptional({ description: 'ID danh mục cha', example: 1 })
  parentId?: number;

  @ApiPropertyOptional({ description: 'Meta title', example: 'Công nghệ thông tin' })
  metaTitle?: string;

  @ApiPropertyOptional({ description: 'Meta description', example: 'Danh mục về công nghệ...' })
  metaDescription?: string;

  @ApiProperty({ description: 'Thời gian tạo', example: '2024-01-01T00:00:00.000Z' })
  createdAt: string;

  @ApiProperty({ description: 'Thời gian cập nhật', example: '2024-01-01T00:00:00.000Z' })
  updatedAt: string;

  @ApiPropertyOptional({ description: 'Thời gian xóa', example: '2024-01-01T00:00:00.000Z' })
  deletedAt?: string;

  @ApiPropertyOptional({ description: 'Danh mục cha' })
  parent?: {
    id: number;
    name: string;
    slug: string;
    type: CategoryType;
  };

  @ApiPropertyOptional({ description: 'Danh mục con', type: [Object] })
  children?: Array<{
    id: number;
    name: string;
    slug: string;
    type: CategoryType;
  }>;

  @ApiPropertyOptional({ description: 'Số liệu thống kê' })
  _count?: {
    blogs: number;
    recruitmentPosts: number;
    services: number;
    children: number;
  };
}

export class CategoryMetaResponseDto {
  @ApiProperty({ description: 'Tổng số danh mục', example: 100 })
  total: number;

  @ApiProperty({ description: 'Trang hiện tại', example: 1 })
  page: number;

  @ApiProperty({ description: 'Số lượng mỗi trang', example: 10 })
  limit: number;

  @ApiProperty({ description: 'Tổng số trang', example: 10 })
  totalPages: number;

  @ApiProperty({ description: 'Có trang tiếp theo', example: true })
  hasNext: boolean;

  @ApiProperty({ description: 'Có trang trước', example: false })
  hasPrevious: boolean;
}

export class CategoryListResponseDto {
  @ApiProperty({ description: 'Danh sách danh mục', type: [CategoryResponseDto] })
  data: CategoryResponseDto[];

  @ApiProperty({ description: 'Thông tin phân trang', type: CategoryMetaResponseDto })
  meta: CategoryMetaResponseDto;
}

export class CategoryStatsDto {
  @ApiProperty({ description: 'Tổng số danh mục', example: 100 })
  total: number;

  @ApiProperty({ description: 'Số danh mục BLOG', example: 30 })
  blogCategories: number;

  @ApiProperty({ description: 'Số danh mục PROJECT', example: 25 })
  projectCategories: number;

  @ApiProperty({ description: 'Số danh mục SERVICE', example: 20 })
  serviceCategories: number;

  @ApiProperty({ description: 'Số danh mục RECRUITMENT', example: 15 })
  recruitmentCategories: number;

  @ApiProperty({ description: 'Số danh mục đã xóa', example: 10 })
  deleted: number;

  @ApiProperty({ description: 'Số danh mục trong tháng', example: 5 })
  thisMonth: number;

  @ApiProperty({ description: 'Số danh mục trong tuần', example: 2 })
  thisWeek: number;

  @ApiProperty({ description: 'Số danh mục hôm nay', example: 1 })
  today: number;
}

export class CategoryOptionDto {
  @ApiProperty({ description: 'ID danh mục', example: 1 })
  value: number;

  @ApiProperty({ description: 'Tên danh mục', example: 'Công nghệ thông tin' })
  label: string;

  @ApiProperty({ description: 'Loại danh mục', example: 'BLOG' })
  type: string;

  @ApiPropertyOptional({ description: 'Slug danh mục', example: 'cong-nghe-thong-tin' })
  slug?: string;

  @ApiPropertyOptional({ description: 'ID danh mục cha', example: 1 })
  parentId?: number;
} 