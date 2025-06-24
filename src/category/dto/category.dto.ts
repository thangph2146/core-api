import { IsString, IsOptional, IsInt, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { IsBoolean } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  name: string;

  @IsString()
  slug: string;

  @IsString()
  type: string; // e.g., 'BLOG', 'PROJECT', 'SERVICE'

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  parentId?: number;

  @IsOptional()
  @IsString()
  metaTitle?: string;

  @IsOptional()
  @MaxLength(160, {
    message: 'Meta description must not exceed 160 characters',
  })
  metaDescription?: string;
}

export class UpdateCategoryDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  parentId?: number;

  @IsOptional()
  @IsString()
  metaTitle?: string;

  @IsOptional()
  @MaxLength(160, {
    message: 'Meta description must not exceed 160 characters',
  })
  metaDescription?: string;
}

export class CategoryQueryDto {
  @IsOptional()
  @IsInt()
  @Transform(({ value }) => parseInt(value, 10))
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Transform(({ value }) => parseInt(value, 10))
  limit?: number = 10;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  deleted?: boolean = false;
}

export class CategoryOptionDto {
  value: number
  label: string
  type: string
} 