/**
 * Định nghĩa toàn bộ permissions trong hệ thống
 * Tuân theo chuẩn: {resource}:{action}
 */

export const PERMISSIONS = {
  // System Admin Permissions
  ADMIN: {
    CREATE: 'admin:create',
    READ: 'admin:read',
    UPDATE: 'admin:update',
    DELETE: 'admin:delete',
    RESTORE: 'admin:restore',
    VIEW_DELETED: 'admin:view_deleted',
    PERMANENT_DELETE: 'admin:permanent_delete',
    BULK_DELETE: 'admin:bulk_delete',
    BULK_RESTORE: 'admin:bulk_restore',
    BULK_PERMANENT_DELETE: 'admin:bulk_permanent_delete',
    FULL_ACCESS: 'admin:full_access', // Chỉ dành cho SUPER_ADMIN
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
    FULL_ACCESS: 'users:full_access',
  },

  // Role Management Permissions
  ROLES: {
    CREATE: 'roles:create',
    READ: 'roles:read',
    UPDATE: 'roles:update',
    DELETE: 'roles:delete',
    RESTORE: 'roles:restore',
    VIEW_DELETED: 'roles:view_deleted',
    PERMANENT_DELETE: 'roles:permanent_delete',
    BULK_DELETE: 'roles:bulk_delete',
    BULK_RESTORE: 'roles:bulk_restore',
    BULK_PERMANENT_DELETE: 'roles:bulk_permanent_delete',
    FULL_ACCESS: 'roles:full_access',
  },

  // Permission Management
  PERMISSIONS: {
    CREATE: 'permissions:create',
    READ: 'permissions:read',
    UPDATE: 'permissions:update',
    DELETE: 'permissions:delete',
    RESTORE: 'permissions:restore',
    VIEW_DELETED: 'permissions:view_deleted',
    PERMANENT_DELETE: 'permissions:permanent_delete',
    BULK_DELETE: 'permissions:bulk_delete',
    BULK_RESTORE: 'permissions:bulk_restore',
    BULK_PERMANENT_DELETE: 'permissions:bulk_permanent_delete',
    FULL_ACCESS: 'permissions:full_access',
  },

  // Blog Management Permissions
  BLOGS: {
    CREATE: 'blogs:create',
    READ: 'blogs:read',
    UPDATE: 'blogs:update',
    DELETE: 'blogs:delete',
    RESTORE: 'blogs:restore',
    VIEW_DELETED: 'blogs:view_deleted',
    PERMANENT_DELETE: 'blogs:permanent_delete',
    BULK_DELETE: 'blogs:bulk_delete',
    BULK_RESTORE: 'blogs:bulk_restore',
    BULK_PERMANENT_DELETE: 'blogs:bulk_permanent_delete',
    LIKE: 'blogs:like',
    BOOKMARK: 'blogs:bookmark',
    FULL_ACCESS: 'blogs:full_access',
  },

  // Content Types (Categories + Tags) Management Permissions
  CONTENT_TYPES: {
    CREATE: 'content_types:create',
    READ: 'content_types:read',
    UPDATE: 'content_types:update',
    DELETE: 'content_types:delete',
    RESTORE: 'content_types:restore',
    VIEW_DELETED: 'content_types:view_deleted',
    PERMANENT_DELETE: 'content_types:permanent_delete',
    BULK_DELETE: 'content_types:bulk_delete',
    BULK_RESTORE: 'content_types:bulk_restore',
    BULK_PERMANENT_DELETE: 'content_types:bulk_permanent_delete',
    FULL_ACCESS: 'content_types:full_access',
  },

  // Category Management Permissions
  CATEGORIES: {
    CREATE: 'categories:create',
    READ: 'categories:read',
    UPDATE: 'categories:update',
    DELETE: 'categories:delete',
    RESTORE: 'categories:restore',
    VIEW_DELETED: 'categories:view_deleted',
    PERMANENT_DELETE: 'categories:permanent_delete',
    BULK_DELETE: 'categories:bulk_delete',
    BULK_RESTORE: 'categories:bulk_restore',
    BULK_PERMANENT_DELETE: 'categories:bulk_permanent_delete',
    FULL_ACCESS: 'categories:full_access',
  },

  // Tag Management Permissions
  TAGS: {
    CREATE: 'tags:create',
    READ: 'tags:read',
    UPDATE: 'tags:update',
    DELETE: 'tags:delete',
    RESTORE: 'tags:restore',
    VIEW_DELETED: 'tags:view_deleted',
    PERMANENT_DELETE: 'tags:permanent_delete',
    BULK_DELETE: 'tags:bulk_delete',
    BULK_RESTORE: 'tags:bulk_restore',
    BULK_PERMANENT_DELETE: 'tags:bulk_permanent_delete',
    FULL_ACCESS: 'tags:full_access',
  },

  // Media Management Permissions
  MEDIA: {
    CREATE: 'media:create',
    READ: 'media:read',
    UPDATE: 'media:update',
    DELETE: 'media:delete',
    RESTORE: 'media:restore',
    VIEW_DELETED: 'media:view_deleted',
    PERMANENT_DELETE: 'media:permanent_delete',
    BULK_DELETE: 'media:bulk_delete',
    BULK_RESTORE: 'media:bulk_restore',
    BULK_PERMANENT_DELETE: 'media:bulk_permanent_delete',
    FULL_ACCESS: 'media:full_access',
  },

  // Recruitment Management Permissions
  RECRUITMENT: {
    CREATE: 'recruitment:create',
    READ: 'recruitment:read',
    UPDATE: 'recruitment:update',
    DELETE: 'recruitment:delete',
    RESTORE: 'recruitment:restore',
    VIEW_DELETED: 'recruitment:view_deleted',
    PERMANENT_DELETE: 'recruitment:permanent_delete',
    BULK_DELETE: 'recruitment:bulk_delete',
    BULK_RESTORE: 'recruitment:bulk_restore',
    BULK_PERMANENT_DELETE: 'recruitment:bulk_permanent_delete',
    APPLY: 'recruitment:apply',
    FULL_ACCESS: 'recruitment:full_access',
  },

  // Service Management Permissions
  SERVICES: {
    CREATE: 'services:create',
    READ: 'services:read',
    UPDATE: 'services:update',
    DELETE: 'services:delete',
    RESTORE: 'services:restore',
    VIEW_DELETED: 'services:view_deleted',
    PERMANENT_DELETE: 'services:permanent_delete',
    BULK_DELETE: 'services:bulk_delete',
    BULK_RESTORE: 'services:bulk_restore',
    BULK_PERMANENT_DELETE: 'services:bulk_permanent_delete',
    FULL_ACCESS: 'services:full_access',
  },

  // Contact Management Permissions
  CONTACTS: {
    CREATE: 'contacts:create',
    READ: 'contacts:read',
    UPDATE: 'contacts:update',
    DELETE: 'contacts:delete',
    RESTORE: 'contacts:restore',
    VIEW_DELETED: 'contacts:view_deleted',
    PERMANENT_DELETE: 'contacts:permanent_delete',
    BULK_DELETE: 'contacts:bulk_delete',
    BULK_RESTORE: 'contacts:bulk_restore',
    BULK_PERMANENT_DELETE: 'contacts:bulk_permanent_delete',
    FULL_ACCESS: 'contacts:full_access',
  },

  // Comment Management Permissions
  COMMENTS: {
    CREATE: 'comments:create',
    READ: 'comments:read',
    UPDATE: 'comments:update',
    DELETE: 'comments:delete',
    RESTORE: 'comments:restore',
    VIEW_DELETED: 'comments:view_deleted',
    PERMANENT_DELETE: 'comments:permanent_delete',
    BULK_DELETE: 'comments:bulk_delete',
    BULK_RESTORE: 'comments:bulk_restore',
    BULK_PERMANENT_DELETE: 'comments:bulk_permanent_delete',
    FULL_ACCESS: 'comments:full_access',
  },

  // Analytics & Reports Permissions
  ANALYTICS: {
    CREATE: 'analytics:create',
    READ: 'analytics:read',
    UPDATE: 'analytics:update',
    DELETE: 'analytics:delete',
    RESTORE: 'analytics:restore',
    VIEW_DELETED: 'analytics:view_deleted',
    PERMANENT_DELETE: 'analytics:permanent_delete',
    BULK_DELETE: 'analytics:bulk_delete',
    BULK_RESTORE: 'analytics:bulk_restore',
    BULK_PERMANENT_DELETE: 'analytics:bulk_permanent_delete',
    FULL_ACCESS: 'analytics:full_access',
  },

  // Settings Management Permissions
  SETTINGS: {
    CREATE: 'settings:create',
    READ: 'settings:read',
    UPDATE: 'settings:update',
    DELETE: 'settings:delete',
    RESTORE: 'settings:restore',
    VIEW_DELETED: 'settings:view_deleted',
    PERMANENT_DELETE: 'settings:permanent_delete',
    BULK_DELETE: 'settings:bulk_delete',
    BULK_RESTORE: 'settings:bulk_restore',
    BULK_PERMANENT_DELETE: 'settings:bulk_permanent_delete',
    FULL_ACCESS: 'settings:full_access',
  },
} as const;

