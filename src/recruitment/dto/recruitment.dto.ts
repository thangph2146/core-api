import { PartialType } from '@nestjs/mapped-types';
import { IsString, IsOptional, IsInt, IsDateString, IsJSON, IsBoolean } from 'class-validator';

export class CreateRecruitmentDto {
  @IsString()
  title: string;

  @IsString()
  slug: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsJSON()
  content: any;

  @IsString()
  @IsOptional()
  location?: string;

  @IsString()
  @IsOptional()
  salary?: string;

  @IsString()
  @IsOptional()
  jobType?: string;

  @IsString()
  @IsOptional()
  experienceLevel?: string;

  @IsJSON()
  @IsOptional()
  skillsRequired?: any;

  @IsDateString()
  @IsOptional()
  deadline?: Date;

  @IsInt()
  @IsOptional()
  statusId?: number;

  @IsDateString()
  @IsOptional()
  publishedAt?: Date;

  @IsInt()
  authorId: number;

  @IsInt()
  @IsOptional()
  categoryId?: number;

  @IsString()
  @IsOptional()
  metaTitle?: string;

  @IsString()
  @IsOptional()
  metaDescription?: string;
}

export class UpdateRecruitmentDto extends PartialType(CreateRecruitmentDto) {}

export class AdminRecruitmentQueryDto {
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
  isPublished?: boolean;

  @IsOptional()
  @IsBoolean()
  deleted?: boolean;
}
