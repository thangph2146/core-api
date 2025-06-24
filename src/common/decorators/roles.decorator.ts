import { SetMetadata } from '@nestjs/common';
import { PERMISSIONS } from '../constants/permissions.constants';

export const ROLES_KEY = 'roles';
export const PERMISSIONS_KEY = 'permissions';
export const PUBLIC_KEY = 'isPublic';
export const RESOURCE_OWNERSHIP_KEY = 'resourceOwnership';

/**
 * Decorator để yêu cầu quyền cụ thể cho endpoint
 * @param permissions - Danh sách quyền cần thiết
 */
export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

/**
 * Decorator để yêu cầu roles cụ thể cho endpoint
 * @param roles - Danh sách roles cần thiết
 */
export const RequireRoles = (...roles: string[]) =>
  SetMetadata(ROLES_KEY, roles);

/**
 * Decorator để đánh dấu endpoint là public (không cần xác thực)
 */
export const Public = () => SetMetadata(PUBLIC_KEY, true);

/**
 * Decorator để đánh dấu endpoint cần kiểm tra ownership
 * @param resourceType - Loại resource (blogs, media, etc.)
 */
export const RequireOwnership = (resourceType: string) =>
  SetMetadata(RESOURCE_OWNERSHIP_KEY, resourceType);

/**
 * Decorator cho các endpoint chỉ Super Admin mới truy cập được
 */
export const SuperAdminOnly = () =>
  RequirePermissions(PERMISSIONS.ADMIN.FULL_ACCESS);

/**
 * Decorator cho các endpoint quản lý người dùng
 */
export const UserManagement = {
  Create: () => RequirePermissions('users:create'),
  Read: () => RequirePermissions('users:read'),
  Update: () => RequirePermissions('users:update'),
  Delete: () => RequirePermissions('users:delete'),
  ManageAll: () => RequirePermissions('users:manage_all'),
};

/**
 * Decorator cho các endpoint quản lý vai trò
 */
export const RoleManagement = {
  Create: () => RequirePermissions('roles:create'),
  Read: () => RequirePermissions('roles:read'),
  Update: () => RequirePermissions('roles:update'),
  Delete: () => RequirePermissions('roles:delete'),
  AssignPermissions: () => RequirePermissions('roles:assign_permissions'),
};

/**
 * Decorator cho các endpoint quản lý blog
 */
export const BlogManagement = {
  Create: () => RequirePermissions('blogs:create'),
  Read: () => RequirePermissions('blogs:read'),
  Update: () => RequirePermissions('blogs:update'),
  Delete: () => RequirePermissions('blogs:delete'),
  Publish: () => RequirePermissions('blogs:publish'),
  ManageAll: () => RequirePermissions('blogs:manage_all'),
};

/**
 * Decorator cho các endpoint quản lý danh mục
 */
export const CategoryManagement = {
  Create: () => RequirePermissions('categories:create'),
  Read: () => RequirePermissions('categories:read'),
  Update: () => RequirePermissions('categories:update'),
  Delete: () => RequirePermissions('categories:delete'),
};

/**
 * Decorator cho các endpoint quản lý media
 */
export const MediaManagement = {
  Upload: () => RequirePermissions('media:upload'),
  Read: () => RequirePermissions('media:read'),
  Delete: () => RequirePermissions('media:delete'),
  ManageAll: () => RequirePermissions('media:manage_all'),
};
