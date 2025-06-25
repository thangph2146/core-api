import {
	IsString,
	IsOptional,
	MinLength,
	MaxLength,
	IsInt,
	IsBoolean,
} from 'class-validator'
import { Transform } from 'class-transformer'

export class CreateTagDto {
	@IsString()
	@MinLength(1)
	@MaxLength(100)
	name: string

	@IsString()
	@MinLength(1)
	@MaxLength(100)
	slug: string

	@IsOptional()
	@IsString()
	@MaxLength(100)
	metaTitle?: string

	@IsOptional()
	@IsString()
	@MaxLength(160)
	metaDescription?: string
}

export class UpdateTagDto {
	@IsOptional()
	@IsString()
	@MinLength(1)
	@MaxLength(100)
	name?: string

	@IsOptional()
	@IsString()
	@MinLength(1)
	@MaxLength(100)
	slug?: string

	@IsOptional()
	@IsString()
	@MaxLength(100)
	metaTitle?: string

	@IsOptional()
	@IsString()
	@MaxLength(160)
	metaDescription?: string
}

export class TagQueryDto {
	@IsOptional()
	@IsInt()
	@Transform(({ value }) => value !== undefined && value !== null && value !== '' ? parseInt(value, 10) : undefined)
	page?: number = 1

	@IsOptional()
	@IsInt()
	@Transform(({ value }) => value !== undefined && value !== null && value !== '' ? parseInt(value, 10) : undefined)
	limit?: number = 10

	@IsOptional()
	@IsString()
	search?: string

	@IsOptional()
	@IsBoolean()
	@Transform(({ value }) => value === 'true')
	deleted?: boolean = false
}

export class TagOptionDto {
	value: number
	label: string
} 