import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  PERMISSIONS,
  OWNERSHIP_PERMISSIONS,
} from '../constants/permissions.constants';

export interface ResourceOwnershipCheck {
  resourceType: string;
  resourceId: string | number;
  userId: number;
  action: string;
}

@Injectable()
export class ResourceOwnershipService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Kiểm tra xem user có quyền thực hiện action trên resource không
   * @param user - User object với role và permissions
   * @param resourceType - Loại resource (blogs, media, etc.)
   * @param resourceId - ID của resource
   * @param action - Action muốn thực hiện
   * @returns Promise<boolean>
   */
  async canUserAccessResource(
    user: any,
    resourceType: string,
    resourceId: string | number,
    action: string,
  ): Promise<boolean> {
    // Super Admin có quyền với tất cả
    if (this.isSuperAdmin(user)) {
      return true;
    }

    const userPermissions = this.getUserPermissions(user);

    // Kiểm tra quyền "manage all" cho resource type này
    if (this.hasManageAllPermission(userPermissions, resourceType)) {
      return true;
    }

    // Kiểm tra quyền cơ bản cho action
    if (!this.hasBasicPermission(userPermissions, resourceType, action)) {
      return false;
    }

    // Nếu là action ownership, kiểm tra ownership
    if (this.isOwnershipAction(resourceType, action)) {
      return await this.checkResourceOwnership(
        user.id,
        resourceType,
        resourceId,
      );
    }

    return true;
  }

  /**
   * Throw exception nếu user không có quyền
   */
  async requireResourceAccess(
    user: any,
    resourceType: string,
    resourceId: string | number,
    action: string,
  ): Promise<void> {
    const hasAccess = await this.canUserAccessResource(
      user,
      resourceType,
      resourceId,
      action,
    );

    if (!hasAccess) {
      throw new ForbiddenException(
        `Access denied. You don't have permission to ${action} this ${resourceType}.`,
      );
    }
  }
  /**
   * Kiểm tra ownership của resource
   */
  private async checkResourceOwnership(
    userId: number,
    resourceType: string,
    resourceId: string | number,
  ): Promise<boolean> {
    const id =
      typeof resourceId === 'string' ? parseInt(resourceId) : resourceId;

    try {
      switch (resourceType.toLowerCase()) {
        case 'blogs':
          const blog = await this.prisma.blog.findUnique({
            where: { id },
            select: { authorId: true },
          });
          return blog?.authorId === userId;

        case 'media':
          const media = await this.prisma.media.findUnique({
            where: { id },
            select: { uploadedById: true },
          });
          return media?.uploadedById === userId;

        case 'recruitment':
          const recruitment = await this.prisma.recruitment.findUnique({
            where: { id },
            select: { authorId: true },
          });
          return recruitment?.authorId === userId;

        case 'blogcomments':
        case 'comments':
          const comment = await this.prisma.blogComment.findUnique({
            where: { id },
            select: { authorId: true },
          });
          return comment?.authorId === userId;

        default:
          return false;
      }
    } catch (error) {
      return false;
    }
  }

  /**
   * Kiểm tra xem action có cần ownership không
   */
  private isOwnershipAction(resourceType: string, action: string): boolean {
    const ownershipPermissions = this.getOwnershipPermissions(resourceType);
    return ownershipPermissions.includes(action);
  }
  /**
   * Lấy danh sách permissions cần ownership cho resource type
   */
  private getOwnershipPermissions(resourceType: string): readonly string[] {
    switch (resourceType.toLowerCase()) {
      case 'blogs':
        return OWNERSHIP_PERMISSIONS.BLOGS;
      case 'media':
        return OWNERSHIP_PERMISSIONS.MEDIA;
      case 'comments':
      case 'blogcomments':
        return OWNERSHIP_PERMISSIONS.COMMENTS;
      case 'recruitment':
        return OWNERSHIP_PERMISSIONS.RECRUITMENT;
      default:
        return [];
    }
  }

  /**
   * Kiểm tra xem user có quyền "manage all" không
   */
  private hasManageAllPermission(
    userPermissions: string[],
    resourceType: string,
  ): boolean {
    switch (resourceType.toLowerCase()) {
      case 'blogs':
        return userPermissions.includes(PERMISSIONS.BLOGS.MANAGE_ALL);
      case 'media':
        return userPermissions.includes(PERMISSIONS.MEDIA.MANAGE_ALL);
      case 'users':
        return userPermissions.includes(PERMISSIONS.USERS.MANAGE_ALL);
      case 'recruitment':
        return userPermissions.includes(PERMISSIONS.RECRUITMENT.MANAGE_ALL);
      case 'services':
        return userPermissions.includes(PERMISSIONS.SERVICES.MANAGE_ALL);
      default:
        return false;
    }
  }

  /**
   * Kiểm tra quyền cơ bản cho action
   */
  private hasBasicPermission(
    userPermissions: string[],
    resourceType: string,
    action: string,
  ): boolean {
    // Mapping action names to permission names
    const permissionMap: Record<string, string> = {
      create: 'create',
      read: 'read',
      update: 'update',
      delete: 'delete',
      publish: 'publish',
      unpublish: 'unpublish',
      moderate: 'moderate',
      upload: 'upload',
      organize: 'organize',
    };

    const permissionAction =
      permissionMap[action.toLowerCase()] || action.toLowerCase();
    const permission = `${resourceType.toLowerCase()}:${permissionAction}`;

    return userPermissions.includes(permission);
  }

  /**
   * Kiểm tra xem user có phải Super Admin không
   */
  private isSuperAdmin(user: any): boolean {
    const userPermissions = this.getUserPermissions(user);
    return userPermissions.includes(PERMISSIONS.ADMIN.FULL_ACCESS);
  }

  /**
   * Lấy danh sách permissions của user
   */
  private getUserPermissions(user: any): string[] {
    return user.role?.permissions?.map((perm: any) => perm.name) || [];
  }

  /**
   * Tạo filter query để chỉ lấy resources mà user có quyền xem
   */
  async getResourceFilter(user: any, resourceType: string): Promise<any> {
    // Super Admin xem được tất cả
    if (this.isSuperAdmin(user)) {
      return {};
    }

    const userPermissions = this.getUserPermissions(user);

    // Nếu có quyền "manage all", xem được tất cả
    if (this.hasManageAllPermission(userPermissions, resourceType)) {
      return {};
    } // Chỉ xem được resources của chính mình
    switch (resourceType.toLowerCase()) {
      case 'blogs':
        return { authorId: user.id };
      case 'media':
        return { uploadedById: user.id };
      case 'recruitment':
        return { authorId: user.id };
      case 'blogcomments':
      case 'comments':
        return { authorId: user.id };
      default:
        return { id: -1 }; // Không có quyền xem gì cả
    }
  }

  /**
   * Bulk check permissions cho multiple resources
   */
  async canUserAccessMultipleResources(
    user: any,
    resourceType: string,
    resourceIds: (string | number)[],
    action: string,
  ): Promise<boolean[]> {
    // Super Admin có quyền với tất cả
    if (this.isSuperAdmin(user)) {
      return new Array(resourceIds.length).fill(true);
    }

    const userPermissions = this.getUserPermissions(user);

    // Kiểm tra quyền "manage all"
    if (this.hasManageAllPermission(userPermissions, resourceType)) {
      return new Array(resourceIds.length).fill(true);
    }

    // Kiểm tra quyền cơ bản cho action
    if (!this.hasBasicPermission(userPermissions, resourceType, action)) {
      return new Array(resourceIds.length).fill(false);
    }

    // Nếu là ownership action, kiểm tra từng resource
    if (this.isOwnershipAction(resourceType, action)) {
      const results = await Promise.all(
        resourceIds.map((id) =>
          this.checkResourceOwnership(user.id, resourceType, id),
        ),
      );
      return results;
    }

    return new Array(resourceIds.length).fill(true);
  }
}
