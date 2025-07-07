import { IsString, IsOptional, IsNumber, IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';

export enum StatusType {
  BLOG = 'blog',
  RECRUITMENT = 'recruitment',
  SERVICE = 'service',
  JOB_APPLICATION = 'job_application',
}

export class CreateStatusDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(StatusType)
  type: StatusType;

  @IsOptional()
  @IsString()
  metaTitle?: string;

  @IsOptional()
  @IsString()
  metaDescription?: string;
}

export class UpdateStatusDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(StatusType)
  type?: StatusType;

  @IsOptional()
  @IsString()
  metaTitle?: string;

  @IsOptional()
  @IsString()
  metaDescription?: string;
}

export class StatusQueryDto {
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value, 10))
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value, 10))
  limit?: number = 10;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(StatusType)
  type?: StatusType;

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';
}

export class AdminStatusQueryDto extends StatusQueryDto {
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  showDeleted?: boolean = false;
}
