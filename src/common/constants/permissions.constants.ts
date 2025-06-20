/**
 * Định nghĩa toàn bộ permissions trong hệ thống
 * Tuân theo chuẩn: {resource}:{action}
 */

export const PERMISSIONS = {
  // System Admin Permissions
  ADMIN: {
    FULL_ACCESS: 'admin:full_access',
    SYSTEM_SETTINGS: 'admin:system_settings',
    VIEW_LOGS: 'admin:view_logs',
    MANAGE_SESSIONS: 'admin:manage_sessions',
    MAINTENANCE_MODE: 'admin:maintenance_mode',
  },

  // User Management Permissions
  USERS: {
    CREATE: 'users:create',
    READ: 'users:read',
    UPDATE: 'users:update',
    DELETE: 'users:delete',
    MANAGE_ALL: 'users:manage_all',
    VIEW_PROFILE: 'users:view_profile',
    UPDATE_OWN_PROFILE: 'users:update_own_profile',
    CHANGE_PASSWORD: 'users:change_password',
    RESET_PASSWORD: 'users:reset_password',
    IMPERSONATE: 'users:impersonate',
  },

  // Role Management Permissions
  ROLES: {
    CREATE: 'roles:create',
    READ: 'roles:read',
    UPDATE: 'roles:update',
    DELETE: 'roles:delete',
    ASSIGN_PERMISSIONS: 'roles:assign_permissions',
    ASSIGN_TO_USERS: 'roles:assign_to_users',
  },

  // Permission Management
  PERMISSIONS: {
    READ: 'permissions:read',
    MANAGE: 'permissions:manage',
  },

  // Blog Management Permissions
  BLOGS: {
    CREATE: 'blogs:create',
    READ: 'blogs:read',
    UPDATE: 'blogs:update',
    DELETE: 'blogs:delete',
    PUBLISH: 'blogs:publish',
    UNPUBLISH: 'blogs:unpublish',
    MANAGE_ALL: 'blogs:manage_all',
    MODERATE: 'blogs:moderate',
    VIEW_DRAFTS: 'blogs:view_drafts',
    SCHEDULE: 'blogs:schedule',
  },

  // Category Management Permissions
  CATEGORIES: {
    CREATE: 'categories:create',
    READ: 'categories:read',
    UPDATE: 'categories:update',
    DELETE: 'categories:delete',
    MANAGE_HIERARCHY: 'categories:manage_hierarchy',
  },

  // Tag Management Permissions
  TAGS: {
    CREATE: 'tags:create',
    READ: 'tags:read',
    UPDATE: 'tags:update',
    DELETE: 'tags:delete',
  },

  // Media Management Permissions
  MEDIA: {
    UPLOAD: 'media:upload',
    READ: 'media:read',
    UPDATE: 'media:update',
    DELETE: 'media:delete',
    MANAGE_ALL: 'media:manage_all',
    ORGANIZE: 'media:organize',
  },

  // Comment Management Permissions
  COMMENTS: {
    CREATE: 'comments:create',
    READ: 'comments:read',
    UPDATE: 'comments:update',
    DELETE: 'comments:delete',
    MODERATE: 'comments:moderate',
    APPROVE: 'comments:approve',
  },

  // Recruitment Management Permissions
  RECRUITMENT: {
    CREATE: 'recruitment:create',
    READ: 'recruitment:read',
    UPDATE: 'recruitment:update',
    DELETE: 'recruitment:delete',
    PUBLISH: 'recruitment:publish',
    MANAGE_ALL: 'recruitment:manage_all',
    VIEW_APPLICATIONS: 'recruitment:view_applications',
    MANAGE_APPLICATIONS: 'recruitment:manage_applications',
  },

  // Service Management Permissions
  SERVICES: {
    CREATE: 'services:create',
    READ: 'services:read',
    UPDATE: 'services:update',
    DELETE: 'services:delete',
    MANAGE_ALL: 'services:manage_all',
  },

  // Contact Management Permissions
  CONTACTS: {
    READ: 'contacts:read',
    UPDATE: 'contacts:update',
    DELETE: 'contacts:delete',
    RESPOND: 'contacts:respond',
    EXPORT: 'contacts:export',
  },

  // Analytics & Reports Permissions
  ANALYTICS: {
    VIEW_BASIC: 'analytics:view_basic',
    VIEW_ADVANCED: 'analytics:view_advanced',
    EXPORT: 'analytics:export',
  },

  // Settings Management Permissions
  SETTINGS: {
    READ: 'settings:read',
    UPDATE: 'settings:update',
    MANAGE_SEO: 'settings:manage_seo',
    MANAGE_GENERAL: 'settings:manage_general',
  },
} as const;

/**
 * Danh sách tất cả permissions dưới dạng array
 */
export const ALL_PERMISSIONS = Object.values(PERMISSIONS).flatMap(group => 
  Object.values(group)
);

/**
 * Định nghĩa các role mặc định và permissions của chúng
 */
