import {
	IsString,
	IsOptional,
	MaxLength,
	IsInt,
	IsBoolean,
	Min,
	MinLength,
	IsArray,
	ArrayMinSize,
	IsPositive,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// =============================================================================
// DOCUMENTATION
// =============================================================================
/**
 * @file permission.dto.ts
 * @description This file contains all Data Transfer Objects (DTOs) for the Permission module.
 * These DTOs are used for:
 * - Validating incoming request bodies (`CreatePermissionDto`, `UpdatePermissionDto`, etc.)
 * - Typing query parameters (`PermissionQueryDto`)
 * - Shaping responses sent back to the client (`PermissionResponseDto`, `PermissionListResponseDto`, etc.)
 *
 * The DTOs leverage `class-validator` for robust validation and `class-transformer` for
 * transforming incoming data into the correct types. Swagger decorators (`@ApiProperty`)
 * are used to generate comprehensive API documentation.
 *
 * @version 1.0.0
 * @author PHGroup Development Team
 */

// =============================================================================
// ENUMS & CONSTANTS
// =============================================================================
export enum PermissionSortBy {
	ID = 'id',
	NAME = 'name',
	DESCRIPTION = 'description',
	CREATED_AT = 'createdAt',
	UPDATED_AT = 'updatedAt',
	DELETED_AT = 'deletedAt',
}

export enum SortOrder {
	ASC = 'asc',
	DESC = 'desc',
}

// =============================================================================
// CREATE & UPDATE DTOs
// =============================================================================
export class CreatePermissionDto {
	@ApiProperty({
		description: 'Tên permission (định dạng: resource:action)',
		example: 'users:create',
		minLength: 2,
		maxLength: 100,
	})
	@IsString({ message: 'Tên permission là bắt buộc và phải là chuỗi ký tự' })
	@MinLength(2, { message: 'Tên permission phải có ít nhất 2 ký tự' })
	@MaxLength(100, { message: 'Tên permission không được vượt quá 100 ký tự' })
	@Transform(({ value }) => value?.trim())
	name: string;

	@ApiPropertyOptional({
		description: 'Mô tả chi tiết về permission',
		example: 'Quyền tạo mới người dùng trong hệ thống',
		maxLength: 255,
	})
	@IsOptional()
	@IsString({ message: 'Mô tả phải là chuỗi ký tự' })
	@MaxLength(255, { message: 'Mô tả không được vượt quá 255 ký tự' })
	@Transform(({ value }) => value?.trim() || null)
	description?: string;

	@ApiPropertyOptional({
		description: 'Meta title cho SEO',
		example: 'Permission: users:create',
		maxLength: 100,
	})
	@IsOptional()
	@IsString({ message: 'Meta title phải là chuỗi ký tự' })
	@MaxLength(100, { message: 'Meta title không được vượt quá 100 ký tự' })
	@Transform(({ value }) => value?.trim() || null)
	metaTitle?: string;

	@ApiPropertyOptional({
		description: 'Meta description cho SEO',
		example: 'Quyền tạo mới người dùng trong hệ thống quản lý',
		maxLength: 160,
	})
	@IsOptional()
	@IsString({ message: 'Meta description phải là chuỗi ký tự' })
	@MaxLength(160, { message: 'Meta description không được vượt quá 160 ký tự' })
	@Transform(({ value }) => value?.trim() || null)
	metaDescription?: string;
}

export class UpdatePermissionDto {
	@ApiPropertyOptional({
		description: 'Tên permission (định dạng: resource:action)',
		example: 'users:update',
		minLength: 2,
		maxLength: 100,
	})
	@IsOptional()
	@IsString({ message: 'Tên permission phải là chuỗi ký tự' })
	@MinLength(2, { message: 'Tên permission phải có ít nhất 2 ký tự' })
	@MaxLength(100, { message: 'Tên permission không được vượt quá 100 ký tự' })
	@Transform(({ value }) => value?.trim())
	name?: string;

	@ApiPropertyOptional({
		description: 'Mô tả chi tiết về permission',
		example: 'Quyền cập nhật thông tin người dùng',
		maxLength: 255,
	})
	@IsOptional()
	@IsString({ message: 'Mô tả phải là chuỗi ký tự' })
	@MaxLength(255, { message: 'Mô tả không được vượt quá 255 ký tự' })
	@Transform(({ value }) => value?.trim() || null)
	description?: string;

	@ApiPropertyOptional({
		description: 'Meta title cho SEO',
		maxLength: 100,
	})
	@IsOptional()
	@IsString({ message: 'Meta title phải là chuỗi ký tự' })
	@MaxLength(100, { message: 'Meta title không được vượt quá 100 ký tự' })
	@Transform(({ value }) => value?.trim() || null)
	metaTitle?: string;

	@ApiPropertyOptional({
		description: 'Meta description cho SEO',
		maxLength: 160,
	})
	@IsOptional()
	@IsString({ message: 'Meta description phải là chuỗi ký tự' })
	@MaxLength(160, { message: 'Meta description không được vượt quá 160 ký tự' })
	@Transform(({ value }) => value?.trim() || null)
	metaDescription?: string;
}

// =============================================================================
// QUERY & FILTER DTOs
// =============================================================================
export class PermissionQueryDto {
	@ApiPropertyOptional({
		description: 'Số trang (bắt đầu từ 1)',
		example: 1,
		minimum: 1,
		default: 1,
	})
	@IsOptional()
	@IsInt({ message: 'Số trang phải là số nguyên' })
	@Min(1, { message: 'Số trang phải lớn hơn 0' })
	@Transform(({ value }) => value !== undefined && value !== null && value !== '' ? parseInt(value, 10) : 1)
	@Type(() => Number)
	page?: number = 1;

	@ApiPropertyOptional({
		description: 'Số lượng bản ghi trên mỗi trang',
		example: 10,
		minimum: 1,
		maximum: 100,
		default: 10,
	})
	@IsOptional()
	@IsInt({ message: 'Limit phải là số nguyên' })
	@Min(1, { message: 'Limit phải lớn hơn 0' })
	@Transform(({ value }) => value !== undefined && value !== null && value !== '' ? parseInt(value, 10) : 10)
	@Type(() => Number)
	limit?: number = 10;

	@ApiPropertyOptional({
		description: 'Từ khóa tìm kiếm (tìm trong name, description)',
		example: 'users',
	})
	@IsOptional()
	@IsString({ message: 'Từ khóa tìm kiếm phải là chuỗi ký tự' })
	@Transform(({ value }) => value?.trim())
	search?: string;

	@ApiPropertyOptional({
		description: 'Trường để sắp xếp',
		enum: PermissionSortBy,
		example: PermissionSortBy.CREATED_AT,
		default: PermissionSortBy.CREATED_AT,
	})
	@IsOptional()
	@IsString({ message: 'Sort by phải là chuỗi ký tự' })
	sortBy?: string = PermissionSortBy.CREATED_AT;

	@ApiPropertyOptional({
		description: 'Thứ tự sắp xếp',
		enum: SortOrder,
		example: SortOrder.DESC,
		default: SortOrder.DESC,
	})
	@IsOptional()
	@IsString({ message: 'Sort order phải là chuỗi ký tự' })
	sortOrder?: 'asc' | 'desc' = SortOrder.DESC;

	@ApiPropertyOptional({
		description: 'Bao gồm cả các permission đã xóa',
		example: false,
		default: false,
	})
	@IsOptional()
	@IsBoolean({ message: 'Include deleted phải là boolean' })
	@Transform(({ value }) => value === 'true' || value === true)
	includeDeleted?: boolean = false;

	@ApiPropertyOptional({
		description: 'Chỉ lấy các permission đã xóa',
		example: false,
		default: false,
	})
	@IsOptional()
	@IsBoolean({ message: 'Deleted phải là boolean' })
	@Transform(({ value }) => value === 'true' || value === true)
	deleted?: boolean = false;
}

// =============================================================================
// RESPONSE DTOs
// =============================================================================
export class PermissionResponseDto {
	@ApiProperty({ description: 'ID permission' })
	id: number;

	@ApiProperty({ description: 'Tên permission' })
	name: string;

	@ApiPropertyOptional({ description: 'Mô tả permission' })
	description?: string | null;

	@ApiProperty({ description: 'Ngày tạo' })
	createdAt: Date;

	@ApiProperty({ description: 'Ngày cập nhật cuối' })
	updatedAt: Date;

	@ApiPropertyOptional({ description: 'Ngày xóa (soft delete)' })
	deletedAt?: Date | null;

	@ApiPropertyOptional({ description: 'Meta title' })
	metaTitle?: string | null;

	@ApiPropertyOptional({ description: 'Meta description' })
	metaDescription?: string | null;
}

export class PermissionListResponseDto {
	@ApiProperty({ description: 'Trạng thái thành công' })
	success: boolean;

	@ApiProperty({ 
		description: 'Danh sách permissions',
		type: [PermissionResponseDto],
	})
	data: PermissionResponseDto[];

	@ApiProperty({ description: 'Metadata phân trang' })
	meta: {
		total: number;
		page: number;
		limit: number;
		totalPages: number;
		hasNextPage: boolean;
		hasPrevPage: boolean;
	};
}

export class PermissionOptionDto {
	@ApiProperty({ description: 'ID permission (value)' })
	value: number;

	@ApiProperty({ description: 'Tên permission (label)' })
	label: string;
}

export class PermissionGroupDto {
	@ApiProperty({ description: 'Tên nhóm' })
	group: string;

	@ApiProperty({ 
		description: 'Danh sách options trong nhóm',
		type: [PermissionOptionDto],
	})
	options: PermissionOptionDto[];
}

// =============================================================================
// STATISTICS DTOs
// =============================================================================
export class PermissionStatsDto {
	@ApiProperty({ description: 'Tổng số permissions' })
	total: number;

	@ApiProperty({ description: 'Số permissions đang hoạt động' })
	active: number;

	@ApiProperty({ description: 'Số permissions đã xóa' })
	deleted: number;
}

// =============================================================================
// BULK OPERATION DTOs
// =============================================================================
export class BulkPermissionOperationDto {
	@ApiProperty({
		description: 'Danh sách ID permissions cần thao tác',
		example: [1, 2, 3],
		type: [Number],
	})
	@IsArray({ message: 'Permission IDs phải là mảng' })
	@ArrayMinSize(1, { message: 'Phải có ít nhất 1 permission ID' })
	@IsInt({ each: true, message: 'Mỗi permission ID phải là số nguyên' })
	@IsPositive({ each: true, message: 'Mỗi permission ID phải lớn hơn 0' })
	permissionIds: number[];
}

export class BulkDeleteResponseDto {
	@ApiProperty({ description: 'Số lượng đã xóa thành công' })
	deletedCount: number;

	@ApiProperty({ description: 'Danh sách ID đã xóa' })
	deletedIds: number[];

	@ApiProperty({ description: 'Danh sách ID bị lỗi' })
	failedIds: number[];

	@ApiProperty({ description: 'Thông báo' })
	message: string;
}

export class BulkRestoreResponseDto {
	@ApiProperty({ description: 'Số lượng đã khôi phục thành công' })
	restoredCount: number;

	@ApiProperty({ description: 'Danh sách ID đã khôi phục' })
	restoredIds: number[];

	@ApiProperty({ description: 'Danh sách ID bị lỗi' })
	failedIds: number[];

	@ApiProperty({ description: 'Thông báo' })
	message: string;
}
