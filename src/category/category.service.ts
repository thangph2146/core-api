import {
	Injectable,
	NotFoundException,
	ConflictException,
	Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
	CreateCategoryDto,
	UpdateCategoryDto,
	CategoryQueryDto,
	CategoryOptionDto,
	CategoryListResponseDto,
	CategoryMetaResponseDto,
	CategoryType,
} from './dto/category.dto';
import { IPaginatedResponse } from 'src/common/interfaces';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

// Define the full structure of the category object we want to return
const categoryInclude: Prisma.CategoryInclude = {
	parent: true,
	children: true,
	_count: {
		select: {
			blogs: true,
			children: true,
			recruitmentPosts: true,
			services: true,
		},
	},
};

type FullCategory = Prisma.CategoryGetPayload<{
	include: typeof categoryInclude;
}>;

// =============================================================================
// INTERFACES
// =============================================================================

interface CategoryFilterOptions {
	search?: string;
	type?: CategoryType;
	deleted?: boolean;
	parentId?: number;
}

interface CategorySortOptions {
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
 * Category Service - Business Logic Layer
 * 
 * Service này quản lý tất cả business logic cho Category entity, bao gồm:
 * 
 * 🔍 SEPARATED READ OPERATIONS:
 * - findAll() → Danh sách category với filter admin (bao gồm deleted)
 * - findPublic() → Danh sách category công khai (không deleted)
 * - findOne() → Chi tiết category theo ID
 * - findBySlug() → Chi tiết category theo slug
 * 
 * ✏️ WRITE OPERATIONS:
 * - create() → Tạo category mới
 * - update() → Cập nhật category
 * - remove() → Soft delete category
 * - restore() → Khôi phục category đã xóa
 * - permanentDelete() → Xóa vĩnh viễn category
 * 
 * 🔄 BULK OPERATIONS:
 * - bulkDelete() → Xóa mềm nhiều category
 * - bulkRestore() → Khôi phục nhiều category
 * - bulkPermanentDelete() → Xóa vĩnh viễn nhiều category
 * 
 * 📊 UTILITY OPERATIONS:
 * - getStats() → Thống kê category
 * - getOptions() → Danh sách category cho dropdown
 * - getTree() → Cấu trúc cây category
 * - getChildren() → Category con
 * 
 * @version 2.1.0 - Chuẩn hóa theo UserService pattern
 * @author PHGroup Development Team
 */
@Injectable()
export class CategoryService {
	private readonly logger = new Logger(CategoryService.name);

	constructor(private prisma: PrismaService) {
		this.logger.log('🚀 CategoryService initialized with standardized patterns');
	}

	// =============================================================================
	// PRIVATE HELPER METHODS
	// =============================================================================

	/**
	 * Build WHERE clause for category queries
	 */
	private buildWhereClause(filters: CategoryFilterOptions): Prisma.CategoryWhereInput {
		const where: Prisma.CategoryWhereInput = {};

		// Handle deleted filter
		this.applyDeletedFilter(where, filters);

		// Handle search filter
		if (filters.search) {
			this.applySearchFilter(where, filters.search);
		}

		// Handle type filter
		if (filters.type) {
			where.type = filters.type;
		}

		// Handle parent filter
		if (filters.parentId !== undefined) {
			where.parentId = filters.parentId;
		}

		return where;
	}

	/**
	 * Apply deleted filter to WHERE clause
	 */
	private applyDeletedFilter(
		where: Prisma.CategoryWhereInput,
		filters: CategoryFilterOptions,
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
		where: Prisma.CategoryWhereInput,
		search: string,
	): void {
		where.OR = [
			{ name: { contains: search, mode: 'insensitive' } },
			{ description: { contains: search, mode: 'insensitive' } },
		];
	}

