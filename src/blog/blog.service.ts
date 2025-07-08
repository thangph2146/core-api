import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { BlogQueryDto, CreateBlogDto, UpdateBlogDto, BlogListResponseDto, BlogMetaResponseDto } from './dto/blog.dto';
import { IPaginatedResponse } from 'src/common/interfaces';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

// Define the full structure of the blog object we want to return
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

// =============================================================================
// INTERFACES
// =============================================================================

interface BlogFilterOptions {
	search?: string;
	authorId?: number;
	status?: string;
	deleted?: boolean;
	featured?: boolean;
}

interface BlogSortOptions {
	sortBy: string;
	sortOrder: 'asc' | 'desc';
}

interface PaginationOptions {
	page: number;
	limit: number;
}

interface BulkOperationResult {
	successCount: number;
	failedIds: number[];
	errors: string[];
}

/**
 * Blog Service - Business Logic Layer
 * 
 * Service này quản lý tất cả business logic cho Blog entity, bao gồm:
 * 
 * 🔍 SEPARATED READ OPERATIONS:
 * - findAll() → Danh sách blog với filter admin (bao gồm deleted)
 * - findPublic() → Danh sách blog công khai (chỉ published, không deleted)
 * - findOne() → Chi tiết blog theo ID
 * - findBySlug() → Chi tiết blog theo slug (tự động tăng view)
 * 
 * ✏️ WRITE OPERATIONS:
 * - create() → Tạo blog mới
 * - update() → Cập nhật blog
 * - remove() → Soft delete blog
 * - restore() → Khôi phục blog đã xóa
 * - permanentDelete() → Xóa vĩnh viễn blog
 * 
 * 🔄 BULK OPERATIONS:
 * - bulkDelete() → Xóa mềm nhiều blog
 * - bulkRestore() → Khôi phục nhiều blog
 * - bulkPermanentDelete() → Xóa vĩnh viễn nhiều blog
 * 
 * 📊 UTILITY OPERATIONS:
 * - getStats() → Thống kê blog
 * - getOptions() → Danh sách blog cho dropdown
 * - findFeatured() → Blog nổi bật
 * - publish/unpublish() → Quản lý trạng thái xuất bản
 * 
 * @version 2.1.0 - Chuẩn hóa theo UserService pattern
 * @author PHGroup Development Team
 */
@Injectable()
export class BlogService {
	private readonly logger = new Logger(BlogService.name);

	constructor(private prisma: PrismaService) {
		this.logger.log('🚀 BlogService initialized with standardized patterns');
	}

	// =============================================================================
	// PRIVATE HELPER METHODS
	// =============================================================================

	/**
	 * Build WHERE clause for blog queries
	 */
	private buildWhereClause(filters: BlogFilterOptions): Prisma.BlogWhereInput {
		const where: Prisma.BlogWhereInput = {};

		// Handle deleted filter
		this.applyDeletedFilter(where, filters);

		// Handle search filter
		if (filters.search) {
			this.applySearchFilter(where, filters.search);
		}

		// Handle author filter
		if (filters.authorId) {
			this.applyAuthorFilter(where, filters.authorId);
		}

		// Handle status filter
		if (filters.status) {
			this.applyStatusFilter(where, filters.status);
		}

		// Handle featured filter
		if (filters.featured !== undefined) {
			where.isFeatured = filters.featured;
		}

		return where;
	}

	/**
	 * Apply deleted filter to WHERE clause
	 */
	private applyDeletedFilter(
		where: Prisma.BlogWhereInput,
		filters: BlogFilterOptions,
	): void {
		if (filters.deleted === true) {
			where.deletedAt = { not: null };
		} else {
			where.deletedAt = null;
		}
	}

	/**
	 * Apply search filter to WHERE clause
	 */
	private applySearchFilter(
		where: Prisma.BlogWhereInput,
		search: string,
	): void {
		where.OR = [
			{ title: { contains: search, mode: 'insensitive' } },
			{ summary: { contains: search, mode: 'insensitive' } },
		];
	}

