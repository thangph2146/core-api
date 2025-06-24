import {
  IsString,
  IsOptional,
  IsArray,
  IsInt,
  IsBoolean,
  IsNumber,
  MinLength,
  MaxLength,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class CreateRoleDto {
  @IsString()
  @MinLength(2, { message: 'Role name must be at least 2 characters long' })
  @MaxLength(50, { message: 'Role name must not exceed 50 characters' })
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(255, { message: 'Description must not exceed 255 characters' })
  description?: string;

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  permissionIds?: number[];

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

export class UpdateRoleDto {
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Role name must be at least 2 characters long' })
  @MaxLength(50, { message: 'Role name must not exceed 50 characters' })
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255, { message: 'Description must not exceed 255 characters' })
  description?: string;

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  permissionIds?: number[];

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

export class RoleQueryDto {
  @IsOptional()
  @IsInt()
  @Transform(({ value }) => parseInt(value))
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Transform(({ value }) => parseInt(value))
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

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  includePermissions?: boolean = true;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  includeUserCount?: boolean = true;
}

export class RoleResponseDto {
  id: number;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  metaTitle?: string;
  metaDescription?: string;
  permissions?: any[];
  _count?: {
    users: number;
  };
}

export class RoleOptionDto {
  value: number;
  label: string;
}

export class BulkRoleOperationDto {
  @IsArray()
  @IsInt({ each: true })
  @Transform(({ value }) =>
    Array.isArray(value)
      ? value.map((id) => (typeof id === 'string' ? parseInt(id, 10) : id))
      : [],
  )
  roleIds: number[];
}

export class RoleStatsDto {
  totalRoles: number;
  activeRoles: number;
  deletedRoles: number;
  rolesWithUsers: number;
  rolesWithoutUsers: number;
}
