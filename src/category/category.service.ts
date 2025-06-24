import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CategoryService {
  constructor(private prisma: PrismaService) {}

  async create(data: any): Promise<any> {
    return this.prisma.category.create({
      data,
      include: {
        parent: true,
        children: true,
      },
    });
  }

  async findAll(type?: string): Promise<any[]> {
    const where = type ? { type } : {};
    return this.prisma.category.findMany({
      where,
      include: {
        parent: true,
        children: true,
        _count: {
          select: {
            blogs: true,
            services: true,
            recruitmentPosts: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findByType(type: string): Promise<any[]> {
    return this.prisma.category.findMany({
      where: { type },
      include: {
        parent: true,
        children: true,
        _count: {
          select: {
            blogs: true,
            services: true,
            recruitmentPosts: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: number): Promise<any | null> {
    return this.prisma.category.findUnique({
      where: { id },
      include: {
        parent: true,
        children: true,
        blogs: {
          take: 10,
          orderBy: { publishedAt: 'desc' },
        },
        services: {
          take: 10,
          orderBy: { publishedAt: 'desc' },
        },
        recruitmentPosts: {
          take: 10,
          orderBy: { publishedAt: 'desc' },
        },
      },
    });
  }

  async findBySlug(slug: string, type: string): Promise<any | null> {
    return this.prisma.category.findFirst({
      where: { slug, type },
      include: {
        parent: true,
        children: true,
        blogs: {
          take: 10,
          orderBy: { publishedAt: 'desc' },
        },
        services: {
          take: 10,
          orderBy: { publishedAt: 'desc' },
        },
        recruitmentPosts: {
          take: 10,
          orderBy: { publishedAt: 'desc' },
        },
      },
    });
  }

  async update(params: { where: any; data: any }): Promise<any> {
    const { where, data } = params;
    return this.prisma.category.update({
      data,
      where,
      include: {
        parent: true,
        children: true,
      },
    });
  }

  async delete(where: any): Promise<any> {
    return this.prisma.category.delete({
      where,
    });
  }
}
