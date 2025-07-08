import {
	Injectable,
	NotFoundException,
	ConflictException,
	Logger,
} from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { 
	CreateTagDto, 
	UpdateTagDto, 
	TagQueryDto, 
	TagOptionDto,
	TagListResponseDto,
	TagMetaResponseDto,
} from './dto/tag.dto'
import { Prisma } from '@prisma/client'
import { IPaginatedResponse } from 'src/common/interfaces'

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

// Define the full structure of the tag object we want to return
const tagInclude: Prisma.TagInclude = {
	blogs: {
		where: { deletedAt: null },
		select: { id: true, title: true, slug: true },
	},
	_count: {
		select: {
			blogs: true,
		},
	},
};

type FullTag = Prisma.TagGetPayload<{
	include: typeof tagInclude;
}>;

// =============================================================================
// INTERFACES
// =============================================================================

interface TagFilterOptions {
	search?: string;
	deleted?: boolean;
}

interface TagSortOptions {
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
 * Tag Service - Business Logic Layer
 * 
 * Service này quản lý tất cả business logic cho Tag entity, bao gồm:
 * 
 * 🔍 SEPARATED READ OPERATIONS:
 * - findAll() → Danh sách tag với filter admin (bao gồm deleted)
 * - findPublic() → Danh sách tag công khai (không deleted)
 * - findOne() → Chi tiết tag theo ID
 * - findBySlug() → Chi tiết tag theo slug
 * 
 * ✏️ WRITE OPERATIONS:
 * - create() → Tạo tag mới
 * - update() → Cập nhật tag
 * - remove() → Soft delete tag
 * - restore() → Khôi phục tag đã xóa
 * - permanentDelete() → Xóa vĩnh viễn tag
 * 
 * 🔄 BULK OPERATIONS:
 * - bulkDelete() → Xóa mềm nhiều tag
 * - bulkRestore() → Khôi phục nhiều tag
 * - bulkPermanentDelete() → Xóa vĩnh viễn nhiều tag
 * 
 * 📊 UTILITY OPERATIONS:
 * - getStats() → Thống kê tag
 * - getOptions() → Danh sách tag cho dropdown
 * - getPopular() → Tag phổ biến
 * - getTrending() → Tag trending
 * 
 * @version 2.1.0 - Chuẩn hóa theo UserService pattern
 * @author PHGroup Development Team
 */
@Injectable()
export class TagService {
	private readonly logger = new Logger(TagService.name);

	constructor(private prisma: PrismaService) {
		this.logger.log('🚀 TagService initialized with standardized patterns');
	}

	// =============================================================================
	// PRIVATE HELPER METHODS
	// =============================================================================

	/**
	 * Build WHERE clause for tag queries
	 */
	private buildWhereClause(filters: TagFilterOptions): Prisma.TagWhereInput {
		const where: Prisma.TagWhereInput = {};

		// Handle deleted filter
		this.applyDeletedFilter(where, filters);

		// Handle search filter
		if (filters.search) {
			this.applySearchFilter(where, filters.search);
		}

		return where;
	}

	/**
	 * Apply deleted filter to WHERE clause
	 */
	private applyDeletedFilter(
		where: Prisma.TagWhereInput,
		filters: TagFilterOptions,
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
		where: Prisma.TagWhereInput,
		search: string,
	): void {
		where.OR = [
			{ name: { contains: search, mode: 'insensitive' } },
			{ slug: { contains: search, mode: 'insensitive' } },
		];
	}

