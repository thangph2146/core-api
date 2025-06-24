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
	CategoryOptionDto,
} from './dto/category.dto';

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

	async findAll(query: CategoryQueryDto) {
		const { page = 1, limit = 10, type, search, deleted = false } = query;
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
				orderBy: { createdAt: 'desc' },
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

		return {
			data: categories,
			meta: {
				total,
				page,
				limit,
				totalPages: Math.ceil(total / limit),
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

	async getCategoryOptions(type?: string): Promise<CategoryOptionDto[]> {
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
			},
			orderBy: {
				name: 'asc',
			},
		});

		return categories.map(category => ({
			value: category.id,
			label: category.name,
			type: category.type,
		}));
	}
}
