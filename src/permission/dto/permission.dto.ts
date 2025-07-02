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

export class CreatePermissionDto {
	@IsString()
	@MinLength(2, { message: 'Permission name must be at least 2 characters long' })
	@MaxLength(100, { message: 'Permission name must not exceed 100 characters' })
	name: string;

	@IsOptional()
	@IsString()
	@MaxLength(255, { message: 'Description must not exceed 255 characters' })
	description?: string;

	@IsOptional()
	@IsString()
	@MaxLength(100, { message: 'Meta title must not exceed 100 characters' })
	metaTitle?: string;

	@IsOptional()
	@IsString()
	@MaxLength(160, {
		message: 'Meta description must not exceed 160 characters',
	})
	metaDescription?: string;
}

export class UpdatePermissionDto {
	@IsOptional()
	@IsString()
	@MinLength(2, { message: 'Permission name must be at least 2 characters long' })
	@MaxLength(100, { message: 'Permission name must not exceed 100 characters' })
	name?: string;

	@IsOptional()
	@IsString()
	@MaxLength(255, { message: 'Description must not exceed 255 characters' })
	description?: string;

	@IsOptional()
	@IsString()
	@MaxLength(100, { message: 'Meta title must not exceed 100 characters' })
	metaTitle?: string;

	@IsOptional()
	@IsString()
	@MaxLength(160, {
		message: 'Meta description must not exceed 160 characters',
	})
	metaDescription?: string;
}

export class PermissionQueryDto {
	@IsOptional()
	@IsInt()
	@Transform(({ value }) => value !== undefined && value !== null && value !== '' ? parseInt(value, 10) : undefined)
	page?: number = 1;

	@IsOptional()
	@IsInt()
	@Transform(({ value }) => value !== undefined && value !== null && value !== '' ? parseInt(value, 10) : undefined)
	limit?: number = 10;

	@IsOptional()
	@IsString()
	search?: string;

	@IsOptional()
	@IsString()
	sortBy?: string = 'createdAt';

	@IsOptional()
	@IsString()
	sortOrder?: 'asc' | 'desc' = 'desc';

	@IsOptional()
	@IsBoolean()
	@Transform(({ value }) => value === 'true')
	includeDeleted?: boolean = false;

	@IsOptional()
	@IsBoolean()
	@Transform(({ value }) => value === 'true')
	deleted?: boolean = false;
}

export class PermissionResponseDto {
	id: number;
	name: string;
	description?: string;
	createdAt: Date;
	updatedAt: Date;
	deletedAt?: Date;
	metaTitle?: string;
	metaDescription?: string;
}

export class PermissionOptionDto {
	value: number;
	label: string;
}

export class PermissionGroupDto {
	group: string;
	options: PermissionOptionDto[];
}

export class BulkPermissionOperationDto {
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
	totalPermissions: number;
	activePermissions: number;
	deletedPermissions: number;
}

// Bulk operation response DTOs
export class BulkDeleteResponseDto {
	success: boolean;
	deletedCount: number;
	skippedCount: number;
	message: string;
	details?: {
		deletedIds: number[];
		skippedIds: number[];
		errors?: string[];
	};
}

export class BulkRestoreResponseDto {
	success: boolean;
	restoredCount: number;
	skippedCount: number;
	message: string;
	details?: {
		restoredIds: number[];
		skippedIds: number[];
		errors?: string[];
	};
}

export class BulkPermanentDeleteResponseDto {
	success: boolean;
	deletedCount: number;
	skippedCount: number;
	message: string;
	details?: {
		deletedIds: number[];
		skippedIds: number[];
		errors?: string[];
	};
}

export class PermissionListResponseDto {
	data: PermissionResponseDto[];
	meta: {
		total: number;
		page: number;
		limit: number;
		totalPages: number;
		hasNextPage: boolean;
		hasPrevPage: boolean;
	};
}