	/**
	 * Build ORDER BY clause for tag queries
	 */
	private buildOrderByClause(
		sort: TagSortOptions,
	): Prisma.TagOrderByWithRelationInput {
		const validSortFields = {
			id: 'id',
			name: 'name',
			slug: 'slug',
			createdAt: 'createdAt',
			updatedAt: 'updatedAt',
			deletedAt: 'deletedAt',
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
	): TagMetaResponseDto {
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
	 * Transform paginated result to TagListResponseDto
	 */
	private transformToTagListResponse(
		result: IPaginatedResponse<FullTag>,
	): TagListResponseDto {
		return {
			data: result.data as any,
			meta: this.calculateMeta(result.total, result.page, result.limit),
		};
	}

	/**
	 * Check if tag can be deleted
	 */
	private async canDelete(id: number): Promise<{ canDelete: boolean; reason?: string }> {
		const tagWithBlogs = await this.prisma.tag.findUnique({
			where: { id },
			include: {
				_count: {
					select: {
						blogs: true,
					},
				},
			},
		});

		if (!tagWithBlogs) {
			return { canDelete: false, reason: 'Tag not found' };
		}

		if (tagWithBlogs._count.blogs > 0) {
			return { canDelete: false, reason: 'Tag is being used by blogs' };
		}

		return { canDelete: true };
	}

	// =============================================================================
	// MAIN READ OPERATIONS
	// =============================================================================

	/**
	 * Find all tags with admin permissions (including deleted)
	 */
	async findAll(query: TagQueryDto): Promise<TagListResponseDto> {
		const {
			page = 1,
			limit = 10,
			search,
			deleted = false,
			sortBy = 'createdAt',
			sortOrder = 'desc',
		} = query;

		this.logger.debug(`🔍 Finding all tags with filters:`, {
			page, limit, search, deleted, sortBy, sortOrder
		});

		const skip = (page - 1) * limit;
		const filters: TagFilterOptions = { search, deleted };
		const sort: TagSortOptions = { sortBy, sortOrder };

		const where = this.buildWhereClause(filters);
		const orderBy = this.buildOrderByClause(sort);

		try {
			const [items, total] = await this.prisma.$transaction([
				this.prisma.tag.findMany({
					where,
					include: tagInclude,
					skip,
					take: limit,
					orderBy,
				}),
				this.prisma.tag.count({ where }),
			]);

			const result: IPaginatedResponse<FullTag> = {
				data: items,
				total,
				page,
				limit,
				totalPages: Math.ceil(total / limit),
				hasNext: page < Math.ceil(total / limit),
				hasPrevious: page > 1,
			};

			this.logger.debug(`✅ Found ${total} tags, returning page ${page}/${Math.ceil(total / limit)}`);
			return this.transformToTagListResponse(result);
		} catch (error) {
			this.logger.error(`❌ Error finding tags:`, error);
			throw error;
		}
	}

	/**
	 * Find public tags (no deleted)
	 */
	async findPublic(query: Partial<TagQueryDto>): Promise<TagListResponseDto> {
		const publicQuery: TagQueryDto = {
			...query,
			deleted: false,
		};

		const where = this.buildWhereClause({ ...publicQuery, deleted: false });

		const {
			page = 1,
			limit = 10,
			sortBy = 'name',
			sortOrder = 'asc',
		} = query;

		this.logger.debug(`🌐 Finding public tags with constraints`);

		try {
			const skip = (page - 1) * limit;
			const orderBy = this.buildOrderByClause({ sortBy, sortOrder });

			const [items, total] = await this.prisma.$transaction([
				this.prisma.tag.findMany({
					where,
					include: tagInclude,
					skip,
					take: limit,
					orderBy,
				}),
				this.prisma.tag.count({ where }),
			]);

			const result: IPaginatedResponse<FullTag> = {
				data: items,
				total,
				page,
				limit,
				totalPages: Math.ceil(total / limit),
				hasNext: page < Math.ceil(total / limit),
				hasPrevious: page > 1,
			};

			this.logger.debug(`✅ Found ${total} public tags`);
			return this.transformToTagListResponse(result);
		} catch (error) {
			this.logger.error(`❌ Error finding public tags:`, error);
			throw error;
		}
	}

	/**
	 * Find tag by ID
	 */
	async findOne(id: number): Promise<FullTag | null> {
		try {
			const tag = await this.prisma.tag.findUnique({
				where: { id, deletedAt: null },
				include: tagInclude,
			});

			if (tag) {
				this.logger.debug(`✅ Found tag with ID: ${id}`);
			} else {
				this.logger.debug(`❌ Tag not found with ID: ${id}`);
			}

			return tag;
		} catch (error) {
			this.logger.error(`❌ Error finding tag ${id}:`, error);
			throw error;
		}
	}

	/**
	 * Find tag by slug
	 */
	async findBySlug(slug: string): Promise<FullTag> {
		try {
			const tag = await this.prisma.tag.findUnique({
				where: { slug, deletedAt: null },
				include: tagInclude,
			});

			if (!tag) {
				this.logger.warn(`❌ Tag not found with slug: ${slug}`);
				throw new NotFoundException(`Tag with slug "${slug}" not found`);
			}

			this.logger.debug(`✅ Found tag with slug: ${slug}`);
			return tag;
		} catch (error) {
			this.logger.error(`❌ Error finding tag by slug ${slug}:`, error);
			throw error;
		}
	}

	// =============================================================================
	// UTILITY OPERATIONS
	// =============================================================================

	/**
	 * Get tag statistics
	 */
	async getStats(): Promise<any> {
		try {
			const [total, deleted, totalBlogs] = await this.prisma.$transaction([
				this.prisma.tag.count({ where: { deletedAt: null } }),
				this.prisma.tag.count({ where: { deletedAt: { not: null } } }),
				this.prisma.blog.count({ 
					where: { 
						tags: {
							some: {}
						}
					} 
				}),
			]);

			const stats = {
				total,
				deleted,
				totalBlogs,
			};

			this.logger.debug(`📊 Tag stats calculated:`, stats);
			return stats;
		} catch (error) {
			this.logger.error(`❌ Error calculating tag stats:`, error);
			throw error;
		}
	}

	/**
	 * Get tag options for dropdown/select
	 */
	async getOptions(): Promise<TagOptionDto[]> {
		try {
			const tags = await this.prisma.tag.findMany({
				where: { deletedAt: null },
				select: {
					id: true,
					name: true,
					slug: true,
				},
				orderBy: { name: 'asc' },
			});

			const options = tags.map(tag => ({
				value: tag.id,
				label: tag.name,
				slug: tag.slug,
			}));

			this.logger.debug(`✅ Generated ${options.length} tag options`);
			return options;
		} catch (error) {
			this.logger.error(`❌ Error generating tag options:`, error);
			throw error;
		}
	}

	/**
	 * Get popular tags
	 */
	async getPopular(limit: number = 10): Promise<FullTag[]> {
		try {
			const tags = await this.prisma.tag.findMany({
				where: { deletedAt: null },
				include: tagInclude,
				orderBy: {
					blogs: {
						_count: 'desc',
					},
				},
				take: limit,
			});

			this.logger.debug(`✅ Found ${tags.length} popular tags`);
			return tags;
		} catch (error) {
			this.logger.error(`❌ Error finding popular tags:`, error);
			throw error;
		}
	}

	/**
	 * Get trending tags (tags used in recent blogs)
	 */
	async getTrending(limit: number = 10): Promise<FullTag[]> {
		try {
			const thirtyDaysAgo = new Date();
			thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

			const tags = await this.prisma.tag.findMany({
				where: {
					deletedAt: null,
					blogs: {
						some: {
							createdAt: { gte: thirtyDaysAgo },
							deletedAt: null,
						},
					},
				},
				include: tagInclude,
				orderBy: {
					blogs: {
						_count: 'desc',
					},
				},
				take: limit,
			});

			this.logger.debug(`✅ Found ${tags.length} trending tags`);
			return tags;
		} catch (error) {
			this.logger.error(`❌ Error finding trending tags:`, error);
			throw error;
		}
	}

	// =============================================================================
	// WRITE OPERATIONS
	// =============================================================================

	/**
	 * Create new tag
	 */
	async create(createTagDto: CreateTagDto): Promise<FullTag> {
		try {
			this.logger.debug(`📝 Creating new tag:`, { name: createTagDto.name });

			const tag = await this.prisma.tag.create({
				data: createTagDto,
				include: tagInclude,
			});

			this.logger.log(`✅ Created tag with ID: ${tag.id}`);
			return tag;
		} catch (error) {
			this.logger.error(`❌ Error creating tag:`, error);
			throw error;
		}
	}

	/**
	 * Update tag
	 */
	async update(id: number, updateTagDto: UpdateTagDto): Promise<FullTag> {
		try {
			// Ensure tag exists
			if (!await this.findOne(id)) {
				throw new NotFoundException(`Tag with ID ${id} not found`);
			}

			this.logger.debug(`📝 Updating tag ${id}:`, { updates: Object.keys(updateTagDto) });

			const tag = await this.prisma.tag.update({
				where: { id },
				data: updateTagDto,
				include: tagInclude,
			});

			this.logger.log(`✅ Updated tag with ID: ${id}`);
			return tag;
		} catch (error) {
			this.logger.error(`❌ Error updating tag ${id}:`, error);
			throw error;
		}
	}

	/**
	 * Soft delete tag
	 */
	async remove(id: number): Promise<void> {
		try {
			// Ensure tag exists
			if (!await this.findOne(id)) {
				throw new NotFoundException(`Tag with ID ${id} not found`);
			}

			// Check if tag can be deleted
			const { canDelete, reason } = await this.canDelete(id);
			if (!canDelete) {
				throw new ConflictException(`Cannot delete tag: ${reason}`);
			}

			await this.prisma.tag.update({
				where: { id },
				data: { deletedAt: new Date() },
			});

			this.logger.log(`🗑️ Soft deleted tag with ID: ${id}`);
		} catch (error) {
			this.logger.error(`❌ Error deleting tag ${id}:`, error);
			throw error;
		}
	}

	/**
	 * Restore deleted tag
	 */
	async restore(id: number): Promise<FullTag> {
		try {
			const tag = await this.prisma.tag.findUnique({
				where: { id, deletedAt: { not: null } },
			});

			if (!tag) {
				throw new NotFoundException(
					`Tag with ID ${id} not found or is not deleted.`,
				);
			}

			const restoredTag = await this.prisma.tag.update({
				where: { id },
				data: { deletedAt: null },
				include: tagInclude,
			});

			this.logger.log(`♻️ Restored tag with ID: ${id}`);
			return restoredTag;
		} catch (error) {
			this.logger.error(`❌ Error restoring tag ${id}:`, error);
			throw error;
		}
	}

	/**
	 * Permanently delete tag
	 */
	async permanentDelete(id: number): Promise<void> {
		try {
			const tag = await this.prisma.tag.findUnique({
				where: { id, deletedAt: { not: null } },
			});

			if (!tag) {
				throw new NotFoundException(
					`Tag with ID ${id} not found or is not deleted.`,
				);
			}

			// Final check before permanent deletion
			const { canDelete, reason } = await this.canDelete(id);
			if (!canDelete) {
				throw new ConflictException(`Cannot permanently delete tag: ${reason}`);
			}

			await this.prisma.tag.delete({
				where: { id },
			});

			this.logger.log(`💥 Permanently deleted tag with ID: ${id}`);
		} catch (error) {
			this.logger.error(`❌ Error permanently deleting tag ${id}:`, error);
			throw error;
		}
	}

	// =============================================================================
	// BULK OPERATIONS
	// =============================================================================

	/**
	 * Bulk soft delete tags
	 */
	async bulkDelete(tagIds: number[]): Promise<any> {
		try {
			this.logger.debug(`🗑️ Bulk deleting ${tagIds.length} tags:`, { tagIds });

			// Check each tag can be deleted
			const checkResults = await Promise.all(
				tagIds.map(async (id) => {
					const { canDelete, reason } = await this.canDelete(id);
					return { id, canDelete, reason };
				})
			);

			const validIds = checkResults.filter(r => r.canDelete).map(r => r.id);
			const invalidIds = checkResults.filter(r => !r.canDelete);

			if (validIds.length === 0) {
				throw new ConflictException('No tags can be deleted');
			}

			const result = await this.prisma.tag.updateMany({
				where: {
					id: { in: validIds },
					deletedAt: null,
				},
				data: { deletedAt: new Date() },
			});

			const response = {
				success: true,
				affected: result.count,
				skipped: invalidIds.length,
				skippedReasons: invalidIds.map(item => ({ id: item.id, reason: item.reason })),
				message: `Successfully deleted ${result.count} tags, skipped ${invalidIds.length}`,
			};

			this.logger.log(`✅ Bulk deleted ${result.count} tags`);
			return response;
		} catch (error) {
			this.logger.error(`❌ Error bulk deleting tags:`, error);
			throw error;
		}
	}

	/**
	 * Bulk restore tags
	 */
	async bulkRestore(tagIds: number[]): Promise<any> {
		try {
			this.logger.debug(`♻️ Bulk restoring ${tagIds.length} tags:`, { tagIds });

			const result = await this.prisma.tag.updateMany({
				where: {
					id: { in: tagIds },
					deletedAt: { not: null },
				},
				data: { deletedAt: null },
			});

			const response = {
				success: true,
				affected: result.count,
				message: `Successfully restored ${result.count} tags`,
			};

			this.logger.log(`✅ Bulk restored ${result.count} tags`);
			return response;
		} catch (error) {
			this.logger.error(`❌ Error bulk restoring tags:`, error);
			throw error;
		}
	}

	/**
	 * Bulk permanent delete tags
	 */
	async bulkPermanentDelete(tagIds: number[]): Promise<any> {
		try {
			this.logger.debug(`💥 Bulk permanent deleting ${tagIds.length} tags:`, { tagIds });

			// Check each tag can be deleted
			const checkResults = await Promise.all(
				tagIds.map(async (id) => {
					const { canDelete, reason } = await this.canDelete(id);
					return { id, canDelete, reason };
				})
			);

			const validIds = checkResults.filter(r => r.canDelete).map(r => r.id);
			const invalidIds = checkResults.filter(r => !r.canDelete);

			if (validIds.length === 0) {
				throw new ConflictException('No tags can be permanently deleted');
			}

			const result = await this.prisma.tag.deleteMany({
				where: {
					id: { in: validIds },
					deletedAt: { not: null },
				},
			});

			const response = {
				success: true,
				affected: result.count,
				skipped: invalidIds.length,
				skippedReasons: invalidIds.map(item => ({ id: item.id, reason: item.reason })),
				message: `Successfully permanently deleted ${result.count} tags, skipped ${invalidIds.length}`,
			};

			this.logger.log(`✅ Bulk permanently deleted ${result.count} tags`);
			return response;
		} catch (error) {
			this.logger.error(`❌ Error bulk permanent deleting tags:`, error);
			throw error;
		}
	}
} 