	/**
	 * Build ORDER BY clause for category queries
	 */
	private buildOrderByClause(
		sort: CategorySortOptions,
	): Prisma.CategoryOrderByWithRelationInput {
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
	): CategoryMetaResponseDto {
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
	 * Transform paginated result to CategoryListResponseDto
	 */
	private transformToCategoryListResponse(
		result: IPaginatedResponse<FullCategory>,
	): CategoryListResponseDto {
		return {
			data: result.data as any,
			meta: this.calculateMeta(result.total, result.page, result.limit),
		};
	}

	/**
	 * Check if category can be deleted
	 */
	private async canDelete(id: number): Promise<{ canDelete: boolean; reason?: string }> {
		const categoryWithChildren = await this.prisma.category.findUnique({
			where: { id },
			include: {
				children: true,
				_count: {
					select: {
						blogs: true,
					},
				},
			},
		});

		if (!categoryWithChildren) {
			return { canDelete: false, reason: 'Category not found' };
		}

		if (categoryWithChildren.children.length > 0) {
			return { canDelete: false, reason: 'Category has child categories' };
		}

		if (categoryWithChildren._count.blogs > 0) {
			return { canDelete: false, reason: 'Category is being used by blogs' };
		}

		return { canDelete: true };
	}

	// =============================================================================
	// MAIN READ OPERATIONS
	// =============================================================================

	/**
	 * Find all categories with admin permissions (including deleted)
	 */
	async findAll(query: CategoryQueryDto): Promise<CategoryListResponseDto> {
		const {
			page = 1,
			limit = 10,
			search,
			type,
			deleted = false,
			sortBy = 'createdAt',
			sortOrder = 'desc',
		} = query;

		this.logger.debug(`🔍 Finding all categories with filters:`, {
			page, limit, search, type, deleted, sortBy, sortOrder
		});

		const skip = (page - 1) * limit;
		const filters: CategoryFilterOptions = { search, type, deleted };
		const sort: CategorySortOptions = { sortBy, sortOrder };

		const where = this.buildWhereClause(filters);
		const orderBy = this.buildOrderByClause(sort);

		try {
			const [items, total] = await this.prisma.$transaction([
				this.prisma.category.findMany({
					where,
					include: categoryInclude,
					skip,
					take: limit,
					orderBy,
				}),
				this.prisma.category.count({ where }),
			]);

			const result: IPaginatedResponse<FullCategory> = {
				data: items,
				total,
				page,
				limit,
				totalPages: Math.ceil(total / limit),
				hasNext: page < Math.ceil(total / limit),
				hasPrevious: page > 1,
			};

			this.logger.debug(`✅ Found ${total} categories, returning page ${page}/${Math.ceil(total / limit)}`);
			return this.transformToCategoryListResponse(result);
		} catch (error) {
			this.logger.error(`❌ Error finding categories:`, error);
			throw error;
		}
	}

	/**
	 * Find public categories (no deleted)
	 */
	async findPublic(query: Partial<CategoryQueryDto>): Promise<CategoryListResponseDto> {
		const publicQuery: CategoryQueryDto = {
			...query,
			deleted: false,
		};

		const where = this.buildWhereClause({ ...publicQuery, deleted: false });

		const {
			page = 1,
			limit = 10,
			sortBy = 'createdAt',
			sortOrder = 'asc',
		} = query;

		this.logger.debug(`🌐 Finding public categories with constraints`);

		try {
			const skip = (page - 1) * limit;
			const orderBy = this.buildOrderByClause({ sortBy, sortOrder });

			const [items, total] = await this.prisma.$transaction([
				this.prisma.category.findMany({
					where,
					include: categoryInclude,
					skip,
					take: limit,
					orderBy,
				}),
				this.prisma.category.count({ where }),
			]);

			const result: IPaginatedResponse<FullCategory> = {
				data: items,
				total,
				page,
				limit,
				totalPages: Math.ceil(total / limit),
				hasNext: page < Math.ceil(total / limit),
				hasPrevious: page > 1,
			};

			this.logger.debug(`✅ Found ${total} public categories`);
			return this.transformToCategoryListResponse(result);
		} catch (error) {
			this.logger.error(`❌ Error finding public categories:`, error);
			throw error;
		}
	}

	/**
	 * Find category by ID
	 */
	async findOne(id: number): Promise<FullCategory | null> {
		try {
			const category = await this.prisma.category.findUnique({
				where: { id, deletedAt: null },
				include: categoryInclude,
			});

			if (category) {
				this.logger.debug(`✅ Found category with ID: ${id}`);
			} else {
				this.logger.debug(`❌ Category not found with ID: ${id}`);
			}

			return category;
		} catch (error) {
			this.logger.error(`❌ Error finding category ${id}:`, error);
			throw error;
		}
	}

	/**
	 * Find category by slug
	 */
	async findBySlug(slug: string, type: string): Promise<FullCategory> {
		try {
			const category = await this.prisma.category.findFirst({
				where: { 
					slug, 
					type,
					deletedAt: null 
				},
				include: categoryInclude,
			});

			if (!category) {
				this.logger.warn(`❌ Category not found with slug: ${slug} and type: ${type}`);
				throw new NotFoundException(`Category with slug "${slug}" and type "${type}" not found`);
			}

			this.logger.debug(`✅ Found category with slug: ${slug}`);
			return category;
		} catch (error) {
			this.logger.error(`❌ Error finding category by slug ${slug}:`, error);
			throw error;
		}
	}

	// =============================================================================
	// UTILITY OPERATIONS
	// =============================================================================

	/**
	 * Get category statistics
	 */
	async getStats(): Promise<any> {
		try {
			const [total, blog, deleted, totalBlogs] = await this.prisma.$transaction([
				this.prisma.category.count({ where: { deletedAt: null } }),
				this.prisma.category.count({ 
					where: { 
						deletedAt: null, 
						type: CategoryType.BLOG 
					} 
				}),
				this.prisma.category.count({ where: { deletedAt: { not: null } } }),
				this.prisma.blog.count({ where: { categoryId: { not: null } } }),
			]);

			const stats = {
				total,
				blog,
				deleted,
				totalBlogs,
			};

			this.logger.debug(`📊 Category stats calculated:`, stats);
			return stats;
		} catch (error) {
			this.logger.error(`❌ Error calculating category stats:`, error);
			throw error;
		}
	}

	/**
	 * Get category options for dropdown/select
	 */
	async getOptions(type?: CategoryType): Promise<CategoryOptionDto[]> {
		try {
			const categories = await this.prisma.category.findMany({
				where: { 
					deletedAt: null,
					type: type || undefined 
				},
				select: {
					id: true,
					name: true,
					slug: true,
					type: true,
				},
				orderBy: { name: 'asc' },
			});

			const options = categories.map(category => ({
				value: category.id,
				label: category.name,
				slug: category.slug,
				type: category.type,
			}));

			this.logger.debug(`✅ Generated ${options.length} category options`);
			return options;
		} catch (error) {
			this.logger.error(`❌ Error generating category options:`, error);
			throw error;
		}
	}

	/**
	 * Get category tree structure
	 */
	async getTree(type?: CategoryType): Promise<FullCategory[]> {
		try {
			const categories = await this.prisma.category.findMany({
				where: {
					deletedAt: null,
					parentId: null, // Only root categories
					type: type || undefined,
				},
				include: {
					...categoryInclude,
					children: {
						include: categoryInclude,
					},
				},
				orderBy: { createdAt: 'asc' },
			});

			this.logger.debug(`✅ Generated category tree with ${categories.length} root categories`);
			return categories;
		} catch (error) {
			this.logger.error(`❌ Error generating category tree:`, error);
			throw error;
		}
	}

	/**
	 * Get children of a category
	 */
	async getChildren(parentId: number): Promise<FullCategory[]> {
		try {
			const children = await this.prisma.category.findMany({
				where: {
					parentId,
					deletedAt: null,
				},
				include: categoryInclude,
				orderBy: { createdAt: 'asc' },
			});

			this.logger.debug(`✅ Found ${children.length} children for category ${parentId}`);
			return children;
		} catch (error) {
			this.logger.error(`❌ Error finding children for category ${parentId}:`, error);
			throw error;
		}
	}

	// =============================================================================
	// WRITE OPERATIONS
	// =============================================================================

	/**
	 * Create new category
	 */
	async create(createCategoryDto: CreateCategoryDto): Promise<FullCategory> {
		try {
			this.logger.debug(`📝 Creating new category:`, { name: createCategoryDto.name });

			// Check if parent exists (if provided)
			if (createCategoryDto.parentId) {
				const parent = await this.findOne(createCategoryDto.parentId);
				if (!parent) {
					throw new NotFoundException(`Parent category with ID ${createCategoryDto.parentId} not found`);
				}
			}

			const category = await this.prisma.category.create({
				data: createCategoryDto,
				include: categoryInclude,
			});

			this.logger.log(`✅ Created category with ID: ${category.id}`);
			return category;
		} catch (error) {
			this.logger.error(`❌ Error creating category:`, error);
			throw error;
		}
	}

	/**
	 * Update category
	 */
	async update(id: number, updateCategoryDto: UpdateCategoryDto): Promise<FullCategory> {
		try {
			// Ensure category exists
			if (!await this.findOne(id)) {
				throw new NotFoundException(`Category with ID ${id} not found`);
			}

			// Check if parent exists (if provided)
			if (updateCategoryDto.parentId) {
				const parent = await this.findOne(updateCategoryDto.parentId);
				if (!parent) {
					throw new NotFoundException(`Parent category with ID ${updateCategoryDto.parentId} not found`);
				}
				
				// Prevent self-referencing or circular references
				if (updateCategoryDto.parentId === id) {
					throw new ConflictException('Category cannot be its own parent');
				}
			}

			this.logger.debug(`📝 Updating category ${id}:`, { updates: Object.keys(updateCategoryDto) });

			const category = await this.prisma.category.update({
				where: { id },
				data: updateCategoryDto,
				include: categoryInclude,
			});

			this.logger.log(`✅ Updated category with ID: ${id}`);
			return category;
		} catch (error) {
			this.logger.error(`❌ Error updating category ${id}:`, error);
			throw error;
		}
	}

	/**
	 * Soft delete category
	 */
	async remove(id: number): Promise<void> {
		try {
			// Ensure category exists
			if (!await this.findOne(id)) {
				throw new NotFoundException(`Category with ID ${id} not found`);
			}

			// Check if category can be deleted
			const { canDelete, reason } = await this.canDelete(id);
			if (!canDelete) {
				throw new ConflictException(`Cannot delete category: ${reason}`);
			}

			await this.prisma.category.update({
				where: { id },
				data: { deletedAt: new Date() },
			});

			this.logger.log(`🗑️ Soft deleted category with ID: ${id}`);
		} catch (error) {
			this.logger.error(`❌ Error deleting category ${id}:`, error);
			throw error;
		}
	}

	/**
	 * Restore deleted category
	 */
	async restore(id: number): Promise<FullCategory> {
		try {
			const category = await this.prisma.category.findUnique({
				where: { id, deletedAt: { not: null } },
			});

			if (!category) {
				throw new NotFoundException(
					`Category with ID ${id} not found or is not deleted.`,
				);
			}

			const restoredCategory = await this.prisma.category.update({
				where: { id },
				data: { deletedAt: null },
				include: categoryInclude,
			});

			this.logger.log(`♻️ Restored category with ID: ${id}`);
			return restoredCategory;
		} catch (error) {
			this.logger.error(`❌ Error restoring category ${id}:`, error);
			throw error;
		}
	}

	/**
	 * Permanently delete category
	 */
	async permanentDelete(id: number): Promise<void> {
		try {
			const category = await this.prisma.category.findUnique({
				where: { id, deletedAt: { not: null } },
			});

			if (!category) {
				throw new NotFoundException(
					`Category with ID ${id} not found or is not deleted.`,
				);
			}

			// Final check before permanent deletion
			const { canDelete, reason } = await this.canDelete(id);
			if (!canDelete) {
				throw new ConflictException(`Cannot permanently delete category: ${reason}`);
			}

			await this.prisma.category.delete({
				where: { id },
			});

			this.logger.log(`💥 Permanently deleted category with ID: ${id}`);
		} catch (error) {
			this.logger.error(`❌ Error permanently deleting category ${id}:`, error);
			throw error;
		}
	}

	// =============================================================================
	// BULK OPERATIONS
	// =============================================================================

	/**
	 * Bulk soft delete categories
	 */
	async bulkDelete(categoryIds: number[]): Promise<any> {
		try {
			this.logger.debug(`🗑️ Bulk deleting ${categoryIds.length} categories:`, { categoryIds });

			// Check each category can be deleted
			const checkResults = await Promise.all(
				categoryIds.map(async (id) => {
					const { canDelete, reason } = await this.canDelete(id);
					return { id, canDelete, reason };
				})
			);

			const validIds = checkResults.filter(r => r.canDelete).map(r => r.id);
			const invalidIds = checkResults.filter(r => !r.canDelete);

			if (validIds.length === 0) {
				throw new ConflictException('No categories can be deleted');
			}

			const result = await this.prisma.category.updateMany({
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
				message: `Successfully deleted ${result.count} categories, skipped ${invalidIds.length}`,
			};

			this.logger.log(`✅ Bulk deleted ${result.count} categories`);
			return response;
		} catch (error) {
			this.logger.error(`❌ Error bulk deleting categories:`, error);
			throw error;
		}
	}

	/**
	 * Bulk restore categories
	 */
	async bulkRestore(categoryIds: number[]): Promise<any> {
		try {
			this.logger.debug(`♻️ Bulk restoring ${categoryIds.length} categories:`, { categoryIds });

			const result = await this.prisma.category.updateMany({
				where: {
					id: { in: categoryIds },
					deletedAt: { not: null },
				},
				data: { deletedAt: null },
			});

			const response = {
				success: true,
				affected: result.count,
				message: `Successfully restored ${result.count} categories`,
			};

			this.logger.log(`✅ Bulk restored ${result.count} categories`);
			return response;
		} catch (error) {
			this.logger.error(`❌ Error bulk restoring categories:`, error);
			throw error;
		}
	}

	/**
	 * Bulk permanent delete categories
	 */
	async bulkPermanentDelete(categoryIds: number[]): Promise<any> {
		try {
			this.logger.debug(`💥 Bulk permanent deleting ${categoryIds.length} categories:`, { categoryIds });

			// Check each category can be deleted
			const checkResults = await Promise.all(
				categoryIds.map(async (id) => {
					const { canDelete, reason } = await this.canDelete(id);
					return { id, canDelete, reason };
				})
			);

			const validIds = checkResults.filter(r => r.canDelete).map(r => r.id);
			const invalidIds = checkResults.filter(r => !r.canDelete);

			if (validIds.length === 0) {
				throw new ConflictException('No categories can be permanently deleted');
			}

			const result = await this.prisma.category.deleteMany({
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
				message: `Successfully permanently deleted ${result.count} categories, skipped ${invalidIds.length}`,
			};

			this.logger.log(`✅ Bulk permanently deleted ${result.count} categories`);
			return response;
		} catch (error) {
			this.logger.error(`❌ Error bulk permanent deleting categories:`, error);
			throw error;
		}
	}
}
