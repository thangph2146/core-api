import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Permission, Prisma } from '@prisma/client';
import {
  CreatePermissionDto,
  UpdatePermissionDto,
  PermissionQueryDto,
  PermissionStatsDto,
  PermissionResponseDto,
  PermissionListResponseDto,
  BulkPermissionOperationDto,
  BulkDeleteResponseDto,
  BulkRestoreResponseDto,
  PermissionGroupDto,
} from './dto/permission.dto';

// =============================================================================
// CONSTANTS & CONFIGURATIONS
// =============================================================================

const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 100;
const MAX_BULK_OPERATION_SIZE = 50;

@Injectable()
export class PermissionService {
  private readonly logger = new Logger(PermissionService.name);

  constructor(private prisma: PrismaService) {}

  // =============================================================================
  // PUBLIC METHODS - CRUD OPERATIONS
  // =============================================================================

  /**
   * Lấy danh sách permissions với phân trang và lọc
   */
  /**
   * Lấy danh sách permissions với phân trang và lọc
   */
  async findAll(query: PermissionQueryDto): Promise<PermissionListResponseDto> {
    this.logger.debug(`Finding permissions with query: ${JSON.stringify(query)}`);

    const {
      page = 1,
      limit = 10,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      includeDeleted = false,
      deleted = false,
    } = query;

    // Validate and sanitize inputs
    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(MAX_PAGE_SIZE, Math.max(1, Number(limit) || DEFAULT_PAGE_SIZE));

    const skip = (pageNum - 1) * limitNum;
    const take = limitNum;

    try {
      // Build where clause
      const where: Prisma.PermissionWhereInput = {};

      // Handle deleted filter
      if (deleted) {
        where.deletedAt = { not: null };
      } else if (includeDeleted) {
        where.deletedAt = undefined;
      } else {
        where.deletedAt = null;
      }

      // Search filter
      if (search) {
        const searchTerm = search.trim();
        where.OR = [
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { description: { contains: searchTerm, mode: 'insensitive' } },
          { metaTitle: { contains: searchTerm, mode: 'insensitive' } },
          { metaDescription: { contains: searchTerm, mode: 'insensitive' } },
        ];
      }

      // Define sortable fields
      const validSortFields = [
        'id',
        'name',
        'description',
        'createdAt',
        'updatedAt',
        'deletedAt',
      ];
      const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';

      // Execute queries
      const [permissions, total] = await Promise.all([
        this.prisma.permission.findMany({
          where,
          skip,
          take,
          orderBy: { [sortField]: sortOrder },
        }),
        this.prisma.permission.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limitNum);

      this.logger.debug(`Found ${permissions.length} permissions out of ${total} total`);

      return {
        success: true,
        data: permissions.map(this.formatPermissionResponse),
        meta: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages,
          hasNextPage: pageNum < totalPages,
          hasPrevPage: pageNum > 1,
        },
      };
    } catch (error) {
      this.logger.error(`Error finding permissions: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Không thể lấy danh sách permissions');
    }
  }

  /**
   * Tìm permission theo ID
   */
  async findById(id: number): Promise<PermissionResponseDto | null> {
    this.logger.debug(`Finding permission by ID: ${id}`);

    try {
      const permission = await this.prisma.permission.findFirst({
        where: {
          id,
          deletedAt: null,
        },
      });

      return permission ? this.formatPermissionResponse(permission) : null;
    } catch (error) {
      this.logger.error(`Error finding permission by ID ${id}: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Không thể tìm permission');
    }
  }

  /**
   * Tìm permission theo name
   */
  async findByName(name: string): Promise<Permission | null> {
    this.logger.debug(`Finding permission by name: ${name}`);

    try {
      return await this.prisma.permission.findFirst({
        where: {
          name,
          deletedAt: null,
        },
      });
    } catch (error) {
      this.logger.error(`Error finding permission by name ${name}: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Không thể tìm permission');
    }
  }

  /**
   * Tạo permission mới
   */
  async create(createPermissionDto: CreatePermissionDto): Promise<PermissionResponseDto> {
    this.logger.log(`Creating new permission: ${createPermissionDto.name}`);

    try {
      const { name, description, metaTitle, metaDescription } = createPermissionDto;

      // Validate name format (should be resource:action)
      if (!name.includes(':')) {
        throw new BadRequestException('Tên permission phải có định dạng "resource:action"');
      }

      // Check if permission with same name already exists
      const existingPermission = await this.findByName(name);
      if (existingPermission) {
        throw new ConflictException(`Permission với tên '${name}' đã tồn tại`);
      }

      const permission = await this.prisma.permission.create({
        data: {
          name: name.trim(),
          description: description?.trim() || null,
          metaTitle: metaTitle?.trim() || null,
          metaDescription: metaDescription?.trim() || null,
        },
      });

      this.logger.log(`✅ Permission '${name}' đã được tạo thành công với ID: ${permission.id}`);
      return this.formatPermissionResponse(permission);
    } catch (error) {
      if (error instanceof ConflictException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Error creating permission: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Không thể tạo permission');
    }
  }

  /**
   * Cập nhật permission
   */
  async update(
    id: number,
    updatePermissionDto: UpdatePermissionDto,
  ): Promise<PermissionResponseDto> {
    this.logger.log(`Updating permission ID: ${id}`);

    try {
      // Validate permission exists
      const existingPermission = await this.validatePermissionExists(id);

      // Validate name format if being updated
      if (updatePermissionDto.name && !updatePermissionDto.name.includes(':')) {
        throw new BadRequestException('Tên permission phải có định dạng "resource:action"');
      }

      // Check name conflict if being updated
      if (
        updatePermissionDto.name &&
        updatePermissionDto.name !== existingPermission.name
      ) {
        const conflictPermission = await this.findByName(updatePermissionDto.name);
        if (conflictPermission) {
          throw new ConflictException(`Permission với tên '${updatePermissionDto.name}' đã tồn tại`);
        }
      }

      const permission = await this.prisma.permission.update({
        where: { id },
        data: {
          name: updatePermissionDto.name?.trim(),
          description: updatePermissionDto.description?.trim() || null,
          metaTitle: updatePermissionDto.metaTitle?.trim() || null,
          metaDescription: updatePermissionDto.metaDescription?.trim() || null,
          updatedAt: new Date(),
        },
      });

      this.logger.log(`✅ Permission ID ${id} đã được cập nhật thành công`);
      return this.formatPermissionResponse(permission);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Error updating permission ${id}: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Không thể cập nhật permission');
    }
  }

  /**
   * Xóa mềm permission
   */
  async delete(id: number): Promise<void> {
    this.logger.log(`Soft deleting permission ID: ${id}`);

    try {
      // Validate permission exists
      await this.validatePermissionExists(id);

      await this.prisma.permission.update({
        where: { id },
        data: {
          deletedAt: new Date(),
        },
      });

      this.logger.log(`✅ Permission ID ${id} đã được xóa mềm thành công`);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Error deleting permission ${id}: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Không thể xóa permission');
    }
  }

  /**
   * Khôi phục permission đã xóa
   */
  async restore(id: number): Promise<PermissionResponseDto> {
    this.logger.log(`Restoring permission ID: ${id}`);

    try {
      const permission = await this.prisma.permission.findFirst({
        where: { id, deletedAt: { not: null } },
      });

      if (!permission) {
        throw new NotFoundException(`Permission đã xóa với ID ${id} không tồn tại`);
      }

      const restoredPermission = await this.prisma.permission.update({
        where: { id },
        data: {
          deletedAt: null,
          updatedAt: new Date(),
        },
      });

      this.logger.log(`✅ Permission ID ${id} đã được khôi phục thành công`);
      return this.formatPermissionResponse(restoredPermission);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Error restoring permission ${id}: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Không thể khôi phục permission');
    }
  }

  /**
   * Lấy thống kê permissions
   */
  async getStats(): Promise<PermissionStatsDto> {
    this.logger.debug('Getting permission statistics');

    try {
      const [total, active, deleted] = await Promise.all([
        this.prisma.permission.count(),
        this.prisma.permission.count({ where: { deletedAt: null } }),
        this.prisma.permission.count({ where: { deletedAt: { not: null } } }),
      ]);

      return {
        total,
        active,
        deleted,
      };
    } catch (error) {
      this.logger.error(`Error getting permission stats: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Không thể lấy thống kê permissions');
    }
  }

  /**
   * Lấy grouped options cho MultiSelect
   */
  async getOptions(): Promise<PermissionGroupDto[]> {
    this.logger.debug('Getting permission options for MultiSelect');

    try {
      const permissions = await this.prisma.permission.findMany({
        where: { deletedAt: null },
        select: {
          id: true,
          name: true,
        },
        orderBy: {
          name: 'asc',
        },
      });

      const groupedPermissions = permissions.reduce(
        (acc, permission) => {
          const [groupName] = permission.name.split(':');
          const capitalizedGroup =
            groupName.charAt(0).toUpperCase() + groupName.slice(1);

          if (!acc[capitalizedGroup]) {
            acc[capitalizedGroup] = [];
          }

          acc[capitalizedGroup].push({
            value: permission.id,
            label: permission.name,
          });

          return acc;
        },
        {} as Record<string, { value: number; label: string }[]>,
      );

      return Object.entries(groupedPermissions).map(([group, options]) => ({
        group,
        options,
      }));
    } catch (error) {
      this.logger.error(`Error getting permission options: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Không thể lấy options permissions');
    }
  }

  // =============================================================================
  // BULK OPERATIONS
  // =============================================================================

  /**
   * Bulk delete permissions
   */
  async bulkDelete(permissionIds: number[]): Promise<BulkDeleteResponseDto> {
    this.logger.log(`Bulk deleting ${permissionIds.length} permissions`);

    if (permissionIds.length > MAX_BULK_OPERATION_SIZE) {
      throw new BadRequestException(`Không thể xóa quá ${MAX_BULK_OPERATION_SIZE} permissions cùng lúc`);
    }

    const deletedIds: number[] = [];
    const failedIds: number[] = [];

    for (const id of permissionIds) {
      try {
        await this.delete(id);
        deletedIds.push(id);
      } catch (error) {
        this.logger.warn(`Failed to delete permission ${id}: ${error.message}`);
        failedIds.push(id);
      }
    }

    return {
      deletedCount: deletedIds.length,
      deletedIds,
      failedIds,
      message: `Đã xóa ${deletedIds.length}/${permissionIds.length} permissions`,
    };
  }

  /**
   * Bulk restore permissions
   */
  async bulkRestore(permissionIds: number[]): Promise<BulkRestoreResponseDto> {
    this.logger.log(`Bulk restoring ${permissionIds.length} permissions`);

    if (permissionIds.length > MAX_BULK_OPERATION_SIZE) {
      throw new BadRequestException(`Không thể khôi phục quá ${MAX_BULK_OPERATION_SIZE} permissions cùng lúc`);
    }

    const restoredIds: number[] = [];
    const failedIds: number[] = [];

    for (const id of permissionIds) {
      try {
        await this.restore(id);
        restoredIds.push(id);
      } catch (error) {
        this.logger.warn(`Failed to restore permission ${id}: ${error.message}`);
        failedIds.push(id);
      }
    }

    return {
      restoredCount: restoredIds.length,
      restoredIds,
      failedIds,
      message: `Đã khôi phục ${restoredIds.length}/${permissionIds.length} permissions`,
    };
  }

  // =============================================================================
  // PRIVATE HELPER METHODS
  // =============================================================================

  /**
   * Format permission response cho API
   */
  private formatPermissionResponse(permission: Permission): PermissionResponseDto {
    return {
      id: permission.id,
      name: permission.name,
      description: permission.description,
      createdAt: permission.createdAt,
      updatedAt: permission.updatedAt,
      deletedAt: permission.deletedAt,
      metaTitle: permission.metaTitle,
      metaDescription: permission.metaDescription,
    };
  }

  /**
   * Validate permission exists and not deleted
   */
  private async validatePermissionExists(id: number): Promise<Permission> {
    const permission = await this.prisma.permission.findFirst({
      where: { id, deletedAt: null },
    });

    if (!permission) {
      throw new NotFoundException(`Permission với ID ${id} không tồn tại`);
    }

    return permission;
  }
}