/**
 * Danh sách tất cả permissions dưới dạng array
 */
export const ALL_PERMISSIONS = Object.values(PERMISSIONS).flatMap((group) =>
  Object.values(group),
);

/**
 * Định nghĩa các role mặc định và permissions của chúng
 */
export const DEFAULT_ROLES = {
  SUPER_ADMIN: {
    name: 'Super Admin',
    description: 'Full system access with all permissions',
    permissions: [
      // Full access permission
      PERMISSIONS.ADMIN.FULL_ACCESS,
      // Admin permissions
      ...Object.values(PERMISSIONS.ADMIN),
      // All other permissions
      ...Object.values(PERMISSIONS.USERS),
      ...Object.values(PERMISSIONS.ROLES),
      ...Object.values(PERMISSIONS.PERMISSIONS),
      ...Object.values(PERMISSIONS.BLOGS),
      ...Object.values(PERMISSIONS.CONTENT_TYPES),
      ...Object.values(PERMISSIONS.CATEGORIES),
      ...Object.values(PERMISSIONS.TAGS),
      ...Object.values(PERMISSIONS.MEDIA),
      ...Object.values(PERMISSIONS.COMMENTS),
      ...Object.values(PERMISSIONS.RECRUITMENT),
      ...Object.values(PERMISSIONS.SERVICES),
      ...Object.values(PERMISSIONS.CONTACTS),
      ...Object.values(PERMISSIONS.ANALYTICS),
      ...Object.values(PERMISSIONS.SETTINGS),
    ],
  },

  ADMIN: {
    name: 'Admin',
    description: 'Administrative access with most permissions',
    permissions: [
      // User management
      PERMISSIONS.USERS.FULL_ACCESS,
      // Role management
      PERMISSIONS.ROLES.FULL_ACCESS,
      // Content management
      PERMISSIONS.BLOGS.FULL_ACCESS,
      PERMISSIONS.CONTENT_TYPES.FULL_ACCESS,
      // Media management
      PERMISSIONS.MEDIA.FULL_ACCESS,
      // Comment management
      ...Object.values(PERMISSIONS.COMMENTS),
      // Recruitment management
      PERMISSIONS.RECRUITMENT.FULL_ACCESS,
      // Service management
      ...Object.values(PERMISSIONS.SERVICES),
      // Contact management
      ...Object.values(PERMISSIONS.CONTACTS),
      // Analytics
      ...Object.values(PERMISSIONS.ANALYTICS),
      // Settings
      PERMISSIONS.SETTINGS.FULL_ACCESS,
    ],
  },

  EDITOR: {
    name: 'Editor',
    description: 'Content creation and editing permissions',
    permissions: [
      // Blog management
      PERMISSIONS.BLOGS.CREATE,
      PERMISSIONS.BLOGS.READ,
      PERMISSIONS.BLOGS.UPDATE,
      // Category & tag management
      PERMISSIONS.CONTENT_TYPES.READ,
      PERMISSIONS.CONTENT_TYPES.CREATE,
      PERMISSIONS.CATEGORIES.READ,
      PERMISSIONS.CATEGORIES.CREATE,
      PERMISSIONS.TAGS.READ,
      PERMISSIONS.TAGS.CREATE,
      // Media management
      PERMISSIONS.MEDIA.CREATE,
      PERMISSIONS.MEDIA.READ,
      PERMISSIONS.MEDIA.UPDATE,
      // User permissions
      PERMISSIONS.USERS.READ,
      PERMISSIONS.USERS.UPDATE,
      // Comment management
      PERMISSIONS.COMMENTS.READ,
      PERMISSIONS.COMMENTS.UPDATE,
    ],
  },

  MODERATOR: {
    name: 'Moderator',
    description: 'Content moderation and basic management',
    permissions: [
      // Blog moderation
      PERMISSIONS.BLOGS.READ,
      PERMISSIONS.BLOGS.UPDATE,
      PERMISSIONS.BLOGS.DELETE,
      // Comment moderation
      ...Object.values(PERMISSIONS.COMMENTS),
      // Basic content access
      PERMISSIONS.CONTENT_TYPES.READ,
      PERMISSIONS.CATEGORIES.READ,
      PERMISSIONS.TAGS.READ,
      PERMISSIONS.MEDIA.READ,
      // User profile
      PERMISSIONS.USERS.READ,
      PERMISSIONS.USERS.UPDATE,
      // Contact management
      PERMISSIONS.CONTACTS.READ,
      PERMISSIONS.CONTACTS.UPDATE,
    ],
  },

  AUTHOR: {
    name: 'Author',
    description: 'Content creation permissions for own content',
    permissions: [
      // Blog creation
      PERMISSIONS.BLOGS.CREATE,
      PERMISSIONS.BLOGS.READ,
      PERMISSIONS.BLOGS.UPDATE,
      // Basic content access
      PERMISSIONS.CONTENT_TYPES.READ,
      PERMISSIONS.CATEGORIES.READ,
      PERMISSIONS.TAGS.READ,
      PERMISSIONS.TAGS.CREATE,
      // Media for own content
      PERMISSIONS.MEDIA.CREATE,
      PERMISSIONS.MEDIA.READ,
      // User profile
      PERMISSIONS.USERS.READ,
      PERMISSIONS.USERS.UPDATE,
      // Comments
      PERMISSIONS.COMMENTS.READ,
      PERMISSIONS.COMMENTS.UPDATE,
    ],
  },

  SUBSCRIBER: {
    name: 'Subscriber',
    description: 'Basic read access and profile management',
    permissions: [
      // Read access
      PERMISSIONS.BLOGS.READ,
      PERMISSIONS.CONTENT_TYPES.READ,
      PERMISSIONS.CATEGORIES.READ,
      PERMISSIONS.TAGS.READ,
      // Comment permissions
      PERMISSIONS.COMMENTS.CREATE,
      PERMISSIONS.COMMENTS.READ,
      // Profile management
      PERMISSIONS.USERS.READ,
      PERMISSIONS.USERS.UPDATE,
    ],
  },

  HR_MANAGER: {
    name: 'HR Manager',
    description: 'Recruitment and HR management permissions',
    permissions: [
      // Recruitment management
      ...Object.values(PERMISSIONS.RECRUITMENT),
      // Basic content access
      PERMISSIONS.BLOGS.READ,
      PERMISSIONS.CONTENT_TYPES.READ,
      PERMISSIONS.CATEGORIES.READ,
      // User management
      PERMISSIONS.USERS.READ,
      PERMISSIONS.USERS.UPDATE,
      // Contact management
      PERMISSIONS.CONTACTS.READ,
      PERMISSIONS.CONTACTS.UPDATE,
      // Analytics
      PERMISSIONS.ANALYTICS.READ,
    ],
  },
} as const;

/**
 * Resource ownership permissions - các action có thể thực hiện trên content của chính mình
 */
export const OWNERSHIP_PERMISSIONS = {
  BLOGS: [
    PERMISSIONS.BLOGS.UPDATE,
    PERMISSIONS.BLOGS.DELETE,
    PERMISSIONS.BLOGS.RESTORE,
  ],
  CONTENT_TYPES: [
    PERMISSIONS.CONTENT_TYPES.UPDATE,
    PERMISSIONS.CONTENT_TYPES.DELETE,
    PERMISSIONS.CONTENT_TYPES.RESTORE,
  ],
  MEDIA: [
    PERMISSIONS.MEDIA.UPDATE,
    PERMISSIONS.MEDIA.DELETE,
    PERMISSIONS.MEDIA.RESTORE,
  ],
  COMMENTS: [
    PERMISSIONS.COMMENTS.UPDATE,
    PERMISSIONS.COMMENTS.DELETE,
    PERMISSIONS.COMMENTS.RESTORE,
  ],
  RECRUITMENT: [
    PERMISSIONS.RECRUITMENT.UPDATE,
    PERMISSIONS.RECRUITMENT.DELETE,
    PERMISSIONS.RECRUITMENT.RESTORE,
  ],
} as const;
