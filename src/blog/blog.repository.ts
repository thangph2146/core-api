import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IRepository } from '../common/interfaces/repository.interface';
import {
  IBlog,
  IPaginationParams,
  IPaginatedResponse,
} from '../common/interfaces';
import { CreateBlogDto, UpdateBlogDto } from './dto/blog.dto';

export interface IBlogRepository
  extends IRepository<IBlog, CreateBlogDto, UpdateBlogDto> {
  findBySlug(slug: string): Promise<IBlog | null>;
  findFeatured(take?: number): Promise<IBlog[]>;
  incrementViewCount(id: number): Promise<IBlog>;
  findPublished(params: IPaginationParams): Promise<IPaginatedResponse<IBlog>>;
}

@Injectable()
export class BlogRepository implements IBlogRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateBlogDto): Promise<IBlog> {
    const { tagIds, ...blogData } = data;

    const result = await this.prisma.blog.create({
      data: {
        ...blogData,
        publishedAt: data.publishedAt ? new Date(data.publishedAt) : null,
        tags: tagIds
          ? {
              connect: tagIds.map((id) => ({ id })),
            }
          : undefined,
      },
      include: this.getIncludeOptions(),
    });

    return this.mapToInterface(result);
  }

  async findAll(params: IPaginationParams): Promise<IPaginatedResponse<IBlog>> {
    const { skip = 0, take = 10, where, orderBy } = params;

    const [items, total] = await Promise.all([
      this.prisma.blog.findMany({
        skip,
        take,
        where,
        orderBy,
        include: this.getIncludeOptions(),
      }),
      this.prisma.blog.count({ where }),
    ]);

    const mappedItems = items.map((item) => this.mapToInterface(item));

    return this.createPaginatedResponse(mappedItems, total, skip, take);
  }

  async findById(id: number): Promise<IBlog | null> {
    const result = await this.prisma.blog.findUnique({
      where: { id },
      include: this.getIncludeOptions(),
    });

    return result ? this.mapToInterface(result) : null;
  }

  async findBySlug(slug: string): Promise<IBlog | null> {
    const result = await this.prisma.blog.findUnique({
      where: { slug },
      include: this.getIncludeOptions(),
    });

    return result ? this.mapToInterface(result) : null;
  }

  async update(id: number, data: UpdateBlogDto): Promise<IBlog> {
    const { tagIds, ...blogData } = data;

    const result = await this.prisma.blog.update({
      where: { id },
      data: {
        ...blogData,
        publishedAt: data.publishedAt ? new Date(data.publishedAt) : undefined,
        tags: tagIds
          ? {
              set: tagIds.map((id) => ({ id })),
            }
          : undefined,
      },
      include: this.getIncludeOptions(),
    });

    return this.mapToInterface(result);
  }

  async delete(id: number): Promise<IBlog> {
    const result = await this.prisma.blog.delete({
      where: { id },
      include: this.getIncludeOptions(),
    });

    return this.mapToInterface(result);
  }

  async findFeatured(take: number = 10): Promise<IBlog[]> {
    const results = await this.prisma.blog.findMany({
      where: {
        isFeatured: true,
        publishedAt: { not: null },
        deletedAt: null,
      },
      take,
      orderBy: { publishedAt: 'desc' },
      include: this.getIncludeOptions(),
    });

    return results.map((item) => this.mapToInterface(item));
  }

  async incrementViewCount(id: number): Promise<IBlog> {
    const result = await this.prisma.blog.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
      include: this.getIncludeOptions(),
    });

    return this.mapToInterface(result);
  }

  async findPublished(
    params: IPaginationParams,
  ): Promise<IPaginatedResponse<IBlog>> {
    const publishedWhere = {
      ...params.where,
      publishedAt: { not: null },
      deletedAt: null,
    };

    return this.findAll({
      ...params,
      where: publishedWhere,
    });
  }

  private getIncludeOptions() {
    return {
      author: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
        },
      },
      category: true,
      status: true,
      tags: true,
      comments: {
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true,
            },
          },
          replies: {
            include: {
              author: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  avatarUrl: true,
                },
              },
            },
          },
        },
      },
      _count: {
        select: {
          likes: true,
          comments: true,
          bookmarks: true,
        },
      },
    };
  }

  private mapToInterface(data: any): IBlog {
    return {
      id: data.id,
      title: data.title,
      slug: data.slug,
      summary: data.summary,
      content: data.content,
      imageUrl: data.imageUrl,
      imageTitle: data.imageTitle,
      statusId: data.statusId,
      publishedAt: data.publishedAt,
      authorId: data.authorId,
      categoryId: data.categoryId,
      viewCount: data.viewCount,
      isFeatured: data.isFeatured,
      allowComments: data.allowComments,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      deletedAt: data.deletedAt,
      metaTitle: data.metaTitle,
      metaDescription: data.metaDescription,
      author: data.author,
      category: data.category,
      status: data.status,
      tags: data.tags || [],
      comments: data.comments || [],
      _count: data._count,
    };
  }

  private createPaginatedResponse<T>(
    data: T[],
    total: number,
    skip: number,
    take: number,
  ): IPaginatedResponse<T> {
    const page = Math.floor(skip / take) + 1;
    const totalPages = Math.ceil(total / take);

    return {
      data,
      total,
      page,
      limit: take,
      totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1,
    };
  }
}
