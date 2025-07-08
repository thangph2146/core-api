import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsDateString,
  IsArray,
  IsJSON,
  IsEnum,
  IsInt,
  Min,
  Max,
  MinLength,
  MaxLength,
  ArrayMinSize,
  ArrayNotEmpty,
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

export enum BlogSortBy {
  ID = 'id',
  TITLE = 'title',
  SLUG = 'slug',
  PUBLISHED_AT = 'publishedAt',
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  DELETED_AT = 'deletedAt',
  VIEWS = 'views',
  CATEGORY = 'category',
  AUTHOR = 'author',
}

// =============================================================================
// CREATE & UPDATE DTOs
// =============================================================================
export class CreateBlogDto {
  @ApiProperty({
    description: 'Tiêu đề blog',
    example: 'Hướng dẫn sử dụng NestJS',
    minLength: 5,
    maxLength: 255,
  })
  @IsString()
  @MinLength(5, { message: 'Blog title must be at least 5 characters long' })
  @MaxLength(255, { message: 'Blog title must not exceed 255 characters' })
  title: string;

  @ApiProperty({
    description: 'Slug của blog (URL-friendly)',
    example: 'huong-dan-su-dung-nestjs',
    minLength: 5,
    maxLength: 255,
  })
  @IsString()
  @MinLength(5, { message: 'Blog slug must be at least 5 characters long' })
  @MaxLength(255, { message: 'Blog slug must not exceed 255 characters' })
  slug: string;

