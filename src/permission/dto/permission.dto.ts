export interface CreatePermissionDto {
  name: string;
  description?: string;
  metaTitle?: string;
  metaDescription?: string;
}

export interface UpdatePermissionDto {
  name?: string;
  description?: string;
  metaTitle?: string;
  metaDescription?: string;
}

export interface PermissionQueryDto {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  includeDeleted?: boolean;
  deleted?: boolean;
}

export interface PermissionStatsDto {
  total: number;
  active: number;
  deleted: number;
}