	/**
	 * Apply author filter to WHERE clause
	 */
	private applyAuthorFilter(where: Prisma.BlogWhereInput, authorId: number): void {
		where.authorId = authorId;
	}

	/**
	 * Apply status filter to WHERE clause
	 */
	private applyStatusFilter(where: Prisma.BlogWhereInput, status: string): void {
		where.status = { name: status };
	}

	/**
	 * Build ORDER BY clause for blog queries
	 */
	private buildOrderByClause(
		sort: BlogSortOptions,
	): Prisma.BlogOrderByWithRelationInput {
		const validSortFields = {
			id: 'id',
			title: 'title',
			slug: 'slug',
			publishedAt: 'publishedAt',
			createdAt: 'createdAt',
			updatedAt: 'updatedAt',
			deletedAt: 'deletedAt',
			viewCount: 'viewCount',
		};

		const sortField = validSortFields[sort.sortBy] || 'createdAt';
		return { [sortField]: sort.sortOrder };
	}

	/**
	 * Calculate pagination metadata
	 */
	private calculateMeta(
		total: number,
		page: number,
		limit: number,
	): BlogMetaResponseDto {
		const totalPages = Math.ceil(total / limit);
		return {
			total,
			page,
			limit,
			totalPages,
			hasNext: page < totalPages,
			hasPrevious: page > 1,
		};
	}

	/**
	 * Transform paginated result to BlogListResponseDto
	 */
	private transformToBlogListResponse(
		result: IPaginatedResponse<FullBlog>,
	): BlogListResponseDto {
		return {
			data: result.data as any,
			meta: this.calculateMeta(result.total, result.page, result.limit),
		};
	}

	/**
	 * Get status ID by name and type
	 */
	private async getStatusId(statusName: 'Published' | 'Draft' | 'Archived') {
		const status = await this.prisma.status.findUnique({
			where: { name_type: { name: statusName, type: 'BLOG' } },
			select: { id: true },
		});
		if (!status) {
			throw new Error(`Status "${statusName}" not found for type "BLOG".`);
		}
		return status.id;
	}

	// =============================================================================
	// MAIN READ OPERATIONS
	// =============================================================================

	/**
	 * Find all blogs with admin permissions (including deleted)
	 */
	async findAll(query: BlogQueryDto): Promise<BlogListResponseDto> {
		const {
			page = 1,
			limit = 10,
			search,
			authorId,
			status,
			deleted = false,
			featured,
			sortBy = 'createdAt',
			sortOrder = 'desc',
		} = query;

		this.logger.debug(`🔍 Finding all blogs with filters:`, {
			page, limit, search, authorId, status, deleted, featured, sortBy, sortOrder
		});

		const skip = (page - 1) * limit;
		const filters: BlogFilterOptions = { search, authorId, status, deleted, featured };
		const sort: BlogSortOptions = { sortBy, sortOrder };

		const where = this.buildWhereClause(filters);
		const orderBy = this.buildOrderByClause(sort);

		try {
			const [items, total] = await this.prisma.$transaction([
				this.prisma.blog.findMany({
					where,
					include: blogInclude,
					skip,
					take: limit,
					orderBy,
				}),
				this.prisma.blog.count({ where }),
			]);

			const result: IPaginatedResponse<FullBlog> = {
				data: items,
				total,
				page,
				limit,
				totalPages: Math.ceil(total / limit),
				hasNext: page < Math.ceil(total / limit),
				hasPrevious: page > 1,
			};

			this.logger.debug(`✅ Found ${total} blogs, returning page ${page}/${Math.ceil(total / limit)}`);
			return this.transformToBlogListResponse(result);
		} catch (error) {
			this.logger.error(`❌ Error finding blogs:`, error);
			throw error;
		}
	}