  @ApiPropertyOptional({
    description: 'Tóm tắt nội dung blog',
    example: 'Bài viết hướng dẫn cách sử dụng NestJS framework...',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Blog summary must not exceed 500 characters' })
  summary?: string;

  @ApiProperty({
    description: 'Nội dung blog (JSON format)',
    example: { blocks: [{ type: 'paragraph', data: { text: 'Nội dung blog...' } }] },
  })
  @IsJSON()
  content: any;

  @ApiPropertyOptional({
    description: 'URL hình ảnh đại diện',
    example: 'https://example.com/image.jpg',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Image URL must not exceed 500 characters' })
  imageUrl?: string;

  @ApiPropertyOptional({
    description: 'Tiêu đề hình ảnh',
    example: 'NestJS Framework Logo',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255, { message: 'Image title must not exceed 255 characters' })
  imageTitle?: string;

  @ApiPropertyOptional({
    description: 'ID trạng thái blog',
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @IsNumber()
  @IsPositive({ message: 'Status ID must be positive' })
  statusId?: number;

  @ApiPropertyOptional({
    description: 'Thời gian xuất bản',
    example: '2024-01-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  publishedAt?: string;

  @ApiPropertyOptional({
    description: 'ID danh mục blog',
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @IsNumber()
  @IsPositive({ message: 'Category ID must be positive' })
  categoryId?: number;

  @ApiPropertyOptional({
    description: 'Blog nổi bật',
    example: true,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @ApiPropertyOptional({
    description: 'Cho phép bình luận',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  allowComments?: boolean;

  @ApiPropertyOptional({
    description: 'Meta title cho SEO',
    example: 'Hướng dẫn sử dụng NestJS - Blog',
    maxLength: 60,
  })
  @IsOptional()
  @IsString()
  @MaxLength(60, { message: 'Meta title must not exceed 60 characters' })
  metaTitle?: string;

  @ApiPropertyOptional({
    description: 'Meta description cho SEO',
    example: 'Bài viết hướng dẫn chi tiết cách sử dụng NestJS framework...',
    maxLength: 160,
  })
  @IsOptional()
  @IsString()
  @MaxLength(160, { message: 'Meta description must not exceed 160 characters' })
  metaDescription?: string;

  @ApiPropertyOptional({
    description: 'Danh sách ID thẻ tags',
    example: [1, 2, 3],
    type: [Number],
  })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  @ArrayMinSize(0)
  tagIds?: number[];
}

export class UpdateBlogDto extends PartialType(CreateBlogDto) {}

// =============================================================================
// QUERY DTOs
// =============================================================================
export class BlogQueryDto {
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
    description: 'Slug danh mục',
    example: 'technology',
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({
    description: 'Slug thẻ tag',
    example: 'nestjs',
  })
  @IsOptional()
  @IsString()
  tag?: string;

  @ApiPropertyOptional({
    description: 'Slug trạng thái',
    example: 'published',
  })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({
    description: 'ID tác giả',
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive({ message: 'Author ID must be positive' })
  authorId?: number;

  @ApiPropertyOptional({
    description: 'Bao gồm blog đã xóa',
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
    description: 'Chỉ lấy blog nổi bật',
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  featured?: boolean;

  @ApiPropertyOptional({
    description: 'Từ khóa tìm kiếm',
    example: 'NestJS',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255, { message: 'Search term must not exceed 255 characters' })
  search?: string;

  @ApiPropertyOptional({
    description: 'Sắp xếp theo trường',
    example: 'publishedAt',
    enum: BlogSortBy,
    default: BlogSortBy.PUBLISHED_AT,
  })
  @IsOptional()
  @IsEnum(BlogSortBy)
  sortBy?: BlogSortBy = BlogSortBy.PUBLISHED_AT;

  @ApiPropertyOptional({
    description: 'Thứ tự sắp xếp',
    example: 'desc',
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
export class BulkBlogOperationDto {
  @ApiProperty({
    description: 'Danh sách ID blog',
    example: [1, 2, 3],
    type: [Number],
  })
  @IsArray()
  @ArrayNotEmpty({ message: 'Blog IDs array cannot be empty' })
  @IsNumber({}, { each: true })
  @ArrayMinSize(1, { message: 'At least one blog ID is required' })
  blogIds: number[];
}

export class BulkDeleteResponseDto {
  @ApiProperty({ description: 'Thao tác thành công', example: true })
  success: boolean;

  @ApiProperty({ description: 'Số lượng blog đã xóa', example: 3 })
  deletedCount: number;

  @ApiProperty({ description: 'Số lượng blog bị bỏ qua', example: 0 })
  skippedCount: number;

  @ApiProperty({ description: 'Thông báo kết quả', example: 'Successfully deleted 3 blogs' })
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

  @ApiProperty({ description: 'Số lượng blog đã khôi phục', example: 3 })
  restoredCount: number;

  @ApiProperty({ description: 'Số lượng blog bị bỏ qua', example: 0 })
  skippedCount: number;

  @ApiProperty({ description: 'Thông báo kết quả', example: 'Successfully restored 3 blogs' })
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

  @ApiProperty({ description: 'Số lượng blog đã xóa vĩnh viễn', example: 3 })
  deletedCount: number;

  @ApiProperty({ description: 'Số lượng blog bị bỏ qua', example: 0 })
  skippedCount: number;

  @ApiProperty({ description: 'Thông báo kết quả', example: 'Successfully permanently deleted 3 blogs' })
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
export class BlogResponseDto {
  @ApiProperty({ description: 'ID blog', example: 1 })
  id: number;

  @ApiProperty({ description: 'Tiêu đề blog', example: 'Hướng dẫn sử dụng NestJS' })
  title: string;

  @ApiProperty({ description: 'Slug blog', example: 'huong-dan-su-dung-nestjs' })
  slug: string;

  @ApiPropertyOptional({ description: 'Tóm tắt blog', example: 'Bài viết hướng dẫn...' })
  summary?: string;

  @ApiProperty({ description: 'Nội dung blog', example: { blocks: [] } })
  content: any;

  @ApiPropertyOptional({ description: 'URL hình ảnh', example: 'https://example.com/image.jpg' })
  imageUrl?: string;

  @ApiPropertyOptional({ description: 'Tiêu đề hình ảnh', example: 'NestJS Logo' })
  imageTitle?: string;

  @ApiPropertyOptional({ description: 'Số lượt xem', example: 100 })
  views?: number;

  @ApiPropertyOptional({ description: 'Blog nổi bật', example: true })
  isFeatured?: boolean;

  @ApiPropertyOptional({ description: 'Cho phép bình luận', example: true })
  allowComments?: boolean;

  @ApiPropertyOptional({ description: 'Meta title', example: 'Hướng dẫn sử dụng NestJS' })
  metaTitle?: string;

  @ApiPropertyOptional({ description: 'Meta description', example: 'Bài viết hướng dẫn...' })
  metaDescription?: string;

  @ApiPropertyOptional({ description: 'Thời gian xuất bản', example: '2024-01-01T00:00:00.000Z' })
  publishedAt?: string;

  @ApiProperty({ description: 'Thời gian tạo', example: '2024-01-01T00:00:00.000Z' })
  createdAt: string;

  @ApiProperty({ description: 'Thời gian cập nhật', example: '2024-01-01T00:00:00.000Z' })
  updatedAt: string;

  @ApiPropertyOptional({ description: 'Thời gian xóa', example: '2024-01-01T00:00:00.000Z' })
  deletedAt?: string;

  @ApiPropertyOptional({ description: 'Thông tin tác giả' })
  author?: {
    id: number;
    name: string;
    email: string;
    avatarUrl?: string;
  };

  @ApiPropertyOptional({ description: 'Thông tin danh mục' })
  category?: {
    id: number;
    name: string;
    slug: string;
  };

  @ApiPropertyOptional({ description: 'Thông tin trạng thái' })
  status?: {
    id: number;
    name: string;
    slug: string;
  };

  @ApiPropertyOptional({ description: 'Danh sách tags', type: [Object] })
  tags?: Array<{
    id: number;
    name: string;
    slug: string;
  }>;

  @ApiPropertyOptional({ description: 'Số liệu thống kê' })
  _count?: {
    comments: number;
    likes: number;
  };
}

export class BlogMetaResponseDto {
  @ApiProperty({ description: 'Tổng số blog', example: 100 })
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

export class BlogListResponseDto {
  @ApiProperty({ description: 'Danh sách blog', type: [BlogResponseDto] })
  data: BlogResponseDto[];

  @ApiProperty({ description: 'Thông tin phân trang', type: BlogMetaResponseDto })
  meta: BlogMetaResponseDto;
}

export class BlogStatsDto {
  @ApiProperty({ description: 'Tổng số blog', example: 100 })
  total: number;

  @ApiProperty({ description: 'Số blog đã xuất bản', example: 80 })
  published: number;

  @ApiProperty({ description: 'Số blog nháp', example: 15 })
  draft: number;

  @ApiProperty({ description: 'Số blog đã xóa', example: 5 })
  deleted: number;

  @ApiProperty({ description: 'Số blog nổi bật', example: 10 })
  featured: number;

  @ApiProperty({ description: 'Tổng lượt xem', example: 10000 })
  totalViews: number;

  @ApiProperty({ description: 'Số blog trong tháng', example: 15 })
  thisMonth: number;

  @ApiProperty({ description: 'Số blog trong tuần', example: 3 })
  thisWeek: number;

  @ApiProperty({ description: 'Số blog hôm nay', example: 1 })
  today: number;
}

export class BlogOptionDto {
  @ApiProperty({ description: 'ID blog', example: 1 })
  id: number;

  @ApiProperty({ description: 'Tiêu đề blog', example: 'Hướng dẫn sử dụng NestJS' })
  title: string;

  @ApiProperty({ description: 'Slug blog', example: 'huong-dan-su-dung-nestjs' })
  slug: string;

  @ApiPropertyOptional({ description: 'URL hình ảnh', example: 'https://example.com/image.jpg' })
  imageUrl?: string;

  @ApiPropertyOptional({ description: 'Trạng thái', example: 'published' })
  status?: string;
}
