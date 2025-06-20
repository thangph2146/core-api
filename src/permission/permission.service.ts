import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Permission, Prisma } from '@prisma/client';
import {
  CreatePermissionDto,
  UpdatePermissionDto,
  PermissionQueryDto,
  PermissionStatsDto,
} from './dto/permission.dto';

@Injectable()
export class PermissionService {
  constructor(private prisma: PrismaService) {}
  async findAll(query: PermissionQueryDto) {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      includeDeleted = false,
      deleted = false,
    } = query;

    // Ensure numbers are properly converted
    const pageNum = typeof page === 'string' ? parseInt(page, 10) : page;
    const limitNum = typeof limit === 'string' ? parseInt(limit, 10) : limit;

    const skip = (pageNum - 1) * limitNum;
    const take = limitNum;

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
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { metaTitle: { contains: search, mode: 'insensitive' } },
        { metaDescription: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Define sortable fields
    const validSortFields = [
      'id',
      'name',
      'description',
      'createdAt',
      'updatedAt',
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

    return {
      success: true,
      data: permissions,
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      },
    };
  }

  async findById(id: number): Promise<Permission | null> {
    return this.prisma.permission.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });
  }

  async findByName(name: string): Promise<Permission | null> {
    return this.prisma.permission.findFirst({
      where: {
        name,
        deletedAt: null,
      },
    });
  }
  async create(createPermissionDto: CreatePermissionDto): Promise<Permission> {
    const { name, description, metaTitle, metaDescription } = createPermissionDto;

    // Check if permission with same name already exists
    const existingPermission = await this.findByName(name);
    if (existingPermission) {
      throw new ConflictException(
        `Permission with name '${name}' already exists`
      );
    }

    return this.prisma.permission.create({
      data: {
        name,
        description,
        metaTitle,
        metaDescription,
      },
    });
  }

  async update(
    id: number,
    updatePermissionDto: UpdatePermissionDto
  ): Promise<Permission> {
    const permission = await this.findById(id);
    if (!permission) {
      throw new NotFoundException(`Permission with ID ${id} not found`);
    }

    // Check if name is being updated and if it conflicts
    if (updatePermissionDto.name && updatePermissionDto.name !== permission.name) {
      const existingPermission = await this.findByName(updatePermissionDto.name);
      if (existingPermission) {
        throw new ConflictException(
          `Permission with name '${updatePermissionDto.name}' already exists`
        );
      }
    }

    return this.prisma.permission.update({
      where: { id },
      data: {
        ...updatePermissionDto,
        updatedAt: new Date(),
      },
    });
  }

  async delete(id: number): Promise<void> {
    const permission = await this.findById(id);
    if (!permission) {
      throw new NotFoundException(`Permission with ID ${id} not found`);
    }

    // Soft delete
    await this.prisma.permission.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  async restore(id: number): Promise<Permission> {
    const permission = await this.prisma.permission.findFirst({
      where: { id, deletedAt: { not: null } },
    });

    if (!permission) {
      throw new NotFoundException(
        `Deleted permission with ID ${id} not found`
      );
    }

    return this.prisma.permission.update({
      where: { id },
      data: {
        deletedAt: null,
        updatedAt: new Date(),
      },
    });
  }
  async getStats(): Promise<PermissionStatsDto> {
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
  }
}