	/**
	 * Find public blogs (published only, no deleted)
	 */
	async findPublic(query: Partial<BlogQueryDto>): Promise<BlogListResponseDto> {
		const publicQuery: BlogQueryDto = {
			...query,
			deleted: false,
		};

		// Add additional public constraints
		const where = this.buildWhereClause({ ...publicQuery, deleted: false });
		where.publishedAt = { not: null }; // Only published blogs

		const {
			page = 1,
			limit = 10,
			sortBy = 'publishedAt',
			sortOrder = 'desc',
		} = query;

		this.logger.debug(`🌐 Finding public blogs with constraints`);

		try {
			const skip = (page - 1) * limit;
			const orderBy = this.buildOrderByClause({ sortBy, sortOrder });

			const [items, total] = await this.prisma.$transaction([
				this.prisma.blog.findMany({
					where,
					include: blogInclude,
					skip,
					take: limit,
					orderBy,
				}),
				this.prisma.blog.count({ where }),
			]);

			const result: IPaginatedResponse<FullBlog> = {
				data: items,
				total,
				page,
				limit,
				totalPages: Math.ceil(total / limit),
				hasNext: page < Math.ceil(total / limit),
				hasPrevious: page > 1,
			};

			this.logger.debug(`✅ Found ${total} public blogs`);
			return this.transformToBlogListResponse(result);
		} catch (error) {
			this.logger.error(`❌ Error finding public blogs:`, error);
			throw error;
		}
	}

	/**
	 * Find blog by ID
	 */
	async findOne(id: number): Promise<FullBlog | null> {
		try {
			const blog = await this.prisma.blog.findUnique({
				where: { id, deletedAt: null },
				include: blogInclude,
			});

			if (blog) {
				this.logger.debug(`✅ Found blog with ID: ${id}`);
			} else {
				this.logger.debug(`❌ Blog not found with ID: ${id}`);
			}

			return blog;
		} catch (error) {
			this.logger.error(`❌ Error finding blog ${id}:`, error);
			throw error;
		}
	}

	/**
	 * Find blog by slug (for public access)
	 */
	async findBySlug(slug: string): Promise<FullBlog> {
		try {
			const blog = await this.prisma.blog.findUnique({
				where: { slug, deletedAt: null, publishedAt: { not: null } },
				include: blogInclude,
			});

			if (!blog) {
				this.logger.warn(`❌ Blog not found with slug: ${slug}`);
				throw new NotFoundException(`Blog with slug "${slug}" not found`);
			}

			this.logger.debug(`✅ Found blog with slug: ${slug}`);
			return blog;
		} catch (error) {
			this.logger.error(`❌ Error finding blog by slug ${slug}:`, error);
			throw error;
		}
	}

	// =============================================================================
	// UTILITY OPERATIONS
	// =============================================================================

	/**
	 * Get blog statistics
	 */
	async getStats(): Promise<any> {
		try {
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

			const stats = {
				total,
				published,
				draft,
				deleted,
				totalViews: totalViews._sum.viewCount || 0,
			};

			this.logger.debug(`📊 Blog stats calculated:`, stats);
			return stats;
		} catch (error) {
			this.logger.error(`❌ Error calculating blog stats:`, error);
			throw error;
		}
	}

	/**
	 * Get blog options for dropdown/select
	 */
	async getOptions(): Promise<any[]> {
		try {
			const blogs = await this.prisma.blog.findMany({
				where: { deletedAt: null },
				select: {
					id: true,
					title: true,
					slug: true,
				},
				orderBy: { title: 'asc' },
			});

			const options = blogs.map(blog => ({
				value: blog.id,
				label: blog.title,
				slug: blog.slug,
			}));

			this.logger.debug(`✅ Generated ${options.length} blog options`);
			return options;
		} catch (error) {
			this.logger.error(`❌ Error generating blog options:`, error);
			throw error;
		}
	}

	/**
	 * Find featured blogs
	 */
	async findFeatured(limit: number = 5): Promise<FullBlog[]> {
		try {
			const blogs = await this.prisma.blog.findMany({
				where: {
					isFeatured: true,
					publishedAt: { not: null },
					deletedAt: null,
				},
				include: blogInclude,
				take: limit,
				orderBy: { publishedAt: 'desc' },
			});

			this.logger.debug(`✅ Found ${blogs.length} featured blogs`);
			return blogs;
		} catch (error) {
			this.logger.error(`❌ Error finding featured blogs:`, error);
			throw error;
		}
	}

