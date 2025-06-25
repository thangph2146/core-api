import {
	IsString,
	IsOptional,
	MaxLength,
	IsInt,
	IsBoolean,
	Min,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreatePermissionDto {
	@IsString()
	@MaxLength(100)
	name: string;

	@IsOptional()
	@IsString()
	@MaxLength(255)
	description?: string;

	@IsOptional()
	@IsString()
	@MaxLength(100)
	metaTitle?: string;

	@IsOptional()
	@IsString()
	@MaxLength(160)
	metaDescription?: string;
}

export class UpdatePermissionDto {
	@IsOptional()
	@IsString()
	@MaxLength(100)
	name?: string;

	@IsOptional()
	@IsString()
	@MaxLength(255)
	description?: string;

	@IsOptional()
	@IsString()
	@MaxLength(100)
	metaTitle?: string;

	@IsOptional()
	@IsString()
	@MaxLength(160)
	metaDescription?: string;
}

export class PermissionQueryDto {
	@IsOptional()
	@IsInt()
	@Min(1)
	@Transform(({ value }) => value !== undefined && value !== null && value !== '' ? parseInt(value, 10) : undefined)
	page?: number = 1;

	@IsOptional()
	@IsInt()
	@Min(1)
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

export class PermissionStatsDto {
	total: number;
	active: number;
	deleted: number;
}
