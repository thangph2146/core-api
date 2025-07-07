import {
  IsString,
  IsOptional,
  IsArray,
  IsInt,
  IsBoolean,
  IsNumber,
  MinLength,
  MaxLength,
  ArrayMinSize,
  Min,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRoleDto {
  @ApiProperty({
    description: 'Tên vai trò',
    example: 'Admin',
    minLength: 2,
    maxLength: 50,
  })
  @IsString()
  @MinLength(2, { message: 'Role name must be at least 2 characters long' })
  @MaxLength(50, { message: 'Role name must not exceed 50 characters' })
  name: string;

  @ApiPropertyOptional({
    description: 'Mô tả vai trò',
    example: 'Quản trị viên hệ thống',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255, { message: 'Description must not exceed 255 characters' })
  description?: string;

  @ApiPropertyOptional({
    description: 'Danh sách ID quyền',
    example: [1, 2, 3],
    type: [Number],
  })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  permissionIds?: number[];

  @ApiPropertyOptional({
    description: 'Meta title cho SEO',
    example: 'Vai trò Admin',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Meta title must not exceed 100 characters' })
  metaTitle?: string;

  @ApiPropertyOptional({
    description: 'Meta description cho SEO',
    example: 'Vai trò quản trị viên với quyền cao nhất trong hệ thống',
    maxLength: 160,
  })
  @IsOptional()
  @IsString()
  @MaxLength(160, {
    message: 'Meta description must not exceed 160 characters',
  })
  metaDescription?: string;
}

export class UpdateRoleDto {
  @ApiPropertyOptional({
    description: 'Tên vai trò',
    example: 'Admin',
    minLength: 2,
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Role name must be at least 2 characters long' })
  @MaxLength(50, { message: 'Role name must not exceed 50 characters' })
  name?: string;

  @ApiPropertyOptional({
    description: 'Mô tả vai trò',
    example: 'Quản trị viên hệ thống',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255, { message: 'Description must not exceed 255 characters' })
  description?: string;

  @ApiPropertyOptional({
    description: 'Danh sách ID quyền',
    example: [1, 2, 3],
    type: [Number],
  })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  permissionIds?: number[];

  @ApiPropertyOptional({
    description: 'Meta title cho SEO',
    example: 'Vai trò Admin',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Meta title must not exceed 100 characters' })
  metaTitle?: string;

  @ApiPropertyOptional({
    description: 'Meta description cho SEO',
    example: 'Vai trò quản trị viên với quyền cao nhất trong hệ thống',
    maxLength: 160,
  })
  @IsOptional()
  @IsString()
  @MaxLength(160, {
    message: 'Meta description must not exceed 160 characters',
  })
  metaDescription?: string;
}

export class AdminRoleQueryDto {
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
    example: 'admin',
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

  @ApiPropertyOptional({
    description: 'Bao gồm thông tin permissions',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  includePermissions?: boolean = true;

  @ApiPropertyOptional({
    description: 'Bao gồm số lượng users',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  includeUserCount?: boolean = true;
}

// Public query DTO (không có deleted options)
export class RoleQueryDto {
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
    example: 'admin',
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

  @ApiPropertyOptional({
    description: 'Bao gồm thông tin permissions',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  includePermissions?: boolean = true;

  @ApiPropertyOptional({
    description: 'Bao gồm số lượng users',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  includeUserCount?: boolean = true;
}

export class RoleResponseDto {
  @ApiProperty({ description: 'ID vai trò', example: 1 })
  id: number;

  @ApiProperty({ description: 'Tên vai trò', example: 'Admin' })
  name: string;

  @ApiProperty({ description: 'Mô tả vai trò', example: 'Quản trị viên hệ thống' })
  description?: string;

  @ApiProperty({ description: 'Ngày tạo', example: '2023-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ description: 'Ngày cập nhật', example: '2023-01-01T00:00:00.000Z' })
  updatedAt: Date;

  @ApiProperty({ description: 'Ngày xóa', example: null, nullable: true })
  deletedAt?: Date;

  @ApiProperty({ description: 'Meta title', example: 'Vai trò Admin' })
  metaTitle?: string;

  @ApiProperty({ description: 'Meta description', example: 'Vai trò quản trị viên với quyền cao nhất trong hệ thống' })
  metaDescription?: string;

  @ApiProperty({ description: 'Danh sách permissions', required: false })
  permissions?: any[];

  @ApiProperty({ description: 'Thống kê số lượng', required: false })
  _count?: {
    users: number;
  };
}

export class RoleOptionDto {
  @ApiProperty({ description: 'Giá trị option', example: 1 })
  value: number;

  @ApiProperty({ description: 'Nhãn hiển thị', example: 'Admin' })
  label: string;
}

export class BulkRoleOperationDto {
  @ApiProperty({
    description: 'Danh sách ID vai trò',
    example: [1, 2, 3],
    type: [Number],
    minItems: 1,
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'roleIds array cannot be empty' })
  @IsInt({ each: true, message: 'Each role ID must be a positive integer' })
  @Min(1, { each: true, message: 'Each role ID must be a positive integer' })
  @Transform(({ value }) => {
    if (!Array.isArray(value)) {
      return value; // Let class-validator handle the error
    }

    return value.map((id) => {
      const num = typeof id === 'string' ? parseInt(id, 10) : Number(id);
      return isNaN(num) ? id : num; // Let class-validator handle validation
    });
  })
  roleIds: number[];
}

export class RoleStatsDto {
  @ApiProperty({ description: 'Tổng số vai trò', example: 10 })
  totalRoles: number;

  @ApiProperty({ description: 'Số vai trò đang hoạt động', example: 8 })
  activeRoles: number;

  @ApiProperty({ description: 'Số vai trò đã xóa', example: 2 })
  deletedRoles: number;

  @ApiProperty({ description: 'Số vai trò có users', example: 6 })
  rolesWithUsers: number;

  @ApiProperty({ description: 'Số vai trò không có users', example: 2 })
  rolesWithoutUsers: number;
}

// Bulk operation response DTOs
export class BulkDeleteResponseDto {
  @ApiProperty({ description: 'Trạng thái thành công', example: true })
  success: boolean;

  @ApiProperty({ description: 'Số lượng đã xóa', example: 3 })
  deletedCount: number;

  @ApiProperty({ description: 'Số lượng bỏ qua', example: 1 })
  skippedCount: number;

  @ApiProperty({ description: 'Thông báo', example: 'Đã xóa 3 vai trò thành công' })
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

  @ApiProperty({ description: 'Thông báo', example: 'Đã khôi phục 3 vai trò thành công' })
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

  @ApiProperty({ description: 'Thông báo', example: 'Đã xóa vĩnh viễn 3 vai trò thành công' })
  message: string;

  @ApiProperty({ description: 'Chi tiết thao tác', required: false })
  details?: {
    deletedIds: number[];
    skippedIds: number[];
    errors?: string[];
  };
}

export class RoleListResponseDto {
  @ApiProperty({ description: 'Danh sách vai trò', type: [RoleResponseDto] })
  data: RoleResponseDto[];

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
