import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRecruitmentDto, UpdateRecruitmentDto, AdminRecruitmentQueryDto } from './dto/recruitment.dto';
import { IPaginatedResponse } from '../common/interfaces/index';

@Injectable()
export class RecruitmentService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: AdminRecruitmentQueryDto): Promise<{ data: any[]; total: number; page: number; limit: number; totalPages: number; hasNext: boolean; hasPrevious: boolean }> {
    const { page = 1, limit = 10, search, sortBy, sortOrder, isPublished, deleted } = query;
    const skip = (page - 1) * limit;
    const where: any = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
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
      this.prisma.recruitment.findMany({
        where,
        skip,
        take: limit,
        orderBy: sortBy ? { [sortBy]: sortOrder } : { createdAt: 'desc' },
        include: { category: true, status: true, author: true },
      }),
      this.prisma.recruitment.count({ where }),
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
    const recruitment = await this.prisma.recruitment.findFirst({
      where: { id, deletedAt: null, publishedAt: { not: null } },
      include: { category: true, status: true, author: true },
    });
    if (!recruitment) {
      throw new NotFoundException(`Recruitment with ID "${id}" not found`);
    }
    return { data: recruitment };
  }

  async findAllAdmin(query: AdminRecruitmentQueryDto): Promise<IPaginatedResponse<any>> {
    const { page = 1, limit = 10, search, sortBy, sortOrder, isPublished, deleted } = query;
    const skip = (page - 1) * limit;
    const where: any = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
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
      this.prisma.recruitment.findMany({
        where,
        skip,
        take: limit,
        orderBy: sortBy ? { [sortBy]: sortOrder } : { createdAt: 'desc' },
        include: { category: true, status: true, author: true },
      }),
      this.prisma.recruitment.count({ where }),
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
    const recruitment = await this.prisma.recruitment.findUnique({
      where: { id },
      include: { category: true, status: true, author: true },
    });
    if (!recruitment) {
      throw new NotFoundException(`Recruitment with ID "${id}" not found`);
    }
    return recruitment;
  }

  async create(createRecruitmentDto: CreateRecruitmentDto) {
    const { categoryId, statusId, authorId, ...recruitmentData } = createRecruitmentDto;
    const slug = createRecruitmentDto.slug || createRecruitmentDto.title.toLowerCase().replace(/ /g, '-');

    const created = await this.prisma.recruitment.create({
      data: {
        ...recruitmentData,
        slug,
        author: { connect: { id: authorId } },
        ...(categoryId && { category: { connect: { id: categoryId } } }),
        ...(statusId && { status: { connect: { id: statusId } } }),
      },
    });
    return { data: created, message: 'Tạo recruitment thành công' };
  }

  async update(id: number, updateRecruitmentDto: UpdateRecruitmentDto) {
    const { categoryId, statusId, authorId, ...recruitmentData } = updateRecruitmentDto;
    const updated = await this.prisma.recruitment.update({
      where: { id },
      data: {
        ...recruitmentData,
        ...(authorId && { author: { connect: { id: authorId } } }),
        ...(categoryId && { category: { connect: { id: categoryId } } }),
        ...(statusId && { status: { connect: { id: statusId } } }),
      },
    });
    return { data: updated, message: 'Cập nhật recruitment thành công' };
  }

  async remove(id: number) {
    const deleted = await this.prisma.recruitment.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return { data: deleted, message: 'Xóa mềm recruitment thành công' };
  }

  async restore(id: number) {
    const restored = await this.prisma.recruitment.update({
      where: { id },
      data: { deletedAt: null },
    });
    return { data: restored, message: 'Khôi phục recruitment thành công' };
  }

  async bulkDelete(ids: number[]) {
    const result = await this.prisma.recruitment.updateMany({
      where: { id: { in: ids } },
      data: { deletedAt: new Date() },
    });
    return { count: result.count, message: 'Xóa mềm nhiều recruitment thành công' };
  }

  async bulkRestore(ids: number[]) {
    const result = await this.prisma.recruitment.updateMany({
      where: { id: { in: ids } },
      data: { deletedAt: null },
    });
    return { count: result.count, message: 'Khôi phục nhiều recruitment thành công' };
  }

  async bulkPermanentDelete(ids: number[]) {
    const result = await this.prisma.recruitment.deleteMany({ where: { id: { in: ids } } });
    return { count: result.count, message: 'Xóa vĩnh viễn nhiều recruitment thành công' };
  }
}
