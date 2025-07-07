import { SetMetadata, createParamDecorator, ExecutionContext } from '@nestjs/common';
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
export const CrudPermissions = {
	// User Management
	Users: {
		Create: () => RequirePermissions(PERMISSIONS.USERS.CREATE),
		Read: () => RequirePermissions(PERMISSIONS.USERS.READ),
		Update: () => RequirePermissions(PERMISSIONS.USERS.UPDATE),
		Delete: () => RequirePermissions(PERMISSIONS.USERS.DELETE),
		Restore: () => RequirePermissions(PERMISSIONS.USERS.RESTORE),
		ViewDeleted: () => RequirePermissions(PERMISSIONS.USERS.VIEW_DELETED),
		PermanentDelete: () => RequirePermissions(PERMISSIONS.USERS.PERMANENT_DELETE),
		BulkDelete: () => RequirePermissions(PERMISSIONS.USERS.BULK_DELETE),
		BulkRestore: () => RequirePermissions(PERMISSIONS.USERS.BULK_RESTORE),
		BulkPermanentDelete: () => RequirePermissions(PERMISSIONS.USERS.BULK_PERMANENT_DELETE),
		FullAccess: () => RequirePermissions(PERMISSIONS.USERS.FULL_ACCESS),
	},

	// Role Management
	Roles: {
		Create: () => RequirePermissions(PERMISSIONS.ROLES.CREATE),
		Read: () => RequirePermissions(PERMISSIONS.ROLES.READ),
		Update: () => RequirePermissions(PERMISSIONS.ROLES.UPDATE),
		Delete: () => RequirePermissions(PERMISSIONS.ROLES.DELETE),
		Restore: () => RequirePermissions(PERMISSIONS.ROLES.RESTORE),
		ViewDeleted: () => RequirePermissions(PERMISSIONS.ROLES.VIEW_DELETED),
		PermanentDelete: () => RequirePermissions(PERMISSIONS.ROLES.PERMANENT_DELETE),
		BulkDelete: () => RequirePermissions(PERMISSIONS.ROLES.BULK_DELETE),
		BulkRestore: () => RequirePermissions(PERMISSIONS.ROLES.BULK_RESTORE),
		BulkPermanentDelete: () => RequirePermissions(PERMISSIONS.ROLES.BULK_PERMANENT_DELETE),
		FullAccess: () => RequirePermissions(PERMISSIONS.ROLES.FULL_ACCESS),
	},

	// Permission Management
	Permissions: {
		Create: () => RequirePermissions(PERMISSIONS.PERMISSIONS.CREATE),
		Read: () => RequirePermissions(PERMISSIONS.PERMISSIONS.READ),
		Update: () => RequirePermissions(PERMISSIONS.PERMISSIONS.UPDATE),
		Delete: () => RequirePermissions(PERMISSIONS.PERMISSIONS.DELETE),
		Restore: () => RequirePermissions(PERMISSIONS.PERMISSIONS.RESTORE),
		ViewDeleted: () => RequirePermissions(PERMISSIONS.PERMISSIONS.VIEW_DELETED),
		PermanentDelete: () => RequirePermissions(PERMISSIONS.PERMISSIONS.PERMANENT_DELETE),
		BulkDelete: () => RequirePermissions(PERMISSIONS.PERMISSIONS.BULK_DELETE),
		BulkRestore: () => RequirePermissions(PERMISSIONS.PERMISSIONS.BULK_RESTORE),
		BulkPermanentDelete: () => RequirePermissions(PERMISSIONS.PERMISSIONS.BULK_PERMANENT_DELETE),
		FullAccess: () => RequirePermissions(PERMISSIONS.PERMISSIONS.FULL_ACCESS),
	},

	// Blog Management
	Blogs: {
		Create: () => RequirePermissions(PERMISSIONS.BLOGS.CREATE),
		Read: () => RequirePermissions(PERMISSIONS.BLOGS.READ),
		Update: () => RequirePermissions(PERMISSIONS.BLOGS.UPDATE),
		Delete: () => RequirePermissions(PERMISSIONS.BLOGS.DELETE),
		Restore: () => RequirePermissions(PERMISSIONS.BLOGS.RESTORE),
		ViewDeleted: () => RequirePermissions(PERMISSIONS.BLOGS.VIEW_DELETED),
		PermanentDelete: () => RequirePermissions(PERMISSIONS.BLOGS.PERMANENT_DELETE),
		BulkDelete: () => RequirePermissions(PERMISSIONS.BLOGS.BULK_DELETE),
		BulkRestore: () => RequirePermissions(PERMISSIONS.BLOGS.BULK_RESTORE),
		BulkPermanentDelete: () => RequirePermissions(PERMISSIONS.BLOGS.BULK_PERMANENT_DELETE),
		Publish: () => RequirePermissions(PERMISSIONS.BLOGS.PUBLISH),
		Unpublish: () => RequirePermissions(PERMISSIONS.BLOGS.UNPUBLISH),
		FullAccess: () => RequirePermissions(PERMISSIONS.BLOGS.FULL_ACCESS),
	},

	// Category Management
	Categories: {
		Create: () => RequirePermissions(PERMISSIONS.CATEGORIES.CREATE),
		Read: () => RequirePermissions(PERMISSIONS.CATEGORIES.READ),
		Update: () => RequirePermissions(PERMISSIONS.CATEGORIES.UPDATE),
		Delete: () => RequirePermissions(PERMISSIONS.CATEGORIES.DELETE),
		Restore: () => RequirePermissions(PERMISSIONS.CATEGORIES.RESTORE),
		ViewDeleted: () => RequirePermissions(PERMISSIONS.CATEGORIES.VIEW_DELETED),
		PermanentDelete: () => RequirePermissions(PERMISSIONS.CATEGORIES.PERMANENT_DELETE),
		BulkDelete: () => RequirePermissions(PERMISSIONS.CATEGORIES.BULK_DELETE),
		BulkRestore: () => RequirePermissions(PERMISSIONS.CATEGORIES.BULK_RESTORE),
		BulkPermanentDelete: () => RequirePermissions(PERMISSIONS.CATEGORIES.BULK_PERMANENT_DELETE),
		FullAccess: () => RequirePermissions(PERMISSIONS.CATEGORIES.FULL_ACCESS),
	},

	// Tag Management
	Tags: {
		Create: () => RequirePermissions(PERMISSIONS.TAGS.CREATE),
		Read: () => RequirePermissions(PERMISSIONS.TAGS.READ),
		Update: () => RequirePermissions(PERMISSIONS.TAGS.UPDATE),
		Delete: () => RequirePermissions(PERMISSIONS.TAGS.DELETE),
		Restore: () => RequirePermissions(PERMISSIONS.TAGS.RESTORE),
		ViewDeleted: () => RequirePermissions(PERMISSIONS.TAGS.VIEW_DELETED),
		PermanentDelete: () => RequirePermissions(PERMISSIONS.TAGS.PERMANENT_DELETE),
		BulkDelete: () => RequirePermissions(PERMISSIONS.TAGS.BULK_DELETE),
		BulkRestore: () => RequirePermissions(PERMISSIONS.TAGS.BULK_RESTORE),
		BulkPermanentDelete: () => RequirePermissions(PERMISSIONS.TAGS.BULK_PERMANENT_DELETE),
		FullAccess: () => RequirePermissions(PERMISSIONS.TAGS.FULL_ACCESS),
	},

	// Status Management
	Status: {
		Create: () => RequirePermissions(PERMISSIONS.STATUS.CREATE),
		Read: () => RequirePermissions(PERMISSIONS.STATUS.READ),
		Update: () => RequirePermissions(PERMISSIONS.STATUS.UPDATE),
		Delete: () => RequirePermissions(PERMISSIONS.STATUS.DELETE),
		Restore: () => RequirePermissions(PERMISSIONS.STATUS.RESTORE),
		ViewDeleted: () => RequirePermissions(PERMISSIONS.STATUS.VIEW_DELETED),
		PermanentDelete: () => RequirePermissions(PERMISSIONS.STATUS.PERMANENT_DELETE),
		BulkDelete: () => RequirePermissions(PERMISSIONS.STATUS.BULK_DELETE),
		BulkRestore: () => RequirePermissions(PERMISSIONS.STATUS.BULK_RESTORE),
		BulkPermanentDelete: () => RequirePermissions(PERMISSIONS.STATUS.BULK_PERMANENT_DELETE),
		FullAccess: () => RequirePermissions(PERMISSIONS.STATUS.FULL_ACCESS),
	},

	// Media Management
	Media: {
		Create: () => RequirePermissions(PERMISSIONS.MEDIA.CREATE),
		Read: () => RequirePermissions(PERMISSIONS.MEDIA.READ),
		Update: () => RequirePermissions(PERMISSIONS.MEDIA.UPDATE),
		Delete: () => RequirePermissions(PERMISSIONS.MEDIA.DELETE),
		Restore: () => RequirePermissions(PERMISSIONS.MEDIA.RESTORE),
		ViewDeleted: () => RequirePermissions(PERMISSIONS.MEDIA.VIEW_DELETED),
		PermanentDelete: () => RequirePermissions(PERMISSIONS.MEDIA.PERMANENT_DELETE),
		BulkDelete: () => RequirePermissions(PERMISSIONS.MEDIA.BULK_DELETE),
		BulkRestore: () => RequirePermissions(PERMISSIONS.MEDIA.BULK_RESTORE),
		BulkPermanentDelete: () => RequirePermissions(PERMISSIONS.MEDIA.BULK_PERMANENT_DELETE),
		FullAccess: () => RequirePermissions(PERMISSIONS.MEDIA.FULL_ACCESS),
	},

	// Recruitment Management
	Recruitment: {
		Create: () => RequirePermissions(PERMISSIONS.RECRUITMENT.CREATE),
		Read: () => RequirePermissions(PERMISSIONS.RECRUITMENT.READ),
		Update: () => RequirePermissions(PERMISSIONS.RECRUITMENT.UPDATE),
		Delete: () => RequirePermissions(PERMISSIONS.RECRUITMENT.DELETE),
		Restore: () => RequirePermissions(PERMISSIONS.RECRUITMENT.RESTORE),
		ViewDeleted: () => RequirePermissions(PERMISSIONS.RECRUITMENT.VIEW_DELETED),
		Apply: () => RequirePermissions(PERMISSIONS.RECRUITMENT.APPLY),
		PermanentDelete: () => RequirePermissions(PERMISSIONS.RECRUITMENT.PERMANENT_DELETE),
		BulkDelete: () => RequirePermissions(PERMISSIONS.RECRUITMENT.BULK_DELETE),
		BulkRestore: () => RequirePermissions(PERMISSIONS.RECRUITMENT.BULK_RESTORE),
		BulkPermanentDelete: () => RequirePermissions(PERMISSIONS.RECRUITMENT.BULK_PERMANENT_DELETE),
		FullAccess: () => RequirePermissions(PERMISSIONS.RECRUITMENT.FULL_ACCESS),
	},

	// Service Management
	Services: {
		Create: () => RequirePermissions(PERMISSIONS.SERVICES.CREATE),
		Read: () => RequirePermissions(PERMISSIONS.SERVICES.READ),
		Update: () => RequirePermissions(PERMISSIONS.SERVICES.UPDATE),
		Delete: () => RequirePermissions(PERMISSIONS.SERVICES.DELETE),
		Restore: () => RequirePermissions(PERMISSIONS.SERVICES.RESTORE),
		ViewDeleted: () => RequirePermissions(PERMISSIONS.SERVICES.VIEW_DELETED),
		PermanentDelete: () => RequirePermissions(PERMISSIONS.SERVICES.PERMANENT_DELETE),
		BulkDelete: () => RequirePermissions(PERMISSIONS.SERVICES.BULK_DELETE),
		BulkRestore: () => RequirePermissions(PERMISSIONS.SERVICES.BULK_RESTORE),
		BulkPermanentDelete: () => RequirePermissions(PERMISSIONS.SERVICES.BULK_PERMANENT_DELETE),
		FullAccess: () => RequirePermissions(PERMISSIONS.SERVICES.FULL_ACCESS),
	},

	// Contact Management
	Contacts: {
		Create: () => RequirePermissions(PERMISSIONS.CONTACTS.CREATE),
		Read: () => RequirePermissions(PERMISSIONS.CONTACTS.READ),
		Update: () => RequirePermissions(PERMISSIONS.CONTACTS.UPDATE),
		Delete: () => RequirePermissions(PERMISSIONS.CONTACTS.DELETE),
		Restore: () => RequirePermissions(PERMISSIONS.CONTACTS.RESTORE),
		ViewDeleted: () => RequirePermissions(PERMISSIONS.CONTACTS.VIEW_DELETED),
		PermanentDelete: () => RequirePermissions(PERMISSIONS.CONTACTS.PERMANENT_DELETE),
		BulkDelete: () => RequirePermissions(PERMISSIONS.CONTACTS.BULK_DELETE),
		BulkRestore: () => RequirePermissions(PERMISSIONS.CONTACTS.BULK_RESTORE),
		BulkPermanentDelete: () => RequirePermissions(PERMISSIONS.CONTACTS.BULK_PERMANENT_DELETE),
		FullAccess: () => RequirePermissions(PERMISSIONS.CONTACTS.FULL_ACCESS),
	},

	// Comment Management
	Comments: {
		Create: () => RequirePermissions(PERMISSIONS.COMMENTS.CREATE),
		Read: () => RequirePermissions(PERMISSIONS.COMMENTS.READ),
		Update: () => RequirePermissions(PERMISSIONS.COMMENTS.UPDATE),
		Delete: () => RequirePermissions(PERMISSIONS.COMMENTS.DELETE),
		Restore: () => RequirePermissions(PERMISSIONS.COMMENTS.RESTORE),
		ViewDeleted: () => RequirePermissions(PERMISSIONS.COMMENTS.VIEW_DELETED),
		PermanentDelete: () => RequirePermissions(PERMISSIONS.COMMENTS.PERMANENT_DELETE),
		BulkDelete: () => RequirePermissions(PERMISSIONS.COMMENTS.BULK_DELETE),
		BulkRestore: () => RequirePermissions(PERMISSIONS.COMMENTS.BULK_RESTORE),
		BulkPermanentDelete: () => RequirePermissions(PERMISSIONS.COMMENTS.BULK_PERMANENT_DELETE),
		FullAccess: () => RequirePermissions(PERMISSIONS.COMMENTS.FULL_ACCESS),
	},

	// Analytics Management
	Analytics: {
		Create: () => RequirePermissions(PERMISSIONS.ANALYTICS.CREATE),
		Read: () => RequirePermissions(PERMISSIONS.ANALYTICS.READ),
		Update: () => RequirePermissions(PERMISSIONS.ANALYTICS.UPDATE),
		Delete: () => RequirePermissions(PERMISSIONS.ANALYTICS.DELETE),
		Restore: () => RequirePermissions(PERMISSIONS.ANALYTICS.RESTORE),
		ViewDeleted: () => RequirePermissions(PERMISSIONS.ANALYTICS.VIEW_DELETED),
		PermanentDelete: () => RequirePermissions(PERMISSIONS.ANALYTICS.PERMANENT_DELETE),
		BulkDelete: () => RequirePermissions(PERMISSIONS.ANALYTICS.BULK_DELETE),
		BulkRestore: () => RequirePermissions(PERMISSIONS.ANALYTICS.BULK_RESTORE),
		BulkPermanentDelete: () => RequirePermissions(PERMISSIONS.ANALYTICS.BULK_PERMANENT_DELETE),
		FullAccess: () => RequirePermissions(PERMISSIONS.ANALYTICS.FULL_ACCESS),
	},

	// Settings Management
	Settings: {
		Create: () => RequirePermissions(PERMISSIONS.SETTINGS.CREATE),
		Read: () => RequirePermissions(PERMISSIONS.SETTINGS.READ),
		Update: () => RequirePermissions(PERMISSIONS.SETTINGS.UPDATE),
		Delete: () => RequirePermissions(PERMISSIONS.SETTINGS.DELETE),
		Restore: () => RequirePermissions(PERMISSIONS.SETTINGS.RESTORE),
		ViewDeleted: () => RequirePermissions(PERMISSIONS.SETTINGS.VIEW_DELETED),
		PermanentDelete: () => RequirePermissions(PERMISSIONS.SETTINGS.PERMANENT_DELETE),
		BulkDelete: () => RequirePermissions(PERMISSIONS.SETTINGS.BULK_DELETE),
		BulkRestore: () => RequirePermissions(PERMISSIONS.SETTINGS.BULK_RESTORE),
		BulkPermanentDelete: () => RequirePermissions(PERMISSIONS.SETTINGS.BULK_PERMANENT_DELETE),
		FullAccess: () => RequirePermissions(PERMISSIONS.SETTINGS.FULL_ACCESS),
	},

	// Legacy aliases for backward compatibility (deprecated)
	ContentTypes: {
		Create: () => RequirePermissions(PERMISSIONS.CATEGORIES.CREATE),
		Read: () => RequirePermissions(PERMISSIONS.CATEGORIES.READ),
		Update: () => RequirePermissions(PERMISSIONS.CATEGORIES.UPDATE),
		Delete: () => RequirePermissions(PERMISSIONS.CATEGORIES.DELETE),
		Restore: () => RequirePermissions(PERMISSIONS.CATEGORIES.RESTORE),
		FullAccess: () => RequirePermissions(PERMISSIONS.CATEGORIES.FULL_ACCESS),
	},

	// Legacy Permission alias
	Permission: {
		Create: () => RequirePermissions(PERMISSIONS.PERMISSIONS.CREATE),
		Read: () => RequirePermissions(PERMISSIONS.PERMISSIONS.READ),
		Update: () => RequirePermissions(PERMISSIONS.PERMISSIONS.UPDATE),
		Delete: () => RequirePermissions(PERMISSIONS.PERMISSIONS.DELETE),
		Restore: () => RequirePermissions(PERMISSIONS.PERMISSIONS.RESTORE),
		PermanentDelete: () => RequirePermissions(PERMISSIONS.PERMISSIONS.PERMANENT_DELETE),
		BulkDelete: () => RequirePermissions(PERMISSIONS.PERMISSIONS.BULK_DELETE),
		BulkRestore: () => RequirePermissions(PERMISSIONS.PERMISSIONS.BULK_RESTORE),
		BulkPermanentDelete: () => RequirePermissions(PERMISSIONS.PERMISSIONS.BULK_PERMANENT_DELETE),
		FullAccess: () => RequirePermissions(PERMISSIONS.PERMISSIONS.FULL_ACCESS),
	},

	// Legacy Service alias
	Service: {
		Create: () => RequirePermissions(PERMISSIONS.SERVICES.CREATE),
		Read: () => RequirePermissions(PERMISSIONS.SERVICES.READ),
		Update: () => RequirePermissions(PERMISSIONS.SERVICES.UPDATE),
		Delete: () => RequirePermissions(PERMISSIONS.SERVICES.DELETE),
		Restore: () => RequirePermissions(PERMISSIONS.SERVICES.RESTORE),
		ViewDeleted: () => RequirePermissions(PERMISSIONS.SERVICES.VIEW_DELETED),
		PermanentDelete: () => RequirePermissions(PERMISSIONS.SERVICES.PERMANENT_DELETE),
		BulkDelete: () => RequirePermissions(PERMISSIONS.SERVICES.BULK_DELETE),
		BulkRestore: () => RequirePermissions(PERMISSIONS.SERVICES.BULK_RESTORE),
		BulkPermanentDelete: () => RequirePermissions(PERMISSIONS.SERVICES.BULK_PERMANENT_DELETE),
		FullAccess: () => RequirePermissions(PERMISSIONS.SERVICES.FULL_ACCESS),
	},
};

/**
 * Decorator that requires resource ownership.
 * Used in conjunction with a resource ownership guard.
 * @param resourceType The type of resource (e.g., 'BLOGS', 'MEDIA').
 */
export const RequireOwnership = (
	resourceType: 'BLOGS' | 'MEDIA' | 'RECRUITMENT' | 'USER' | 'CATEGORIES' | 'TAGS' | 'COMMENTS',
) => SetMetadata(OWNERSHIP_KEY, { resourceType });

/**
 * Decorator to get current user from request
 */
export const CurrentUser = createParamDecorator(
	(data: unknown, ctx: ExecutionContext) => {
		const request = ctx.switchToHttp().getRequest();
		return request.user;
	},
);
