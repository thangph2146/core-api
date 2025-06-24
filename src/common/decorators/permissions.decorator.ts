import { SetMetadata } from '@nestjs/common';
import { PERMISSIONS } from '../constants/permissions.constants';

// Core permission decorator
export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata('permissions', permissions);

/**
 * Decorator cho các endpoint quản lý người dùng
 */
export class UserManagement {
  static Create = () => RequirePermissions(PERMISSIONS.USERS.CREATE);
  static Read = () => RequirePermissions(PERMISSIONS.USERS.READ);
  static Update = () => RequirePermissions(PERMISSIONS.USERS.UPDATE);
  static Delete = () => RequirePermissions(PERMISSIONS.USERS.DELETE);
  static ManageAll = () => RequirePermissions(PERMISSIONS.USERS.MANAGE_ALL);
  static ViewProfile = () => RequirePermissions(PERMISSIONS.USERS.VIEW_PROFILE);
  static UpdateOwnProfile = () =>
    RequirePermissions(PERMISSIONS.USERS.UPDATE_OWN_PROFILE);
  static ChangePassword = () =>
    RequirePermissions(PERMISSIONS.USERS.CHANGE_PASSWORD);
  static ResetPassword = () =>
    RequirePermissions(PERMISSIONS.USERS.RESET_PASSWORD);
  static Impersonate = () => RequirePermissions(PERMISSIONS.USERS.IMPERSONATE);
  static FullAccess = () => RequirePermissions(PERMISSIONS.ADMIN.FULL_ACCESS);
}

/**
 * Decorator cho các endpoint quản lý vai trò
 */
export class RoleManagement {
  static Create = () => RequirePermissions(PERMISSIONS.ROLES.CREATE);
  static Read = () => RequirePermissions(PERMISSIONS.ROLES.READ);
  static Update = () => RequirePermissions(PERMISSIONS.ROLES.UPDATE);
  static Delete = () => RequirePermissions(PERMISSIONS.ROLES.DELETE);
  static AssignPermissions = () =>
    RequirePermissions(PERMISSIONS.ROLES.ASSIGN_PERMISSIONS);
  static AssignToUsers = () =>
    RequirePermissions(PERMISSIONS.ROLES.ASSIGN_TO_USERS);
  static FullAccess = () => RequirePermissions(PERMISSIONS.ADMIN.FULL_ACCESS);
}

/**
 * Decorator cho các endpoint quản lý permissions
 */
export class PermissionManagement {
  static Read = () => RequirePermissions(PERMISSIONS.PERMISSIONS.READ);
  static Manage = () => RequirePermissions(PERMISSIONS.PERMISSIONS.MANAGE);
  static FullAccess = () => RequirePermissions(PERMISSIONS.ADMIN.FULL_ACCESS);
}

/**
 * Decorator cho các endpoint quản lý blog
 */
export class BlogManagement {
  static Create = () => RequirePermissions(PERMISSIONS.BLOGS.CREATE);
  static Read = () => RequirePermissions(PERMISSIONS.BLOGS.READ);
  static Update = () => RequirePermissions(PERMISSIONS.BLOGS.UPDATE);
  static Delete = () => RequirePermissions(PERMISSIONS.BLOGS.DELETE);
  static Publish = () => RequirePermissions(PERMISSIONS.BLOGS.PUBLISH);
  static Unpublish = () => RequirePermissions(PERMISSIONS.BLOGS.UNPUBLISH);
  static ManageAll = () => RequirePermissions(PERMISSIONS.BLOGS.MANAGE_ALL);
  static Moderate = () => RequirePermissions(PERMISSIONS.BLOGS.MODERATE);
  static ViewDrafts = () => RequirePermissions(PERMISSIONS.BLOGS.VIEW_DRAFTS);
  static Schedule = () => RequirePermissions(PERMISSIONS.BLOGS.SCHEDULE);
  static FullAccess = () => RequirePermissions(PERMISSIONS.ADMIN.FULL_ACCESS);
}

/**
 * Decorator cho các endpoint quản lý danh mục
 */
export class CategoryManagement {
  static Create = () => RequirePermissions(PERMISSIONS.CATEGORIES.CREATE);
  static Read = () => RequirePermissions(PERMISSIONS.CATEGORIES.READ);
  static Update = () => RequirePermissions(PERMISSIONS.CATEGORIES.UPDATE);
  static Delete = () => RequirePermissions(PERMISSIONS.CATEGORIES.DELETE);
  static ManageHierarchy = () =>
    RequirePermissions(PERMISSIONS.CATEGORIES.MANAGE_HIERARCHY);
  static FullAccess = () => RequirePermissions(PERMISSIONS.ADMIN.FULL_ACCESS);
}

/**
 * Decorator cho các endpoint quản lý tags
 */
export class TagManagement {
  static Create = () => RequirePermissions(PERMISSIONS.TAGS.CREATE);
  static Read = () => RequirePermissions(PERMISSIONS.TAGS.READ);
  static Update = () => RequirePermissions(PERMISSIONS.TAGS.UPDATE);
  static Delete = () => RequirePermissions(PERMISSIONS.TAGS.DELETE);
  static FullAccess = () => RequirePermissions(PERMISSIONS.ADMIN.FULL_ACCESS);
}

/**
 * Decorator cho các endpoint quản lý media
 */