export const DEFAULT_ROLES = {
  SUPER_ADMIN: {
    name: 'Super Admin',
    description: 'Full system access with all permissions',
    permissions: [PERMISSIONS.ADMIN.FULL_ACCESS], // Super admin chỉ cần full access
  },
  
  ADMIN: {
    name: 'Admin',
    description: 'Administrative access with most permissions',
    permissions: [
      // User management
      ...Object.values(PERMISSIONS.USERS),
      // Role management
      ...Object.values(PERMISSIONS.ROLES),
      // Content management
      ...Object.values(PERMISSIONS.BLOGS),
      ...Object.values(PERMISSIONS.CATEGORIES),
      ...Object.values(PERMISSIONS.TAGS),
      // Media management
      ...Object.values(PERMISSIONS.MEDIA),
      // Comment moderation
      ...Object.values(PERMISSIONS.COMMENTS),
      // Recruitment management
      ...Object.values(PERMISSIONS.RECRUITMENT),
      // Service management
      ...Object.values(PERMISSIONS.SERVICES),
      // Contact management
      ...Object.values(PERMISSIONS.CONTACTS),
      // Analytics
      ...Object.values(PERMISSIONS.ANALYTICS),
      // Settings
      ...Object.values(PERMISSIONS.SETTINGS),
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
      PERMISSIONS.BLOGS.VIEW_DRAFTS,
      PERMISSIONS.BLOGS.SCHEDULE,
      // Category & tag management
      PERMISSIONS.CATEGORIES.READ,
      PERMISSIONS.CATEGORIES.CREATE,
      PERMISSIONS.TAGS.READ,
      PERMISSIONS.TAGS.CREATE,
      // Media management
      PERMISSIONS.MEDIA.UPLOAD,
      PERMISSIONS.MEDIA.READ,
      PERMISSIONS.MEDIA.UPDATE,
      // Basic user permissions
      PERMISSIONS.USERS.VIEW_PROFILE,
      PERMISSIONS.USERS.UPDATE_OWN_PROFILE,
      PERMISSIONS.USERS.CHANGE_PASSWORD,
      // Comment management
      PERMISSIONS.COMMENTS.READ,
      PERMISSIONS.COMMENTS.MODERATE,
    ],
  },

  MODERATOR: {
    name: 'Moderator',
    description: 'Content moderation and basic management',
    permissions: [
      // Blog moderation
      PERMISSIONS.BLOGS.READ,
      PERMISSIONS.BLOGS.MODERATE,
      PERMISSIONS.BLOGS.UNPUBLISH,
      // Comment moderation
      ...Object.values(PERMISSIONS.COMMENTS),
      // Basic content access
      PERMISSIONS.CATEGORIES.READ,
      PERMISSIONS.TAGS.READ,
      PERMISSIONS.MEDIA.READ,
      // User profile
      PERMISSIONS.USERS.VIEW_PROFILE,
      PERMISSIONS.USERS.UPDATE_OWN_PROFILE,
      PERMISSIONS.USERS.CHANGE_PASSWORD,
      // Contact management
      PERMISSIONS.CONTACTS.READ,
      PERMISSIONS.CONTACTS.RESPOND,
    ],
  },

  AUTHOR: {
    name: 'Author',
    description: 'Content creation permissions for own content',
    permissions: [
      // Blog creation (own content only)
      PERMISSIONS.BLOGS.CREATE,
      PERMISSIONS.BLOGS.READ,
      PERMISSIONS.BLOGS.UPDATE, // Will be restricted to own content
      PERMISSIONS.BLOGS.VIEW_DRAFTS,
      // Basic content access
      PERMISSIONS.CATEGORIES.READ,
      PERMISSIONS.TAGS.READ,
      PERMISSIONS.TAGS.CREATE,
      // Media for own content
      PERMISSIONS.MEDIA.UPLOAD,
      PERMISSIONS.MEDIA.READ,
      // User profile
      PERMISSIONS.USERS.VIEW_PROFILE,
      PERMISSIONS.USERS.UPDATE_OWN_PROFILE,
      PERMISSIONS.USERS.CHANGE_PASSWORD,
      // Comments on own content
      PERMISSIONS.COMMENTS.READ,
      PERMISSIONS.COMMENTS.MODERATE, // Only own content comments
    ],
  },

  SUBSCRIBER: {
    name: 'Subscriber',
    description: 'Basic read access and profile management',
    permissions: [
      // Read access
      PERMISSIONS.BLOGS.READ,
      PERMISSIONS.CATEGORIES.READ,
      PERMISSIONS.TAGS.READ,
      // Comment permissions
      PERMISSIONS.COMMENTS.CREATE,
      PERMISSIONS.COMMENTS.READ,
      // Profile management
      PERMISSIONS.USERS.VIEW_PROFILE,
      PERMISSIONS.USERS.UPDATE_OWN_PROFILE,
      PERMISSIONS.USERS.CHANGE_PASSWORD,
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
      PERMISSIONS.CATEGORIES.READ,
      // User management (limited)
      PERMISSIONS.USERS.READ,
      PERMISSIONS.USERS.VIEW_PROFILE,
      PERMISSIONS.USERS.UPDATE_OWN_PROFILE,
      PERMISSIONS.USERS.CHANGE_PASSWORD,
      // Contact management
      PERMISSIONS.CONTACTS.READ,
      PERMISSIONS.CONTACTS.RESPOND,
      // Analytics
      PERMISSIONS.ANALYTICS.VIEW_BASIC,
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
    PERMISSIONS.BLOGS.PUBLISH,
    PERMISSIONS.BLOGS.UNPUBLISH,
  ],
  MEDIA: [
    PERMISSIONS.MEDIA.UPDATE,
    PERMISSIONS.MEDIA.DELETE,
  ],
  COMMENTS: [
    PERMISSIONS.COMMENTS.UPDATE,
    PERMISSIONS.COMMENTS.DELETE,
    PERMISSIONS.COMMENTS.MODERATE,
  ],
  RECRUITMENT: [
    PERMISSIONS.RECRUITMENT.UPDATE,
    PERMISSIONS.RECRUITMENT.DELETE,
    PERMISSIONS.RECRUITMENT.PUBLISH,
  ],
} as const;
