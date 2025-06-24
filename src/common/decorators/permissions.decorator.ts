import { SetMetadata } from '@nestjs/common';
import { PERMISSIONS } from '../constants/permissions.constants';

export const PERMISSIONS_KEY = 'permissions';
export const OWNERSHIP_KEY = 'ownership';
export const PUBLIC_KEY = 'isPublic';

/**
 * Assigns one or more required permissions to an endpoint.
 * @param permissions List of required permissions.
 */
export const RequirePermissions = (...permissions: string[]) =>
	SetMetadata(PERMISSIONS_KEY, permissions);

/**
 * Decorator to mark an endpoint as public (no authentication required).
 */
export const Public = () => SetMetadata(PUBLIC_KEY, true);

/**
 * Decorator that requires Super Admin access.
 */
export const SuperAdminOnly = () =>
	RequirePermissions(PERMISSIONS.ADMIN.FULL_ACCESS);

/**
 * Decorators for resource management endpoints.
 * Provides basic CRUD, Restore, and FullAccess permissions.
 */
export class CrudPermissions {
	// User Management
	static Users = {
		Create: () => RequirePermissions(PERMISSIONS.USERS.CREATE),
		Read: () => RequirePermissions(PERMISSIONS.USERS.READ),
		Update: () => RequirePermissions(PERMISSIONS.USERS.UPDATE),
		Delete: () => RequirePermissions(PERMISSIONS.USERS.DELETE),
		Restore: () => RequirePermissions(PERMISSIONS.USERS.RESTORE),
		FullAccess: () => RequirePermissions(PERMISSIONS.USERS.FULL_ACCESS),
	};

	// Role Management
	static Roles = {
		Create: () => RequirePermissions(PERMISSIONS.ROLES.CREATE),
		Read: () => RequirePermissions(PERMISSIONS.ROLES.READ),
		Update: () => RequirePermissions(PERMISSIONS.ROLES.UPDATE),
		Delete: () => RequirePermissions(PERMISSIONS.ROLES.DELETE),
		Restore: () => RequirePermissions(PERMISSIONS.ROLES.RESTORE),
		FullAccess: () => RequirePermissions(PERMISSIONS.ROLES.FULL_ACCESS),
	};

	// Blog Management
	static Blogs = {
		Create: () => RequirePermissions(PERMISSIONS.BLOGS.CREATE),
		Read: () => RequirePermissions(PERMISSIONS.BLOGS.READ),
		Update: () => RequirePermissions(PERMISSIONS.BLOGS.UPDATE),
		Delete: () => RequirePermissions(PERMISSIONS.BLOGS.DELETE),
		Restore: () => RequirePermissions(PERMISSIONS.BLOGS.RESTORE),
		FullAccess: () => RequirePermissions(PERMISSIONS.BLOGS.FULL_ACCESS),
	};

	// Content Type Management (Categories, Tags)
	static ContentTypes = {
		Create: () => RequirePermissions(PERMISSIONS.CONTENT_TYPES.CREATE),
		Read: () => RequirePermissions(PERMISSIONS.CONTENT_TYPES.READ),
		Update: () => RequirePermissions(PERMISSIONS.CONTENT_TYPES.UPDATE),
		Delete: () => RequirePermissions(PERMISSIONS.CONTENT_TYPES.DELETE),
		Restore: () => RequirePermissions(PERMISSIONS.CONTENT_TYPES.RESTORE),
		FullAccess: () =>
			RequirePermissions(PERMISSIONS.CONTENT_TYPES.FULL_ACCESS),
	};

	// Media Management
	static Media = {
		Create: () => RequirePermissions(PERMISSIONS.MEDIA.CREATE),
		Read: () => RequirePermissions(PERMISSIONS.MEDIA.READ),
		Update: () => RequirePermissions(PERMISSIONS.MEDIA.UPDATE),
		Delete: () => RequirePermissions(PERMISSIONS.MEDIA.DELETE),
		Restore: () => RequirePermissions(PERMISSIONS.MEDIA.RESTORE),
		FullAccess: () => RequirePermissions(PERMISSIONS.MEDIA.FULL_ACCESS),
	};

	// Recruitment Management
	static Recruitment = {
		Create: () => RequirePermissions(PERMISSIONS.RECRUITMENT.CREATE),
		Read: () => RequirePermissions(PERMISSIONS.RECRUITMENT.READ),
		Update: () => RequirePermissions(PERMISSIONS.RECRUITMENT.UPDATE),
		Delete: () => RequirePermissions(PERMISSIONS.RECRUITMENT.DELETE),
		Restore: () => RequirePermissions(PERMISSIONS.RECRUITMENT.RESTORE),
		FullAccess: () => RequirePermissions(PERMISSIONS.RECRUITMENT.FULL_ACCESS),
	};

	// Settings Management
	static Settings = {
		Read: () => RequirePermissions(PERMISSIONS.SETTINGS.READ),
		Update: () => RequirePermissions(PERMISSIONS.SETTINGS.UPDATE),
		FullAccess: () => RequirePermissions(PERMISSIONS.SETTINGS.FULL_ACCESS),
	};
}

/**
 * Decorator that requires resource ownership.
 * Used in conjunction with a resource ownership guard.
 * @param resourceType The type of resource (e.g., 'BLOGS', 'MEDIA').
 */
export const RequireOwnership = (
	resourceType: 'BLOGS' | 'MEDIA' | 'RECRUITMENT',
) => SetMetadata(OWNERSHIP_KEY, { resourceType });
