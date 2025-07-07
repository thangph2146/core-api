import {
	Injectable,
	NotFoundException,
	ConflictException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
	CreateCategoryDto,
	UpdateCategoryDto,
	CategoryQueryDto,
	AdminCategoryQueryDto,
	CategoryOptionDto,
	CategoryListResponseDto,
	CategoryMetaResponseDto,
	CategoryType,
} from './dto/category.dto';
import { IPaginatedResponse } from 'src/common/interfaces';

@Injectable()
export class CategoryService {
	constructor(private prisma: PrismaService) {}

	async create(createCategoryDto: CreateCategoryDto) {
		const { name, type, slug } = createCategoryDto;
		const existing = await this.prisma.category.findFirst({
			where: { OR: [{ name, type }, { slug, type }] },
		});

		if (existing) {
			throw new ConflictException(
				`A category with name '${name}' or slug '${slug}' and type '${type}' already exists.`,
			);
		}

		return this.prisma.category.create({
			data: createCategoryDto,
		});
	}

	async findAll(query: AdminCategoryQueryDto): Promise<CategoryListResponseDto> {
		const { page = 1, limit = 10, type, search, deleted = false, sortBy = 'createdAt', sortOrder = 'desc' } = query;
		const skip = (page - 1) * limit;

		const where: Prisma.CategoryWhereInput = {
			deletedAt: deleted ? { not: null } : null,
		};

		if (type) {
			where.type = type;
		}

		if (search) {
			where.OR = [
				{ name: { contains: search, mode: 'insensitive' } },
				{ description: { contains: search, mode: 'insensitive' } },
			];
		}

		const [categories, total] = await this.prisma.$transaction([
			this.prisma.category.findMany({
				where,
				skip,
				take: limit,
				orderBy: { [sortBy]: sortOrder },
				include: {
					_count: {
						select: {
							blogs: true,
							recruitmentPosts: true,
							services: true,
						},
					},
				},
			}),
			this.prisma.category.count({ where }),
		]);

		const totalPages = Math.ceil(total / limit);

		return {
			data: categories as any, // Type assertion to handle the complex type mapping
			meta: {
				total,
				page,
				limit,
				totalPages,
				hasNext: page < totalPages,
				hasPrevious: page > 1,
			},
		};
	}

	async findOne(id: number) {
		const category = await this.prisma.category.findUnique({
			where: { id },
			include: {
				parent: true,
				children: true,
			},
		});

		if (!category) {
			throw new NotFoundException(`Category with ID ${id} not found`);
		}
		return category;
	}

	async findBySlug(slug: string, type: string) {
		const category = await this.prisma.category.findFirst({
			where: {
				slug,
				type,
				deletedAt: null,
			},
		});
		if (!category) {
			throw new NotFoundException(
				`Category with slug '${slug}' and type '${type}' not found`,
			);
		}
		return category;
	}

	async update(id: number, updateCategoryDto: UpdateCategoryDto) {
		await this.findOne(id); // Check if exists and throw NotFoundException if not
		return this.prisma.category.update({
			where: { id },
			data: updateCategoryDto,
		});
	}

	async delete(id: number): Promise<void> {
		await this.findOne(id);
		await this.prisma.category.update({
			where: { id },
			data: { deletedAt: new Date() },
		});
	}

	async restore(id: number) {
		const category = await this.prisma.category.findUnique({
			where: { id, deletedAt: { not: null } },
		});

		if (!category) {
			throw new NotFoundException(
				`Deleted category with ID ${id} not found.`,
			);
		}

		return this.prisma.category.update({
			where: { id },
			data: { deletedAt: null },
		});
	}

	async permanentDelete(id: number): Promise<void> {
		const category = await this.findOne(id);
		await this.prisma.category.delete({ where: { id } });
	}

	async findPublic(query: CategoryQueryDto): Promise<CategoryListResponseDto> {
		const publicQuery = { ...query, deleted: false };
		return this.findAll(publicQuery as AdminCategoryQueryDto);
	}

	async getStats(): Promise<any> {
		const [
			total,
			blogCategories,
			projectCategories,
			serviceCategories,
			recruitmentCategories,
			deleted,
		] = await this.prisma.$transaction([
			this.prisma.category.count({ where: { deletedAt: null } }),
			this.prisma.category.count({ where: { deletedAt: null, type: 'BLOG' } }),
			this.prisma.category.count({ where: { deletedAt: null, type: 'PROJECT' } }),
			this.prisma.category.count({ where: { deletedAt: null, type: 'SERVICE' } }),
			this.prisma.category.count({ where: { deletedAt: null, type: 'RECRUITMENT' } }),
			this.prisma.category.count({ where: { deletedAt: { not: null } } }),
		]);

		const now = new Date();
		const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
		const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
		const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

		const [thisMonth, thisWeek, today] = await this.prisma.$transaction([
			this.prisma.category.count({
				where: {
					deletedAt: null,
					createdAt: { gte: startOfMonth },
				},
			}),
			this.prisma.category.count({
				where: {
					deletedAt: null,
					createdAt: { gte: startOfWeek },
				},
			}),
			this.prisma.category.count({
				where: {
					deletedAt: null,
					createdAt: { gte: startOfDay },
				},
			}),
		]);

		return {
			total,
			blogCategories,
			projectCategories,
			serviceCategories,
			recruitmentCategories,
			deleted,
			thisMonth,
			thisWeek,
			today,
		};
	}

	async getOptions(type?: string): Promise<CategoryOptionDto[]> {
		const where: Prisma.CategoryWhereInput = {
			deletedAt: null,
		};

		if (type) {
			where.type = type;
		}

		const categories = await this.prisma.category.findMany({
			where,
			select: {
				id: true,
				name: true,
				type: true,
				slug: true,
				parentId: true,
			},
			orderBy: {
				name: 'asc',
			},
		});

		return categories.map(category => ({
			value: category.id,
			label: category.name,
			type: category.type,
			slug: category.slug,
			parentId: category.parentId || undefined,
		}));
	}

	async bulkDelete(categoryIds: number[]): Promise<any> {
		const result = await this.prisma.category.updateMany({
			where: {
				id: { in: categoryIds },
				deletedAt: null,
			},
			data: { deletedAt: new Date() },
		});

		return {
			success: true,
			affected: result.count,
			message: `Successfully deleted ${result.count} categories`,
		};
	}

	async bulkRestore(categoryIds: number[]): Promise<any> {
		const result = await this.prisma.category.updateMany({
			where: {
				id: { in: categoryIds },
				deletedAt: { not: null },
			},
			data: { deletedAt: null },
		});

		return {
			success: true,
			affected: result.count,
			message: `Successfully restored ${result.count} categories`,
		};
	}

	async bulkPermanentDelete(categoryIds: number[]): Promise<any> {
		const result = await this.prisma.category.deleteMany({
			where: {
				id: { in: categoryIds },
				deletedAt: { not: null },
			},
		});

		return {
			success: true,
			affected: result.count,
			message: `Successfully permanently deleted ${result.count} categories`,
		};
	}

	async getCategoryOptions(type?: string): Promise<CategoryOptionDto[]> {
		return this.getOptions(type);
	}
}
