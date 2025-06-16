import { IsEmail, IsOptional, IsString, IsInt, IsBoolean, IsDateString } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  avatarUrl?: string;

  @IsString()
  @IsOptional()
  image?: string;

  @IsString()
  hashedPassword: string;

  @IsInt()
  @IsOptional()
  roleId?: number;
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
}

export class UserQueryDto {
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
  @IsInt()
  @Transform(({ value }) => parseInt(value))
  roleId?: number;

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
