import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateServiceDto, UpdateServiceDto, AdminServiceQueryDto } from './dto/service.dto';
import { IPaginatedResponse } from '../common/interfaces/index';

@Injectable()
export class ServiceService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: AdminServiceQueryDto): Promise<{ data: any[]; total: number; page: number; limit: number; totalPages: number; hasNext: boolean; hasPrevious: boolean }> {
    const { page = 1, limit = 10, search, sortBy, sortOrder, isPublished, deleted } = query;
    const skip = (page - 1) * limit;
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (isPublished !== undefined) {
      where.publishedAt = isPublished ? { not: null } : null;
    }

    if (deleted) {
      where.deletedAt = { not: null };
    } else {
      where.deletedAt = null;
    }

    const [data, total] = await Promise.all([
      this.prisma.service.findMany({
        where,
        skip,
        take: limit,
        orderBy: sortBy ? { [sortBy]: sortOrder } : { createdAt: 'desc' },
        include: { category: true, status: true },
      }),
      this.prisma.service.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrevious = page > 1;

    return {
      data,
      total,
      page,
      limit,
      totalPages,
      hasNext,
      hasPrevious,
    };
  }

  async findOne(id: number) {
    const service = await this.prisma.service.findUnique({
      where: { id },
      include: { category: true, status: true },
    });
    if (!service) {
      throw new NotFoundException(`Service with ID "${id}" not found`);
    }
    return { data: service };
  }

  async findAllAdmin(query: AdminServiceQueryDto): Promise<IPaginatedResponse<any>> {
    const { page = 1, limit = 10, search, sortBy, sortOrder, isPublished, deleted } = query;
    const skip = (page - 1) * limit;
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (isPublished !== undefined) {
      where.publishedAt = isPublished ? { not: null } : null;
    }

    if (deleted) {
      where.deletedAt = { not: null };
    } else {
      where.deletedAt = null;
    }

    const [data, total] = await Promise.all([
      this.prisma.service.findMany({
        where,
        skip,
        take: limit,
        orderBy: sortBy ? { [sortBy]: sortOrder } : { createdAt: 'desc' },
        include: { category: true, status: true },
      }),
      this.prisma.service.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrevious = page > 1;

    return {
      data,
      total,
      page,
      limit,
      totalPages,
      hasNext,
      hasPrevious,
    };
  }

  async findOneAdmin(id: number) {
    const service = await this.prisma.service.findUnique({
      where: { id },
      include: { category: true, status: true },
    });
    if (!service) {
      throw new NotFoundException(`Service with ID "${id}" not found`);
    }
    return service;
  }

  async create(createServiceDto: CreateServiceDto) {
    const { categoryId, statusId, featuredImageId, ...serviceData } = createServiceDto;
    const slug = createServiceDto.slug || createServiceDto.name.toLowerCase().replace(/ /g, '-');

    const created = await this.prisma.service.create({
      data: {
        ...serviceData,
        slug,
        ...(categoryId && { category: { connect: { id: categoryId } } }),
        ...(statusId && { status: { connect: { id: statusId } } }),
        ...(featuredImageId && { featuredImage: { connect: { id: featuredImageId } } }),
      },
    });
    return { data: created };
  }

  async update(id: number, updateServiceDto: UpdateServiceDto) {
    const { categoryId, statusId, featuredImageId, ...serviceData } = updateServiceDto;
    const updated = await this.prisma.service.update({
      where: { id },
      data: {
        ...serviceData,
        ...(categoryId && { category: { connect: { id: categoryId } } }),
        ...(statusId && { status: { connect: { id: statusId } } }),
        ...(featuredImageId && { featuredImage: { connect: { id: featuredImageId } } }),
      },
    });
    return { data: updated };
  }

  async remove(id: number) {
    const removed = await this.prisma.service.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return { data: removed };
  }

  async restore(id: number) {
    const restored = await this.prisma.service.update({
      where: { id },
      data: { deletedAt: null },
    });
    return { data: restored };
  }

  async permanentDelete(id: number) {
    const deleted = await this.prisma.service.delete({ where: { id } });
    return { data: deleted };
  }

  async bulkDelete(ids: number[]) {
    const result = await this.prisma.service.updateMany({
      where: { id: { in: ids } },
      data: { deletedAt: new Date() },
    });
    return { data: result };
  }

  async bulkRestore(ids: number[]) {
    const result = await this.prisma.service.updateMany({
      where: { id: { in: ids } },
      data: { deletedAt: null },
    });
    return { data: result };
  }

  async bulkPermanentDelete(ids: number[]) {
    const result = await this.prisma.service.deleteMany({ where: { id: { in: ids } } });
    return { data: result };
  }
}
