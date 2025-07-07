import { Request } from 'express';
import { User, Role, Permission, Prisma } from '@prisma/client';

// Base interfaces
export interface IBaseEntity {
  id: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
}

// User related interfaces
export interface IUser extends IBaseEntity {
  name: string | null;
  email: string;
  avatarUrl?: string | null;
  roleId?: number | null;
  role?: IRole | null;
}

// Role related interfaces
export interface IRolePermission {
  id: number;
  name: string;
  description?: string | null;
}

export interface IRole extends IBaseEntity {
  name: string;
  description?: string | null;
  permissions?: IRolePermission[];
  users?: IUser[];
  _count?: {
    users: number;
    permissions?: number;
  };
}

export interface IRoleOption {
  value: number;
  label: string;
}

export interface IRoleStats {
  totalRoles: number;
  activeRoles: number;
  deletedRoles: number;
  rolesWithUsers: number;
  rolesWithoutUsers: number;
}

// Blog related interfaces
export interface IBlogCategory {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  type: string;
}

export interface IBlogTag {
  id: number;
  name: string;
  slug: string;
}

export interface IBlogStatus {
  id: number;
  name: string;
  description?: string | null;
  type: string;
}

export interface IBlogComment {
  id: number;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  author: IUser;
  replies?: IBlogComment[];
}

export interface IBlogCounts {
  likes: number;
  comments: number;
  bookmarks: number;
}

export interface IBlog extends IBaseEntity {
  title: string;
  slug: string;
  summary?: string | null;
  content: Prisma.JsonValue;
  imageUrl?: string | null;
  imageTitle?: string | null;
  statusId?: number | null;
  publishedAt?: Date | null;
  authorId: number;
  categoryId?: number | null;
  viewCount: number;
  isFeatured: boolean;
  allowComments: boolean;
  author: IUser;
  category?: IBlogCategory | null;
  status?: IBlogStatus | null;
  tags: IBlogTag[];
  comments?: IBlogComment[];
  _count?: IBlogCounts;
}

// Category interfaces
export interface ICategory extends IBaseEntity {
  name: string;
  slug: string;
  description?: string | null;
  type: string;
  parentId?: number | null;
  parent?: ICategory | null;
  children?: ICategory[];
}

// Tag interfaces
export interface ITag extends IBaseEntity {
  name: string;
  slug: string;
}

// Status interfaces
export interface IStatus extends IBaseEntity {
  name: string;
  description?: string | null;
  type: string;
}

// Media interfaces
export interface IMedia extends IBaseEntity {
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  uploadedById: number;
  uploadedBy: IUser;
}

// Pagination interfaces
export interface IPaginationParams {
  skip?: number;
  take?: number;
  cursor?: Record<string, number | string>;
  where?: Record<string, unknown>;
  orderBy?:
    | Record<string, 'asc' | 'desc'>
    | Array<Record<string, 'asc' | 'desc'>>;
}

export interface IPaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

// Authentication interfaces
export type UserWithRelations = User & {
  role?: Role & {
    permissions?: Permission[];
  };
};

export type AuthenticatedUser = UserWithRelations & {
  permissions: string[];
};

export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

// Common response interfaces
export interface IApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: any[];
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
    hasNext?: boolean;
    hasPrevious?: boolean;
  };
}

export interface IStatsResponse {
  total: number;
  active: number;
  deleted: number;
  [key: string]: number;
}

export interface IOptionResponse {
  value: number | string;
  label: string;
}

// Bulk operation interfaces
export interface IBulkOperationResult {
  success: number;
  failed: number;
  errors: string[];
}
