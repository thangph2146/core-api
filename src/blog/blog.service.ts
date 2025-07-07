import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { AdminBlogQueryDto, CreateBlogDto, UpdateBlogDto, BlogListResponseDto, BlogMetaResponseDto } from './dto/blog.dto';
import { IPaginatedResponse } from 'src/common/interfaces';

// This defines the full structure of the blog object we want to return
const blogInclude: Prisma.BlogInclude = {
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
};

type FullBlog = Prisma.BlogGetPayload<{
	include: typeof blogInclude;
}>;

@Injectable()
export class BlogService {
	constructor(private prisma: PrismaService) {}

	// =================================================================================
	// PUBLIC METHODS
	// =================================================================================

	async findPublished(
		page: number = 1,
		limit: number = 10,
	): Promise<IPaginatedResponse<FullBlog>> {
		const skip = (page - 1) * limit;
		const where: Prisma.BlogWhereInput = {
			publishedAt: { not: null },
			deletedAt: null,
		};

		const [items, total] = await this.prisma.$transaction([
			this.prisma.blog.findMany({
				where,
				include: blogInclude,
				skip,
				take: limit,
				orderBy: { publishedAt: 'desc' },
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

	async findFeatured(limit: number = 5): Promise<FullBlog[]> {
		return this.prisma.blog.findMany({
			where: {
				isFeatured: true,
				publishedAt: { not: null },
				deletedAt: null,
			},
			include: blogInclude,
			take: limit,
			orderBy: { publishedAt: 'desc' },
		});
	}

	async findBySlug(slug: string): Promise<FullBlog> {
		const blog = await this.prisma.blog.findUnique({
			where: { slug, deletedAt: null, publishedAt: { not: null } },
			include: blogInclude,
		});

		if (!blog) {
			throw new NotFoundException(`Blog with slug "${slug}" not found`);
		}
		return blog;
	}

	async incrementViewCount(id: number): Promise<void> {
		// This can fail if the blog doesn't exist, but it's okay to not be critical.
		// We won't await this in the controller to not slow down the response.
		await this.prisma.blog.update({
			where: { id },
			data: { viewCount: { increment: 1 } },
		});
	}

	// =================================================================================
	// ADMIN METHODS
	// =================================================================================

	async findAll(
		query: AdminBlogQueryDto,
	): Promise<BlogListResponseDto> {
		const result = await this.findAllForAdmin(query);
		return this.transformToBlogListResponse(result);
	}

	async findPublic(
		query: Partial<AdminBlogQueryDto>,
	): Promise<BlogListResponseDto> {
		const {
			page = 1,
			limit = 10,
			search,
			sortBy = 'publishedAt',
			sortOrder = 'desc',
		} = query;
		const skip = (page - 1) * limit;

		const where: Prisma.BlogWhereInput = {
			deletedAt: null,
			publishedAt: { not: null },
			AND: search
				? {
						OR: [
							{ title: { contains: search, mode: 'insensitive' } },
							{ summary: { contains: search, mode: 'insensitive' } },
						],
				  }
				: undefined,
		};

		const [items, total] = await this.prisma.$transaction([
			this.prisma.blog.findMany({
				where,
				include: blogInclude,
				skip,
				take: limit,
				orderBy: { [sortBy]: sortOrder },
			}),
			this.prisma.blog.count({ where }),
		]);

		const totalPages = Math.ceil(total / limit);

		return this.transformToBlogListResponse({
			data: items,
			total,
			page,
			limit,
			totalPages,
			hasNext: page < totalPages,
			hasPrevious: page > 1,
		});
	}

	async findOne(id: number): Promise<FullBlog | null> {
		return this.prisma.blog.findUnique({
			where: { id, deletedAt: null },
			include: blogInclude,
		});
	}

	async getStats(): Promise<any> {
		const [total, published, draft, deleted, totalViews] = await this.prisma.$transaction([
			this.prisma.blog.count({ where: { deletedAt: null } }),
			this.prisma.blog.count({ 
				where: { 
					deletedAt: null, 
					publishedAt: { not: null } 
				} 
			}),
			this.prisma.blog.count({ 
				where: { 
					deletedAt: null, 
					publishedAt: null 
				} 
			}),
			this.prisma.blog.count({ where: { deletedAt: { not: null } } }),
			this.prisma.blog.aggregate({
				where: { deletedAt: null },
				_sum: { viewCount: true },
			}),
		]);

		return {
			total,
			published,
			draft,
			deleted,
			totalViews: totalViews._sum.viewCount || 0,
		};
	}

	async getOptions(): Promise<any[]> {
		const blogs = await this.prisma.blog.findMany({
			where: { deletedAt: null },
			select: {
				id: true,
				title: true,
				slug: true,
			},
			orderBy: { title: 'asc' },
		});

		return blogs.map(blog => ({
			value: blog.id,
			label: blog.title,
			slug: blog.slug,
		}));
	}

	async bulkDelete(blogIds: number[]): Promise<any> {
		const result = await this.prisma.blog.updateMany({
			where: {
				id: { in: blogIds },
				deletedAt: null,
			},
			data: { deletedAt: new Date() },
		});

		return {
			success: true,
			affected: result.count,
			message: `Successfully deleted ${result.count} blogs`,
		};
	}

	async bulkRestore(blogIds: number[]): Promise<any> {
		const result = await this.prisma.blog.updateMany({
			where: {
				id: { in: blogIds },
				deletedAt: { not: null },
			},
			data: { deletedAt: null },
		});

		return {
			success: true,
			affected: result.count,
			message: `Successfully restored ${result.count} blogs`,
		};
	}

	async bulkPermanentDelete(blogIds: number[]): Promise<any> {
		const result = await this.prisma.blog.deleteMany({
			where: {
				id: { in: blogIds },
				deletedAt: { not: null },
			},
		});

		return {
			success: true,
			affected: result.count,
			message: `Successfully permanently deleted ${result.count} blogs`,
		};
	}

	async permanentDelete(id: number): Promise<void> {
		const blog = await this.prisma.blog.findUnique({
			where: { id, deletedAt: { not: null } },
		});

		if (!blog) {
			throw new NotFoundException(
				`Blog with ID ${id} not found or is not deleted.`,
			);
		}

		await this.prisma.blog.delete({
			where: { id },
		});
	}

	async findAllForAdmin(
		query: AdminBlogQueryDto,
	): Promise<IPaginatedResponse<FullBlog>> {
		const {
			page = 1,
			limit = 10,
			status,
			authorId,
			search,
			deleted = false,
			sortBy = 'createdAt',
			sortOrder = 'desc',
		} = query;
		const skip = (page - 1) * limit;

		const where: Prisma.BlogWhereInput = {
			deletedAt: deleted ? { not: null } : null,
			AND: search
				? {
						OR: [
							{ title: { contains: search, mode: 'insensitive' } },
							{ summary: { contains: search, mode: 'insensitive' } },
						],
				  }
				: undefined,
			authorId: authorId ? authorId : undefined,
			status: status ? { name: status } : undefined,
		};

		const [items, total] = await this.prisma.$transaction([
			this.prisma.blog.findMany({
				where,
				include: blogInclude,
				skip,
				take: limit,
				orderBy: { [sortBy]: sortOrder },
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

	async findOneForAdmin(id: number): Promise<FullBlog> {
		const blog = await this.prisma.blog.findUnique({
			where: { id },
			include: blogInclude,
		});
		if (!blog) {
			throw new NotFoundException(`Blog with ID ${id} not found.`);
		}
		return blog;
	}

	async create(
		createBlogDto: CreateBlogDto,
		authorId: number,
	): Promise<FullBlog> {
		const { tagIds, ...blogData } = createBlogDto;

		return this.prisma.blog.create({
			data: {
				...blogData,
				authorId,
				tags: tagIds ? { connect: tagIds.map(id => ({ id })) } : undefined,
			},
			include: blogInclude,
		});
	}

	async update(id: number, updateBlogDto: UpdateBlogDto): Promise<FullBlog> {
		await this.findOneForAdmin(id); // Ensure blog exists
		const { tagIds, ...blogData } = updateBlogDto;

		return this.prisma.blog.update({
			where: { id },
			data: {
				...blogData,
				tags: tagIds ? { set: tagIds.map(id => ({ id })) } : undefined,
			},
			include: blogInclude,
		});
	}

	async remove(id: number): Promise<void> {
		await this.findOneForAdmin(id); // Ensure blog exists
		await this.prisma.blog.update({
			where: { id },
			data: { deletedAt: new Date() },
		});
	}

	async restore(id: number): Promise<FullBlog> {
		const blog = await this.prisma.blog.findUnique({
			where: { id, deletedAt: { not: null } },
		});

		if (!blog) {
			throw new NotFoundException(
				`Blog with ID ${id} not found or is not deleted.`,
			);
		}

		return this.prisma.blog.update({
			where: { id },
			data: { deletedAt: null },
			include: blogInclude,
		});
	}

	private async getStatusId(statusName: 'Published' | 'Draft' | 'Archived') {
		const status = await this.prisma.status.findUnique({
			where: { name_type: { name: statusName, type: 'BLOG' } },
			select: { id: true },
		});
		if (!status) {
			// This should not happen if the seed script has run correctly.
			throw new Error(`Status "${statusName}" not found for type "BLOG".`);
		}
		return status.id;
	}

	async publish(id: number): Promise<FullBlog> {
		await this.findOneForAdmin(id); // Ensure blog exists
		const publishedStatusId = await this.getStatusId('Published');

		return this.prisma.blog.update({
			where: { id },
			data: {
				publishedAt: new Date(),
				statusId: publishedStatusId,
			},
			include: blogInclude,
		});
	}

	async unpublish(id: number): Promise<FullBlog> {
		await this.findOneForAdmin(id); // Ensure blog exists
		const draftStatusId = await this.getStatusId('Draft');

		return this.prisma.blog.update({
			where: { id },
			data: {
				publishedAt: null,
				statusId: draftStatusId,
			},
			include: blogInclude,
		});
	}

	// =================================================================================
	// HELPER METHODS
	// =================================================================================

	private transformToBlogListResponse(
		result: IPaginatedResponse<FullBlog>,
	): BlogListResponseDto {
		return {
			data: result.data as any, // Type assertion to handle the complex type mapping
			meta: {
				total: result.total,
				page: result.page,
				limit: result.limit,
				totalPages: result.totalPages,
				hasNext: result.hasNext,
				hasPrevious: result.hasPrevious,
			},
		};
	}
}
