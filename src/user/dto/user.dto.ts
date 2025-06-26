import {
  IsEmail,
  IsOptional,
  IsString,
  IsInt,
  IsBoolean,
  IsDateString,
  IsArray,
  ArrayMinSize,
  Min
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  name: string;

  @IsString()
  password: string;

  @IsString()
  @IsOptional()
  avatarUrl?: string;

  @IsString()
  @IsOptional()
  image?: string;

  @IsString()
  @IsOptional()
  hashedPassword?: string;

  @IsInt()
  @IsOptional()
  roleId?: number;

  @IsDateString()
  @IsOptional()
  emailVerified?: string;

  @IsOptional()
  profile?: {
    bio?: string;
    avatarUrl?: string;
    socialLinks?: Record<string, any>;
  };
}

export class UpdateUserDto {
  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  avatarUrl?: string;

  @IsString()
  @IsOptional()
  image?: string;

  @IsInt()
  @IsOptional()
  roleId?: number;

  @IsDateString()
  @IsOptional()
  emailVerified?: string;

  @IsOptional()
  profile?: {
    bio?: string;
    avatarUrl?: string;
    socialLinks?: Record<string, any>;
  };
}

export class UserQueryDto {
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
  @IsInt()
  @Transform(({ value }) => value !== undefined && value !== null && value !== '' ? parseInt(value, 10) : undefined)
  roleId?: number;

  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';
  

}

export class UserResponseDto {
  id: number;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  image: string | null;
  emailVerified: Date | null;
  roleId: number | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  role?: {
    id: number;
    name: string;
    description: string | null;
  } | null;
  profile?: {
    id: number;
    bio: string | null;
    avatarUrl: string | null;
    socialLinks: any;
  } | null;
  _count?: {
    blogs: number;
    medias: number;
    recruitments: number;
  };
}

export class UserListResponseDto {
  data: UserResponseDto[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export class BulkUserOperationDto {
  @IsArray()
  @ArrayMinSize(1, { message: 'userIds array cannot be empty' })
  @IsInt({ each: true, message: 'Each user ID must be a positive integer' })
  @Min(1, { each: true, message: 'Each user ID must be a positive integer' })
  @Transform(({ value }) => {
    if (!Array.isArray(value)) {
      return value; // Let class-validator handle the error
    }
    
    return value.map((id) => {
      const num = typeof id === 'string' ? parseInt(id, 10) : Number(id);
      return isNaN(num) ? id : num; // Let class-validator handle validation
    });
  })
  userIds: number[];
}

export class BulkUserRestoreDto {
  @IsArray()
  @ArrayMinSize(1, { message: 'userIds array cannot be empty' })
  @IsInt({ each: true, message: 'Each user ID must be a positive integer' })
  @Min(1, { each: true, message: 'Each user ID must be a positive integer' })
  @Transform(({ value }) => {
    if (!Array.isArray(value)) {
      return value; // Let class-validator handle the error
    }
    
    return value.map(id => {
      const num = typeof id === 'string' ? parseInt(id, 10) : Number(id);
      return isNaN(num) ? id : num; // Let class-validator handle validation
    });
  })
  userIds: number[];
}

export class SimpleBulkRestoreDto {
  userIds: any; // No validation at all
}
