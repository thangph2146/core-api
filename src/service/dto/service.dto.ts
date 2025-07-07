import { IsString, IsOptional, IsInt, Min, IsIn, IsNotEmpty, IsBoolean, IsNumber } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class ServiceDto {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  content: string | null;
  icon: string | null;
  image: string | null;
  isPublished: boolean;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  price: number | null;
  duration: string | null;
  statusId: number | null;
  categoryId: number | null;
  featuredImageId: number | null;
}

export class CreateServiceDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  slug?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsOptional()
  content?: any;

  @IsOptional()
  @IsNumber()
  price?: number;

  @IsOptional()
  @IsString()
  duration?: string;

  @IsOptional()
  @IsInt()
  statusId?: number;

  @IsOptional()
  @IsInt()
  categoryId?: number;

  @IsOptional()
  @IsInt()
  featuredImageId?: number;
}

export class UpdateServiceDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  slug?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsOptional()
  content?: any;

  @IsOptional()
  @IsNumber()
  price?: number;

  @IsOptional()
  @IsString()
  duration?: string;

  @IsOptional()
  @IsInt()
  statusId?: number;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean; // This will be handled in the service to set publishedAt

  @IsOptional()
  @IsInt()
  categoryId?: number;

  @IsOptional()
  @IsInt()
  featuredImageId?: number;
}

export class ServiceQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}

export class AdminServiceQueryDto extends ServiceQueryDto {
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  isPublished?: boolean;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  deleted?: boolean;
}
