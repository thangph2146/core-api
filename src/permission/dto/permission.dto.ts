import {
	IsString,
	IsOptional,
	IsArray,
	IsInt,
	IsBoolean,
	MinLength,
	MaxLength,
	ArrayMinSize,
	Min,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePermissionDto {
	@ApiProperty({
		description: 'Tên permission (định dạng resource:action)',
		example: 'users:read',
		minLength: 2,
		maxLength: 100,
	})
	@IsString()
	@MinLength(2, { message: 'Permission name must be at least 2 characters long' })
	@MaxLength(100, { message: 'Permission name must not exceed 100 characters' })
	name: string;

	@ApiPropertyOptional({
		description: 'Mô tả permission',
		example: 'Quyền đọc thông tin người dùng',
		maxLength: 255,
	})
	@IsOptional()
	@IsString()
	@MaxLength(255, { message: 'Description must not exceed 255 characters' })
	description?: string;

	@ApiPropertyOptional({
		description: 'Meta title cho SEO',
		example: 'Quyền đọc người dùng',
		maxLength: 100,
	})
	@IsOptional()
	@IsString()
	@MaxLength(100, { message: 'Meta title must not exceed 100 characters' })
	metaTitle?: string;

	@ApiPropertyOptional({
		description: 'Meta description cho SEO',
		example: 'Quyền cho phép đọc thông tin người dùng trong hệ thống',
		maxLength: 160,
	})
	@IsOptional()
	@IsString()
	@MaxLength(160, {
		message: 'Meta description must not exceed 160 characters',
	})
	metaDescription?: string;
}

export class UpdatePermissionDto {
	@ApiPropertyOptional({
		description: 'Tên permission (định dạng resource:action)',
		example: 'users:read',
		minLength: 2,
		maxLength: 100,
	})
	@IsOptional()
	@IsString()
	@MinLength(2, { message: 'Permission name must be at least 2 characters long' })
	@MaxLength(100, { message: 'Permission name must not exceed 100 characters' })
	name?: string;

	@ApiPropertyOptional({
		description: 'Mô tả permission',
		example: 'Quyền đọc thông tin người dùng',
		maxLength: 255,
	})
	@IsOptional()
	@IsString()
	@MaxLength(255, { message: 'Description must not exceed 255 characters' })
	description?: string;

	@ApiPropertyOptional({
		description: 'Meta title cho SEO',
		example: 'Quyền đọc người dùng',
		maxLength: 100,
	})
	@IsOptional()
	@IsString()
	@MaxLength(100, { message: 'Meta title must not exceed 100 characters' })
	metaTitle?: string;

	@ApiPropertyOptional({
		description: 'Meta description cho SEO',
		example: 'Quyền cho phép đọc thông tin người dùng trong hệ thống',
		maxLength: 160,
	})
	@IsOptional()
	@IsString()
	@MaxLength(160, {
		message: 'Meta description must not exceed 160 characters',
	})
	metaDescription?: string;
}

export class AdminPermissionQueryDto {
	@ApiPropertyOptional({
		description: 'Số trang',
		example: 1,
		minimum: 1,
		default: 1,
	})
	@IsOptional()
	@IsInt()
	@Transform(({ value }) => value !== undefined && value !== null && value !== '' ? parseInt(value, 10) : undefined)
	page?: number = 1;

	@ApiPropertyOptional({
		description: 'Số lượng item mỗi trang',
		example: 10,
		minimum: 1,
		maximum: 100,
		default: 10,
	})
	@IsOptional()
	@IsInt()
	@Transform(({ value }) => value !== undefined && value !== null && value !== '' ? parseInt(value, 10) : undefined)
	limit?: number = 10;

	@ApiPropertyOptional({
		description: 'Từ khóa tìm kiếm',
		example: 'users',
	})
	@IsOptional()
	@IsString()
	search?: string;

	@ApiPropertyOptional({
		description: 'Trường sắp xếp',
		example: 'createdAt',
		enum: ['id', 'name', 'description', 'createdAt', 'updatedAt', 'deletedAt'],
		default: 'createdAt',
	})
	@IsOptional()
	@IsString()
	sortBy?: string = 'createdAt';

	@ApiPropertyOptional({
		description: 'Thứ tự sắp xếp',
		example: 'desc',
		enum: ['asc', 'desc'],
		default: 'desc',
	})
	@IsOptional()
	@IsString()
	sortOrder?: 'asc' | 'desc' = 'desc';

	@ApiPropertyOptional({
		description: 'Bao gồm cả item đã xóa',
		example: false,
		default: false,
	})
	@IsOptional()
	@IsBoolean()
	@Transform(({ value }) => value === 'true')
	includeDeleted?: boolean = false;

	@ApiPropertyOptional({
		description: 'Chỉ lấy item đã xóa',
		example: false,
		default: false,
	})
	@IsOptional()
	@IsBoolean()
	@Transform(({ value }) => value === 'true')
	deleted?: boolean = false;
}

// Public query DTO (không có deleted options)
export class PermissionQueryDto {
	@ApiPropertyOptional({
		description: 'Số trang',
		example: 1,
		minimum: 1,
		default: 1,
	})
	@IsOptional()
	@IsInt()
	@Transform(({ value }) => value !== undefined && value !== null && value !== '' ? parseInt(value, 10) : undefined)
	page?: number = 1;

	@ApiPropertyOptional({
		description: 'Số lượng item mỗi trang',
		example: 10,
		minimum: 1,
		maximum: 100,
		default: 10,
	})
	@IsOptional()
	@IsInt()
	@Transform(({ value }) => value !== undefined && value !== null && value !== '' ? parseInt(value, 10) : undefined)
	limit?: number = 10;

	@ApiPropertyOptional({
		description: 'Từ khóa tìm kiếm',
		example: 'users',
	})
	@IsOptional()
	@IsString()
	search?: string;

	@ApiPropertyOptional({
		description: 'Trường sắp xếp',
		example: 'createdAt',
		enum: ['id', 'name', 'description', 'createdAt', 'updatedAt'],
		default: 'createdAt',
	})
	@IsOptional()
	@IsString()
	sortBy?: string = 'createdAt';

	@ApiPropertyOptional({
		description: 'Thứ tự sắp xếp',
		example: 'desc',
		enum: ['asc', 'desc'],
		default: 'desc',
	})
	@IsOptional()
	@IsString()
	sortOrder?: 'asc' | 'desc' = 'desc';
}

export class PermissionResponseDto {
	@ApiProperty({ description: 'ID permission', example: 1 })
	id: number;

	@ApiProperty({ description: 'Tên permission', example: 'users:read' })
	name: string;

	@ApiProperty({ description: 'Mô tả permission', example: 'Quyền đọc thông tin người dùng' })
	description?: string;

	@ApiProperty({ description: 'Ngày tạo', example: '2023-01-01T00:00:00.000Z' })
	createdAt: Date;

	@ApiProperty({ description: 'Ngày cập nhật', example: '2023-01-01T00:00:00.000Z' })
	updatedAt: Date;

	@ApiProperty({ description: 'Ngày xóa', example: null, nullable: true })
	deletedAt?: Date;

	@ApiProperty({ description: 'Meta title', example: 'Quyền đọc người dùng' })
	metaTitle?: string;

	@ApiProperty({ description: 'Meta description', example: 'Quyền cho phép đọc thông tin người dùng trong hệ thống' })
	metaDescription?: string;
}

export class PermissionOptionDto {
	@ApiProperty({ description: 'Giá trị option', example: 1 })
	value: number;

	@ApiProperty({ description: 'Nhãn hiển thị', example: 'Quyền đọc người dùng' })
	label: string;
}

export class PermissionGroupDto {
	@ApiProperty({ description: 'Tên nhóm', example: 'users' })
	group: string;

	@ApiProperty({ description: 'Danh sách options', type: [PermissionOptionDto] })
	options: PermissionOptionDto[];
}

export class BulkPermissionOperationDto {
	@ApiProperty({
		description: 'Danh sách ID permissions',
		example: [1, 2, 3],
		type: [Number],
		minItems: 1,
	})
	@IsArray()
	@ArrayMinSize(1, { message: 'permissionIds array cannot be empty' })
	@IsInt({ each: true, message: 'Each permission ID must be a positive integer' })
	@Min(1, { each: true, message: 'Each permission ID must be a positive integer' })
	@Transform(({ value }) => {
		if (!Array.isArray(value)) {
			return value; // Let class-validator handle the error
		}

		return value.map((id) => {
			const num = typeof id === 'string' ? parseInt(id, 10) : Number(id);
			return isNaN(num) ? id : num; // Let class-validator handle validation
		});
	})
	permissionIds: number[];
}

export class PermissionStatsDto {
	@ApiProperty({ description: 'Tổng số permissions', example: 50 })
	totalPermissions: number;

	@ApiProperty({ description: 'Số permissions đang hoạt động', example: 45 })
	activePermissions: number;

	@ApiProperty({ description: 'Số permissions đã xóa', example: 5 })
	deletedPermissions: number;
}

// Bulk operation response DTOs
export class BulkDeleteResponseDto {
	@ApiProperty({ description: 'Trạng thái thành công', example: true })
	success: boolean;

	@ApiProperty({ description: 'Số lượng đã xóa', example: 3 })
	deletedCount: number;

	@ApiProperty({ description: 'Số lượng bỏ qua', example: 1 })
	skippedCount: number;

	@ApiProperty({ description: 'Thông báo', example: 'Đã xóa 3 permissions thành công' })
	message: string;

	@ApiProperty({ description: 'Chi tiết thao tác', required: false })
	details?: {
		deletedIds: number[];
		skippedIds: number[];
		errors?: string[];
	};
}

export class BulkRestoreResponseDto {
	@ApiProperty({ description: 'Trạng thái thành công', example: true })
	success: boolean;

	@ApiProperty({ description: 'Số lượng đã khôi phục', example: 3 })
	restoredCount: number;

	@ApiProperty({ description: 'Số lượng bỏ qua', example: 1 })
	skippedCount: number;

	@ApiProperty({ description: 'Thông báo', example: 'Đã khôi phục 3 permissions thành công' })
	message: string;

	@ApiProperty({ description: 'Chi tiết thao tác', required: false })
	details?: {
		restoredIds: number[];
		skippedIds: number[];
		errors?: string[];
	};
}

export class BulkPermanentDeleteResponseDto {
	@ApiProperty({ description: 'Trạng thái thành công', example: true })
	success: boolean;

	@ApiProperty({ description: 'Số lượng đã xóa vĩnh viễn', example: 3 })
	deletedCount: number;

	@ApiProperty({ description: 'Số lượng bỏ qua', example: 1 })
	skippedCount: number;

	@ApiProperty({ description: 'Thông báo', example: 'Đã xóa vĩnh viễn 3 permissions thành công' })
	message: string;

	@ApiProperty({ description: 'Chi tiết thao tác', required: false })
	details?: {
		deletedIds: number[];
		skippedIds: number[];
		errors?: string[];
	};
}

export class PermissionListResponseDto {
	@ApiProperty({ description: 'Danh sách permissions', type: [PermissionResponseDto] })
	data: PermissionResponseDto[];

	@ApiProperty({ description: 'Thông tin phân trang' })
	meta: {
		total: number;
		page: number;
		limit: number;
		totalPages: number;
		hasNextPage: boolean;
		hasPrevPage: boolean;
	};
}