	/**
	 * Increment view count for a blog
	 */
	async incrementViewCount(id: number): Promise<void> {
		try {
			await this.prisma.blog.update({
				where: { id },
				data: { viewCount: { increment: 1 } },
			});
			this.logger.debug(`📈 Incremented view count for blog ${id}`);
		} catch (error) {
			// This is not critical, so we just log the error
			this.logger.warn(`⚠️ Failed to increment view count for blog ${id}:`, error);
		}
	}

	// =============================================================================
	// WRITE OPERATIONS
	// =============================================================================

	/**
	 * Create new blog
	 */
	async create(createBlogDto: CreateBlogDto, authorId: number): Promise<FullBlog> {
		try {
			const { tagIds, ...blogData } = createBlogDto;

			this.logger.debug(`📝 Creating new blog for author ${authorId}:`, { title: blogData.title });

			const blog = await this.prisma.blog.create({
				data: {
					...blogData,
					authorId,
					tags: tagIds ? { connect: tagIds.map(id => ({ id })) } : undefined,
				},
				include: blogInclude,
			});

			this.logger.log(`✅ Created blog with ID: ${blog.id}`);
			return blog;
		} catch (error) {
			this.logger.error(`❌ Error creating blog:`, error);
			throw error;
		}
	}

	/**
	 * Update blog
	 */
	async update(id: number, updateBlogDto: UpdateBlogDto): Promise<FullBlog> {
		try {
			// Ensure blog exists
			await this.findOne(id);
			if (!await this.findOne(id)) {
				throw new NotFoundException(`Blog with ID ${id} not found`);
			}

			const { tagIds, ...blogData } = updateBlogDto;

			this.logger.debug(`📝 Updating blog ${id}:`, { updates: Object.keys(blogData) });

			const blog = await this.prisma.blog.update({
				where: { id },
				data: {
					...blogData,
					tags: tagIds ? { set: tagIds.map(id => ({ id })) } : undefined,
				},
				include: blogInclude,
			});

			this.logger.log(`✅ Updated blog with ID: ${id}`);
			return blog;
		} catch (error) {
			this.logger.error(`❌ Error updating blog ${id}:`, error);
			throw error;
		}
	}

	/**
	 * Soft delete blog
	 */
	async remove(id: number): Promise<void> {
		try {
			// Ensure blog exists
			if (!await this.findOne(id)) {
				throw new NotFoundException(`Blog with ID ${id} not found`);
			}

			await this.prisma.blog.update({
				where: { id },
				data: { deletedAt: new Date() },
			});

			this.logger.log(`🗑️ Soft deleted blog with ID: ${id}`);
		} catch (error) {
			this.logger.error(`❌ Error deleting blog ${id}:`, error);
			throw error;
		}
	}

	/**
	 * Restore deleted blog
	 */
	async restore(id: number): Promise<FullBlog> {
		try {
			const blog = await this.prisma.blog.findUnique({
				where: { id, deletedAt: { not: null } },
			});

			if (!blog) {
				throw new NotFoundException(
					`Blog with ID ${id} not found or is not deleted.`,
				);
			}

			const restoredBlog = await this.prisma.blog.update({
				where: { id },
				data: { deletedAt: null },
				include: blogInclude,
			});

			this.logger.log(`♻️ Restored blog with ID: ${id}`);
			return restoredBlog;
		} catch (error) {
			this.logger.error(`❌ Error restoring blog ${id}:`, error);
			throw error;
		}
	}

	/**
	 * Permanently delete blog
	 */
	async permanentDelete(id: number): Promise<void> {
		try {
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

			this.logger.log(`💥 Permanently deleted blog with ID: ${id}`);
		} catch (error) {
			this.logger.error(`❌ Error permanently deleting blog ${id}:`, error);
			throw error;
		}
	}

	// =============================================================================
	// BULK OPERATIONS
	// =============================================================================

