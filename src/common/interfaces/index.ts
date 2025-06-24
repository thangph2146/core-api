// Base interfaces
export interface IBaseEntity {
  id: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
}

// Blog related interfaces
export interface IBlogAuthor {
  id: number;
  name: string | null;
  email: string;
  avatarUrl?: string | null;
}

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
  author: IBlogAuthor;
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
  content: any; // JSON content
  imageUrl?: string | null;
  imageTitle?: string | null;
  statusId?: number | null;
  publishedAt?: Date | null;
  authorId: number;
  categoryId?: number | null;
  viewCount: number;
  isFeatured: boolean;
  allowComments: boolean;

  // Relations
  author: IBlogAuthor;
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

  // Relations
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
  users?: IBlogAuthor[]; // Reusing IBlogAuthor as basic user info
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

// Pagination interfaces
export interface IPaginationParams {
  skip?: number;
  take?: number;
  cursor?: any;
  where?: any;
  orderBy?: any;
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

import { Request } from 'express';
import { User, Role, Permission } from '@prisma/client';

// Extend the Prisma User type to include nested relations
export type UserWithRelations = User & {
  role?: Role & {
    permissions?: Permission[];
  };
};

/**
 * Represents the user object attached to the request after successful authentication.
 * It includes the full user details, their role, and a flattened list of permission names.
 */
export type AuthenticatedUser = UserWithRelations & {
  permissions: string[];
};

export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}
