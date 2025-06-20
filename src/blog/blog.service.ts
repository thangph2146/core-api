import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BlogService {
  constructor(private prisma: PrismaService) {}

  async findAll(): Promise<any[]> {
    return this.prisma.blog.findMany({
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        category: true,
        status: true,
        tags: true,
        _count: {
          select: {
            likes: true,
            comments: true,
            bookmarks: true,
          },
        },
      },
      orderBy: { publishedAt: 'desc' },
    });
  }

  async findOne(id: number): Promise<any | null> {
    return this.prisma.blog.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        category: true,
        status: true,
        tags: true,
        _count: {
          select: {
            likes: true,
            comments: true,
            bookmarks: true,
          },
        },
      },
    });
  }

  async findBySlug(slug: string): Promise<any | null> {
    return this.prisma.blog.findUnique({
      where: { slug },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        category: true,
        status: true,
        tags: true,
        _count: {
          select: {
            likes: true,
            comments: true,
            bookmarks: true,
          },
        },
      },
    });
  }

  async findFeatured(limit: number = 10): Promise<any[]> {
    return this.prisma.blog.findMany({
      where: {
        isFeatured: true,
        publishedAt: { not: null },
        deletedAt: null,
      },
      take: limit,
      orderBy: { publishedAt: 'desc' },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        category: true,
        status: true,
        tags: true,
        _count: {
          select: {
            likes: true,
            comments: true,
            bookmarks: true,
          },
        },
      },
    });
  }

  async findPublished(page: number = 1, limit: number = 10): Promise<any> {
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.blog.findMany({
        skip,
        take: limit,
        where: {
          publishedAt: { not: null },
          deletedAt: null,
        },
        orderBy: { publishedAt: 'desc' },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          category: true,
          status: true,
          tags: true,
          _count: {
            select: {
              likes: true,
              comments: true,
              bookmarks: true,
            },
          },
        },
      }),
      this.prisma.blog.count({
        where: {
          publishedAt: { not: null },
          deletedAt: null,
        },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: items,
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1,
    };
  }
  async incrementViewCount(id: number): Promise<any> {
    return this.prisma.blog.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        category: true,
        status: true,
        tags: true,
        _count: {
          select: {
            likes: true,
            comments: true,
            bookmarks: true,
          },
        },
      },
    });
  }

  // Admin methods with permission checks
  async findAllForAdmin(params: {
    page: number;
    limit: number;
    status?: string;
    authorId?: number;
  }): Promise<any> {
    const { page, limit, status, authorId } = params;
    const skip = (page - 1) * limit;

    const where: any = {
      deletedAt: null,
    };

    if (status) {
      where.status = { name: status };
    }

    if (authorId) {
      where.authorId = authorId;
    }

    const [items, total] = await Promise.all([
      this.prisma.blog.findMany({
        where,
        skip,
        take: limit,
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          category: true,
          status: true,
          tags: true,
          _count: {
            select: {
              likes: true,
              comments: true,
              bookmarks: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.blog.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: items,
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1,
    };
  }

  async create(data: any): Promise<any> {
    const { tagIds, ...blogData } = data;

    return this.prisma.blog.create({
      data: {
        ...blogData,
        tags: tagIds ? {
          connect: tagIds.map((id: number) => ({ id }))
        } : undefined,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        category: true,
        status: true,
        tags: true,
      },
    });
  }

  async update(id: number, data: any, user: any): Promise<any> {
    // Check if user is owner or has admin permissions
    const existingBlog = await this.prisma.blog.findUnique({
      where: { id },
      include: { author: true },
    });

    if (!existingBlog) {
      throw new Error('Blog not found');
    }

    // Only author or admin can edit
    if (existingBlog.authorId !== user.id && user.role?.name !== 'Super Admin') {
      throw new Error('Access denied');
    }

    const { tagIds, ...blogData } = data;

    return this.prisma.blog.update({
      where: { id },
      data: {
        ...blogData,
        tags: tagIds ? {
          set: tagIds.map((id: number) => ({ id }))
        } : undefined,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        category: true,
        status: true,
        tags: true,
      },
    });
  }

  async remove(id: number, user: any): Promise<any> {
    const existingBlog = await this.prisma.blog.findUnique({
      where: { id },
      include: { author: true },
    });

    if (!existingBlog) {
      throw new Error('Blog not found');
    }

    // Only author or admin can delete
    if (existingBlog.authorId !== user.id && user.role?.name !== 'Super Admin') {
      throw new Error('Access denied');
    }

    return this.prisma.blog.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async restore(id: number): Promise<any> {
    return this.prisma.blog.update({
      where: { id },
      data: { deletedAt: null },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        category: true,
        status: true,
        tags: true,
      },
    });
  }

  async publish(id: number): Promise<any> {
    return this.prisma.blog.update({
      where: { id },
      data: { 
        publishedAt: new Date(),
        // Assuming status ID 1 is "Published"
        statusId: 1,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        category: true,
        status: true,
        tags: true,
      },
    });
  }

  async unpublish(id: number): Promise<any> {
    return this.prisma.blog.update({
      where: { id },
      data: { 
        publishedAt: null,
        // Assuming status ID 2 is "Draft"
        statusId: 2,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        category: true,
        status: true,
        tags: true,
      },
    });
  }
}