	/**
	 * Bulk soft delete blogs
	 */
	async bulkDelete(blogIds: number[]): Promise<any> {
		try {
			this.logger.debug(`🗑️ Bulk deleting ${blogIds.length} blogs:`, { blogIds });

			const result = await this.prisma.blog.updateMany({
				where: {
					id: { in: blogIds },
					deletedAt: null,
				},
				data: { deletedAt: new Date() },
			});

			const response = {
				success: true,
				affected: result.count,
				message: `Successfully deleted ${result.count} blogs`,
			};

			this.logger.log(`✅ Bulk deleted ${result.count} blogs`);
			return response;
		} catch (error) {
			this.logger.error(`❌ Error bulk deleting blogs:`, error);
			throw error;
		}
	}

	/**
	 * Bulk restore blogs
	 */
	async bulkRestore(blogIds: number[]): Promise<any> {
		try {
			this.logger.debug(`♻️ Bulk restoring ${blogIds.length} blogs:`, { blogIds });

			const result = await this.prisma.blog.updateMany({
				where: {
					id: { in: blogIds },
					deletedAt: { not: null },
				},
				data: { deletedAt: null },
			});

			const response = {
				success: true,
				affected: result.count,
				message: `Successfully restored ${result.count} blogs`,
			};

			this.logger.log(`✅ Bulk restored ${result.count} blogs`);
			return response;
		} catch (error) {
			this.logger.error(`❌ Error bulk restoring blogs:`, error);
			throw error;
		}
	}

	/**
	 * Bulk permanent delete blogs
	 */
	async bulkPermanentDelete(blogIds: number[]): Promise<any> {
		try {
			this.logger.debug(`💥 Bulk permanent deleting ${blogIds.length} blogs:`, { blogIds });

			const result = await this.prisma.blog.deleteMany({
				where: {
					id: { in: blogIds },
					deletedAt: { not: null },
				},
			});

			const response = {
				success: true,
				affected: result.count,
				message: `Successfully permanently deleted ${result.count} blogs`,
			};

			this.logger.log(`✅ Bulk permanently deleted ${result.count} blogs`);
			return response;
		} catch (error) {
			this.logger.error(`❌ Error bulk permanent deleting blogs:`, error);
			throw error;
		}
	}

	// =============================================================================
	// SPECIAL OPERATIONS
	// =============================================================================

	/**
	 * Publish blog
	 */
	async publish(id: number): Promise<FullBlog> {
		try {
			if (!await this.findOne(id)) {
				throw new NotFoundException(`Blog with ID ${id} not found`);
			}

			const publishedStatusId = await this.getStatusId('Published');

			const blog = await this.prisma.blog.update({
				where: { id },
				data: {
					publishedAt: new Date(),
					statusId: publishedStatusId,
				},
				include: blogInclude,
			});

			this.logger.log(`📢 Published blog with ID: ${id}`);
			return blog;
		} catch (error) {
			this.logger.error(`❌ Error publishing blog ${id}:`, error);
			throw error;
		}
	}

	/**
	 * Unpublish blog
	 */
	async unpublish(id: number): Promise<FullBlog> {
		try {
			if (!await this.findOne(id)) {
				throw new NotFoundException(`Blog with ID ${id} not found`);
			}

			const draftStatusId = await this.getStatusId('Draft');

			const blog = await this.prisma.blog.update({
				where: { id },
				data: {
					publishedAt: null,
					statusId: draftStatusId,
				},
				include: blogInclude,
			});

			this.logger.log(`📝 Unpublished blog with ID: ${id}`);
			return blog;
		} catch (error) {
			this.logger.error(`❌ Error unpublishing blog ${id}:`, error);
			throw error;
		}
	}

	// =============================================================================
	// LEGACY METHODS (for backward compatibility)
	// =============================================================================

	/**
	 * @deprecated Use findPublic() instead
	 */
	async findPublished(page: number = 1, limit: number = 10): Promise<IPaginatedResponse<FullBlog>> {
		this.logger.warn('⚠️ findPublished() is deprecated, use findPublic() instead');
		const result = await this.findPublic({ page, limit });
		return {
			data: result.data as any,
			total: result.meta.total,
			page: result.meta.page,
			limit: result.meta.limit,
			totalPages: result.meta.totalPages,
			hasNext: result.meta.hasNext,
			hasPrevious: result.meta.hasPrevious,
		};
	}
}
