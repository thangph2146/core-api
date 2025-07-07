import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { AdminStatusQueryDto, CreateStatusDto, UpdateStatusDto, StatusQueryDto } from './dto/status.dto';
import { IPaginatedResponse } from 'src/common/interfaces';

// This defines the full structure of the status object we want to return
const statusInclude: Prisma.StatusInclude = {
  _count: {
    select: {
      blogs: true,
      recruitmentPosts: true,
      services: true,
      jobApplications: true,
    },
  },
};

type FullStatus = Prisma.StatusGetPayload<{
  include: typeof statusInclude;
}>;

@Injectable()
export class StatusService {
  constructor(private prisma: PrismaService) {}

  // =================================================================================
  // PUBLIC METHODS
  // =================================================================================

  async findAll(query: StatusQueryDto): Promise<{ data: any[]; total: number; page: number; limit: number; totalPages: number; hasNext: boolean; hasPrevious: boolean }> {
    const { page = 1, limit = 10, search, type, sortBy, sortOrder } = query;
    const skip = (page - 1) * limit;
    const where: Prisma.StatusWhereInput = {
      deletedAt: null,
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...(type && { type }),
    };

    const orderBy: Prisma.StatusOrderByWithRelationInput = {};
    if (sortBy) {
      orderBy[sortBy as keyof Prisma.StatusOrderByWithRelationInput] = sortOrder || 'asc';
    } else {
      orderBy.createdAt = 'desc';
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.status.findMany({
        where,
        include: statusInclude,
        skip,
        take: limit,
        orderBy,
      }),
      this.prisma.status.count({ where }),
    ]);

    return {
      data: items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrevious: page > 1,
    };
  }

  async findOne(id: number) {
    const status = await this.prisma.status.findFirst({
      where: { id, deletedAt: null },
      include: statusInclude,
    });
    if (!status) {
      throw new NotFoundException(`Status with ID ${id} not found`);
    }
    return { data: status };
  }

  async getOptions(type?: string) {
    const where: Prisma.StatusWhereInput = {
      deletedAt: null,
      ...(type && { type }),
    };
    const statuses = await this.prisma.status.findMany({
      where,
      select: {
        id: true,
        name: true,
        type: true,
      },
      orderBy: { name: 'asc' },
    });
    return statuses.map((status) => ({
      value: status.id,
      label: status.name,
      type: status.type,
    }));
  }

  // =================================================================================
  // ADMIN METHODS
  // =================================================================================

  async findAllAdmin(query: AdminStatusQueryDto): Promise<{ data: any[]; total: number; page: number; limit: number; totalPages: number; hasNext: boolean; hasPrevious: boolean }> {
    const { page = 1, limit = 10, search, type, sortBy, sortOrder, showDeleted } = query;
    const skip = (page - 1) * limit;
    const where: Prisma.StatusWhereInput = {
      ...(showDeleted ? {} : { deletedAt: null }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...(type && { type }),
    };
    const orderBy: Prisma.StatusOrderByWithRelationInput = {};
    if (sortBy) {
      orderBy[sortBy as keyof Prisma.StatusOrderByWithRelationInput] = sortOrder || 'asc';
    } else {
      orderBy.createdAt = 'desc';
    }
    const [items, total] = await this.prisma.$transaction([
      this.prisma.status.findMany({
        where,
        include: statusInclude,
        skip,
        take: limit,
        orderBy,
      }),
      this.prisma.status.count({ where }),
    ]);
    return {
      data: items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrevious: page > 1,
    };
  }

  async findOneAdmin(id: number) {
    const status = await this.prisma.status.findUnique({
      where: { id },
      include: statusInclude,
    });
    if (!status) {
      throw new NotFoundException(`Status with ID ${id} not found`);
    }
    return { data: status };
  }

  async create(createStatusDto: CreateStatusDto) {
    const status = await this.prisma.status.create({
      data: createStatusDto,
      include: statusInclude,
    });
    return { data: status };
  }

  async update(id: number, updateStatusDto: UpdateStatusDto) {
    const existingStatus = await this.prisma.status.findUnique({
      where: { id },
    });
    if (!existingStatus) {
      throw new NotFoundException(`Status with ID ${id} not found`);
    }
    const status = await this.prisma.status.update({
      where: { id },
      data: updateStatusDto,
      include: statusInclude,
    });
    return { data: status };
  }

  async remove(id: number) {
    const existingStatus = await this.prisma.status.findUnique({
      where: { id },
    });
    if (!existingStatus) {
      throw new NotFoundException(`Status with ID ${id} not found`);
    }
    const status = await this.prisma.status.update({
      where: { id },
      data: { deletedAt: new Date() },
      include: statusInclude,
    });
    return { data: status };
  }

  async restore(id: number) {
    const existingStatus = await this.prisma.status.findUnique({
      where: { id },
    });
    if (!existingStatus) {
      throw new NotFoundException(`Status with ID ${id} not found`);
    }
    const status = await this.prisma.status.update({
      where: { id },
      data: { deletedAt: null },
      include: statusInclude,
    });
    return { data: status };
  }

  async permanentDelete(id: number) {
    const existingStatus = await this.prisma.status.findUnique({
      where: { id },
    });
    if (!existingStatus) {
      throw new NotFoundException(`Status with ID ${id} not found`);
    }
    const status = await this.prisma.status.delete({
      where: { id },
      include: statusInclude,
    });
    return { data: status };
  }

  async bulkDelete(ids: number[]) {
    const result = await this.prisma.status.updateMany({
      where: { id: { in: ids } },
      data: { deletedAt: new Date() },
    });
    return { data: result };
  }

  async bulkRestore(ids: number[]) {
    const result = await this.prisma.status.updateMany({
      where: { id: { in: ids } },
      data: { deletedAt: null },
    });
    return { data: result };
  }

  async bulkPermanentDelete(ids: number[]) {
    const result = await this.prisma.status.deleteMany({
      where: { id: { in: ids } },
    });
    return { data: result };
  }
}