export class MediaManagement {
  static Upload = () => RequirePermissions(PERMISSIONS.MEDIA.UPLOAD);
  static Read = () => RequirePermissions(PERMISSIONS.MEDIA.READ);
  static Update = () => RequirePermissions(PERMISSIONS.MEDIA.UPDATE);
  static Delete = () => RequirePermissions(PERMISSIONS.MEDIA.DELETE);
  static ManageAll = () => RequirePermissions(PERMISSIONS.MEDIA.MANAGE_ALL);
  static Organize = () => RequirePermissions(PERMISSIONS.MEDIA.ORGANIZE);
  static FullAccess = () => RequirePermissions(PERMISSIONS.ADMIN.FULL_ACCESS);
}

/**
 * Decorator cho các endpoint quản lý tuyển dụng
 */
export class RecruitmentManagement {
  static Create = () => RequirePermissions(PERMISSIONS.RECRUITMENT.CREATE);
  static Read = () => RequirePermissions(PERMISSIONS.RECRUITMENT.READ);
  static Update = () => RequirePermissions(PERMISSIONS.RECRUITMENT.UPDATE);
  static Delete = () => RequirePermissions(PERMISSIONS.RECRUITMENT.DELETE);
  static Publish = () => RequirePermissions(PERMISSIONS.RECRUITMENT.PUBLISH);
  static ManageAll = () =>
    RequirePermissions(PERMISSIONS.RECRUITMENT.MANAGE_ALL);
  static ViewApplications = () =>
    RequirePermissions(PERMISSIONS.RECRUITMENT.VIEW_APPLICATIONS);
  static ManageApplications = () =>
    RequirePermissions(PERMISSIONS.RECRUITMENT.MANAGE_APPLICATIONS);
  static FullAccess = () => RequirePermissions(PERMISSIONS.ADMIN.FULL_ACCESS);
}

/**
 * Decorator cho các endpoint quản lý dịch vụ
 */
export class ServiceManagement {
  static Create = () => RequirePermissions(PERMISSIONS.SERVICES.CREATE);
  static Read = () => RequirePermissions(PERMISSIONS.SERVICES.READ);
  static Update = () => RequirePermissions(PERMISSIONS.SERVICES.UPDATE);
  static Delete = () => RequirePermissions(PERMISSIONS.SERVICES.DELETE);
  static ManageAll = () => RequirePermissions(PERMISSIONS.SERVICES.MANAGE_ALL);
  static FullAccess = () => RequirePermissions(PERMISSIONS.ADMIN.FULL_ACCESS);
}

/**
 * Decorator cho các endpoint quản lý liên hệ
 */
export class ContactManagement {
  static Read = () => RequirePermissions(PERMISSIONS.CONTACTS.READ);
  static Update = () => RequirePermissions(PERMISSIONS.CONTACTS.UPDATE);
  static Delete = () => RequirePermissions(PERMISSIONS.CONTACTS.DELETE);
  static Respond = () => RequirePermissions(PERMISSIONS.CONTACTS.RESPOND);
  static Export = () => RequirePermissions(PERMISSIONS.CONTACTS.EXPORT);
  static FullAccess = () => RequirePermissions(PERMISSIONS.ADMIN.FULL_ACCESS);
}

/**
 * Decorator cho các endpoint analytics
 */
export class AnalyticsManagement {
  static ViewBasic = () => RequirePermissions(PERMISSIONS.ANALYTICS.VIEW_BASIC);
  static ViewAdvanced = () =>
    RequirePermissions(PERMISSIONS.ANALYTICS.VIEW_ADVANCED);
  static Export = () => RequirePermissions(PERMISSIONS.ANALYTICS.EXPORT);
  static FullAccess = () => RequirePermissions(PERMISSIONS.ADMIN.FULL_ACCESS);
}

/**
 * Decorator cho các endpoint cài đặt
 */
export class SettingsManagement {
  static Read = () => RequirePermissions(PERMISSIONS.SETTINGS.READ);
  static Update = () => RequirePermissions(PERMISSIONS.SETTINGS.UPDATE);
  static ManageSEO = () => RequirePermissions(PERMISSIONS.SETTINGS.MANAGE_SEO);
  static ManageGeneral = () =>
    RequirePermissions(PERMISSIONS.SETTINGS.MANAGE_GENERAL);
  static FullAccess = () => RequirePermissions(PERMISSIONS.ADMIN.FULL_ACCESS);
}

/**
 * Decorator cho các endpoint admin
 */
export class AdminManagement {
  static FullAccess = () => RequirePermissions(PERMISSIONS.ADMIN.FULL_ACCESS);
  static SystemSettings = () =>
    RequirePermissions(PERMISSIONS.ADMIN.SYSTEM_SETTINGS);
  static ViewLogs = () => RequirePermissions(PERMISSIONS.ADMIN.VIEW_LOGS);
  static ManageSessions = () =>
    RequirePermissions(PERMISSIONS.ADMIN.MANAGE_SESSIONS);
  static MaintenanceMode = () =>
    RequirePermissions(PERMISSIONS.ADMIN.MAINTENANCE_MODE);
}

// Special decorators
export const SuperAdminOnly = () =>
  RequirePermissions(PERMISSIONS.ADMIN.FULL_ACCESS);

// Resource ownership decorators (for checking if user owns the resource)
export const RequireOwnership = (resourceType: string) =>
  SetMetadata('ownership', { resourceType });

// Flexible permission checking
export const AnyPermission = (...permissions: string[]) =>
  SetMetadata('anyPermissions', permissions);

export const AllPermissions = (...permissions: string[]) =>
  SetMetadata('allPermissions', permissions);
