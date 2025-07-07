import { PartialType } from '@nestjs/mapped-types';
import { IsString, IsOptional, IsInt, IsUrl, IsBoolean } from 'class-validator';

export class CreateMediaDto {
  @IsString()
  fileName: string;

  @IsString()
  fileType: string;

  @IsInt()
  size: number;

  @IsUrl()
  @IsOptional()
  url?: string;

  @IsString()
  @IsOptional()
  altText?: string;

  @IsString()
  @IsOptional()
  caption?: string;

  @IsInt()
  @IsOptional()
  uploadedById?: number;

  @IsString()
  @IsOptional()
  metaTitle?: string;

  @IsString()
  @IsOptional()
  metaDescription?: string;
}

export class UpdateMediaDto extends PartialType(CreateMediaDto) {}

export class AdminMediaQueryDto {
  @IsOptional()
  @IsInt()
  page?: number;

  @IsOptional()
  @IsInt()
  limit?: number;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';

  @IsOptional()
  @IsBoolean()
  deleted?: boolean;
}
