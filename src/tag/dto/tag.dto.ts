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
} from 'class-validator'
import { Type, Transform } from 'class-transformer'
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger'

// =============================================================================
// ENUMS
// =============================================================================
export enum SortOrder {
	ASC = 'asc',
	DESC = 'desc',
}

export enum TagSortBy {
	ID = 'id',
	NAME = 'name',
	SLUG = 'slug',
	CREATED_AT = 'createdAt',
	UPDATED_AT = 'updatedAt',
	DELETED_AT = 'deletedAt',
}

// =============================================================================
// CREATE & UPDATE DTOs
// =============================================================================
export class CreateTagDto {
	@ApiProperty({
		description: 'Tên thẻ',
		example: 'JavaScript',
		minLength: 1,
		maxLength: 100,
	})
	@IsString()
	@MinLength(1, { message: 'Tag name must be at least 1 character long' })
	@MaxLength(100, { message: 'Tag name must not exceed 100 characters' })
	name: string

	@ApiProperty({
		description: 'Slug của thẻ (URL-friendly)',
		example: 'javascript',
		minLength: 1,
		maxLength: 100,
	})
	@IsString()
	@MinLength(1, { message: 'Tag slug must be at least 1 character long' })
	@MaxLength(100, { message: 'Tag slug must not exceed 100 characters' })
	slug: string

	@ApiPropertyOptional({
		description: 'Meta title cho SEO',
		example: 'JavaScript - Thẻ',
		maxLength: 100,
	})
	@IsOptional()
	@IsString()
	@MaxLength(100, { message: 'Meta title must not exceed 100 characters' })
	metaTitle?: string

	@ApiPropertyOptional({
		description: 'Meta description cho SEO',
		example: 'Thẻ chứa các bài viết về JavaScript...',
		maxLength: 160,
	})
	@IsOptional()
	@IsString()
	@MaxLength(160, { message: 'Meta description must not exceed 160 characters' })
	metaDescription?: string
}

export class UpdateTagDto extends PartialType(CreateTagDto) {}

// =============================================================================
// QUERY DTOs
// =============================================================================
export class TagQueryDto {
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
	page?: number = 1

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
	limit?: number = 10

	@ApiPropertyOptional({
		description: 'Từ khóa tìm kiếm',
		example: 'javascript',
	})
	@IsOptional()
	@IsString()
	@MaxLength(255, { message: 'Search term must not exceed 255 characters' })
	search?: string

	@ApiPropertyOptional({
		description: 'Sắp xếp theo trường',
		example: TagSortBy.CREATED_AT,
		enum: TagSortBy,
		default: TagSortBy.CREATED_AT,
	})
	@IsOptional()
	@IsEnum(TagSortBy)
	sortBy?: TagSortBy = TagSortBy.CREATED_AT

	@ApiPropertyOptional({
		description: 'Thứ tự sắp xếp',
		example: SortOrder.DESC,
		enum: SortOrder,
		default: SortOrder.DESC,
	})
	@IsOptional()
	@IsEnum(SortOrder)
	sortOrder?: SortOrder = SortOrder.DESC
}

export class AdminTagQueryDto extends TagQueryDto {
	@ApiPropertyOptional({
		description: 'Bao gồm thẻ đã xóa',
		example: false,
		default: false,
	})
	@IsOptional()
	@Transform(({ value }) => {
		if (value === 'true') return true
		if (value === 'false') return false
		return value
	})
	@IsBoolean()
	includeDeleted?: boolean = false

	@ApiPropertyOptional({
		description: 'Chỉ lấy thẻ đã xóa',
		example: false,
		default: false,
	})
	@IsOptional()
	@Transform(({ value }) => {
		if (value === 'true') return true
		if (value === 'false') return false
		return value
	})
	@IsBoolean()
	deleted?: boolean = false
}

// =============================================================================
// BULK OPERATION DTOs
// =============================================================================
export class BulkTagOperationDto {
	@ApiProperty({
		description: 'Danh sách ID thẻ',
		example: [1, 2, 3],
		type: [Number],
	})
	@IsArray()
	@ArrayNotEmpty({ message: 'Tag IDs array cannot be empty' })
	@IsNumber({}, { each: true })
	@ArrayMinSize(1, { message: 'At least one tag ID is required' })
	tagIds: number[]
}

export class BulkDeleteResponseDto {
	@ApiProperty({ description: 'Thao tác thành công', example: true })
	success: boolean

	@ApiProperty({ description: 'Số lượng thẻ đã xóa', example: 3 })
	deletedCount: number

	@ApiProperty({ description: 'Số lượng thẻ bị bỏ qua', example: 0 })
	skippedCount: number

	@ApiProperty({ description: 'Thông báo kết quả', example: 'Successfully deleted 3 tags' })
	message: string

