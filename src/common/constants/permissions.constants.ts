/**
 * Defines all permissions in the system.
 * Follows the standard: {resource}:{action}
 */
export const PERMISSIONS = {
  // System Admin Permissions
  ADMIN: {
    FULL_ACCESS: 'admin:full_access', // Super admin level
  },

  // User Management Permissions
  USERS: {
    CREATE: 'users:create',
    READ: 'users:read',
    UPDATE: 'users:update',
    DELETE: 'users:delete',
    RESTORE: 'users:restore',
    VIEW_DELETED: 'users:view_deleted',
    PERMANENT_DELETE: 'users:permanent_delete',
    BULK_DELETE: 'users:bulk_delete',
    BULK_RESTORE: 'users:bulk_restore',
    BULK_PERMANENT_DELETE: 'users:bulk_permanent_delete',
    FULL_ACCESS: 'users:full_access', // For managing all users
  },

  // Role Management Permissions
  ROLES: {
    CREATE: 'roles:create',
    READ: 'roles:read',
    UPDATE: 'roles:update',
    DELETE: 'roles:delete',
    RESTORE: 'roles:restore',
    FULL_ACCESS: 'roles:full_access', // For assigning permissions, etc.
  },

  // Blog Management Permissions
  BLOGS: {
    CREATE: 'blogs:create',
    READ: 'blogs:read',
    UPDATE: 'blogs:update',
    DELETE: 'blogs:delete',
    RESTORE: 'blogs:restore',
    FULL_ACCESS: 'blogs:full_access', // For publishing, moderating, etc.
  },

  // General Content Types (Categories, Tags)
  CONTENT_TYPES: {
    CREATE: 'content_types:create',
    READ: 'content_types:read',
    UPDATE: 'content_types:update',
    DELETE: 'content_types:delete',
    RESTORE: 'content_types:restore',
    FULL_ACCESS: 'content_types:full_access',
  },

  // Media Management Permissions
  MEDIA: {
    CREATE: 'media:create', // Corresponds to upload
    READ: 'media:read',
    UPDATE: 'media:update',
    DELETE: 'media:delete',
    RESTORE: 'media:restore',
    FULL_ACCESS: 'media:full_access',
  },

  // Recruitment Management Permissions
  RECRUITMENT: {
    CREATE: 'recruitment:create',
    READ: 'recruitment:read',
    UPDATE: 'recruitment:update',
    DELETE: 'recruitment:delete',
    RESTORE: 'recruitment:restore',
    FULL_ACCESS: 'recruitment:full_access', // For managing applications
  },

  // General System Settings
  SETTINGS: {
    READ: 'settings:read',
    UPDATE: 'settings:update',
    FULL_ACCESS: 'settings:full_access',
  },
} as const;

/**
 * List of all permissions as an array.
 */
export const ALL_PERMISSIONS = Object.values(PERMISSIONS).flatMap((group) =>
  Object.values(group),
);
