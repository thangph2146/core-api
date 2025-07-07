import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMediaDto, UpdateMediaDto, AdminMediaQueryDto } from './dto/media.dto';
import { IPaginatedResponse } from '../common/interfaces/index';

@Injectable()
export class MediaService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: AdminMediaQueryDto): Promise<{ data: any[]; total: number; page: number; limit: number; totalPages: number; hasNext: boolean; hasPrevious: boolean }> {
    const { page = 1, limit = 10, search, sortBy, sortOrder, deleted } = query;
    const skip = (page - 1) * limit;
    const where: any = {};

    if (search) {
      where.OR = [
        { fileName: { contains: search, mode: 'insensitive' } },
        { altText: { contains: search, mode: 'insensitive' } },
        { caption: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (deleted) {
      where.deletedAt = { not: null };
    } else {
      where.deletedAt = null;
    }

    const [data, total] = await Promise.all([
      this.prisma.media.findMany({
        where,
        skip,
        take: limit,
        orderBy: sortBy ? { [sortBy]: sortOrder } : { createdAt: 'desc' },
        include: { uploadedBy: true },
      }),
      this.prisma.media.count({ where }),
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
    const media = await this.prisma.media.findUnique({
      where: { id },
      include: { uploadedBy: true },
    });
    if (!media) {
      throw new NotFoundException(`Media with ID "${id}" not found`);
    }
    return { data: media };
  }

  async create(createMediaDto: CreateMediaDto, uploadedById: number) {
    const { uploadedById: _, ...mediaData } = createMediaDto;
    const created = await this.prisma.media.create({
      data: {
        ...mediaData,
        uploadedBy: { connect: { id: uploadedById } },
      },
    });
    return { data: created, message: 'Tạo media thành công' };
  }

  async update(id: number, updateMediaDto: UpdateMediaDto) {
    const { uploadedById, ...mediaData } = updateMediaDto;
    const updated = await this.prisma.media.update({
      where: { id },
      data: {
        ...mediaData,
        ...(uploadedById && { uploadedBy: { connect: { id: uploadedById } } }),
      },
    });
    return { data: updated, message: 'Cập nhật media thành công' };
  }

  async remove(id: number) {
    const deleted = await this.prisma.media.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return { data: deleted, message: 'Xóa mềm media thành công' };
  }

  async restore(id: number) {
    const restored = await this.prisma.media.update({
      where: { id },
      data: { deletedAt: null },
    });
    return { data: restored, message: 'Khôi phục media thành công' };
  }

  async bulkDelete(ids: number[]) {
    const result = await this.prisma.media.updateMany({
      where: { id: { in: ids } },
      data: { deletedAt: new Date() },
    });
    return { count: result.count, message: 'Xóa mềm nhiều media thành công' };
  }

  async bulkRestore(ids: number[]) {
    const result = await this.prisma.media.updateMany({
      where: { id: { in: ids } },
      data: { deletedAt: null },
    });
    return { count: result.count, message: 'Khôi phục nhiều media thành công' };
  }

  async bulkPermanentDelete(ids: number[]) {
    const result = await this.prisma.media.deleteMany({ where: { id: { in: ids } } });
    return { count: result.count, message: 'Xóa vĩnh viễn nhiều media thành công' };
  }
}