	@ApiPropertyOptional({
		description: 'Chi tiết thao tác',
		example: {
			successIds: [1, 2, 3],
			skippedIds: [],
			errors: [],
		},
	})
	details?: {
		successIds: number[]
		skippedIds: number[]
		errors?: string[]
	}
}

export class BulkRestoreResponseDto {
	@ApiProperty({ description: 'Thao tác thành công', example: true })
	success: boolean

	@ApiProperty({ description: 'Số lượng thẻ đã khôi phục', example: 3 })
	restoredCount: number

	@ApiProperty({ description: 'Số lượng thẻ bị bỏ qua', example: 0 })
	skippedCount: number

	@ApiProperty({ description: 'Thông báo kết quả', example: 'Successfully restored 3 tags' })
	message: string

	@ApiPropertyOptional({
		description: 'Chi tiết thao tác',
		example: {
			successIds: [1, 2, 3],
			skippedIds: [],
			errors: [],
		},
	})
	details?: {
		successIds: number[]
		skippedIds: number[]
		errors?: string[]
	}
}

export class BulkPermanentDeleteResponseDto {
	@ApiProperty({ description: 'Thao tác thành công', example: true })
	success: boolean

	@ApiProperty({ description: 'Số lượng thẻ đã xóa vĩnh viễn', example: 3 })
	deletedCount: number

	@ApiProperty({ description: 'Số lượng thẻ bị bỏ qua', example: 0 })
	skippedCount: number

	@ApiProperty({ description: 'Thông báo kết quả', example: 'Successfully permanently deleted 3 tags' })
	message: string

	@ApiPropertyOptional({
		description: 'Chi tiết thao tác',
		example: {
			successIds: [1, 2, 3],
			skippedIds: [],
			errors: [],
		},
	})
	details?: {
		successIds: number[]
		skippedIds: number[]
		errors?: string[]
	}
}

// =============================================================================
// RESPONSE DTOs
// =============================================================================
export class TagResponseDto {
	@ApiProperty({ description: 'ID thẻ', example: 1 })
	id: number

	@ApiProperty({ description: 'Tên thẻ', example: 'JavaScript' })
	name: string

	@ApiProperty({ description: 'Slug thẻ', example: 'javascript' })
	slug: string

	@ApiPropertyOptional({ description: 'Meta title', example: 'JavaScript - Thẻ' })
	metaTitle?: string

	@ApiPropertyOptional({ description: 'Meta description', example: 'Thẻ về JavaScript...' })
	metaDescription?: string

	@ApiProperty({ description: 'Thời gian tạo', example: '2024-01-01T00:00:00.000Z' })
	createdAt: string

	@ApiProperty({ description: 'Thời gian cập nhật', example: '2024-01-01T00:00:00.000Z' })
	updatedAt: string

	@ApiPropertyOptional({ description: 'Thời gian xóa', example: '2024-01-01T00:00:00.000Z' })
	deletedAt?: string

	@ApiPropertyOptional({ description: 'Số liệu thống kê' })
	_count?: {
		blogs: number
	}
}

export class TagMetaResponseDto {
	@ApiProperty({ description: 'Tổng số thẻ', example: 100 })
	total: number

	@ApiProperty({ description: 'Trang hiện tại', example: 1 })
	page: number

	@ApiProperty({ description: 'Số lượng mỗi trang', example: 10 })
	limit: number

	@ApiProperty({ description: 'Tổng số trang', example: 10 })
	totalPages: number

	@ApiProperty({ description: 'Có trang tiếp theo', example: true })
	hasNext: boolean

	@ApiProperty({ description: 'Có trang trước', example: false })
	hasPrevious: boolean
}

export class TagListResponseDto {
	@ApiProperty({ description: 'Danh sách thẻ', type: [TagResponseDto] })
	data: TagResponseDto[]

	@ApiProperty({ description: 'Thông tin phân trang', type: TagMetaResponseDto })
	meta: TagMetaResponseDto
}

export class TagStatsDto {
	@ApiProperty({ description: 'Tổng số thẻ', example: 100 })
	total: number

	@ApiProperty({ description: 'Số thẻ đã xóa', example: 10 })
	deleted: number

	@ApiProperty({ description: 'Số thẻ trong tháng', example: 5 })
	thisMonth: number

	@ApiProperty({ description: 'Số thẻ trong tuần', example: 2 })
	thisWeek: number

	@ApiProperty({ description: 'Số thẻ hôm nay', example: 1 })
	today: number

	@ApiProperty({ description: 'Thẻ phổ biến nhất', example: 'JavaScript' })
	mostPopular: string
}

export class TagOptionDto {
	@ApiProperty({ description: 'ID thẻ', example: 1 })
	value: number

	@ApiProperty({ description: 'Tên thẻ', example: 'JavaScript' })
	label: string

	@ApiPropertyOptional({ description: 'Slug thẻ', example: 'javascript' })
	slug?: string
} 