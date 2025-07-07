import {
	Injectable,
	NotFoundException,
	ConflictException,
} from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { 
	CreateTagDto, 
	UpdateTagDto, 
	TagQueryDto, 
	AdminTagQueryDto,
	TagOptionDto,
	TagListResponseDto,
	TagMetaResponseDto,
} from './dto/tag.dto'
import { Prisma } from '@prisma/client'
import { IPaginatedResponse } from 'src/common/interfaces'

@Injectable()
export class TagService {
	constructor(private prisma: PrismaService) {}

	async create(createTagDto: CreateTagDto) {
		const existingTag = await this.prisma.tag.findFirst({
			where: {
				OR: [{ name: createTagDto.name }, { slug: createTagDto.slug }],
			},
		})

		if (existingTag) {
			throw new ConflictException('Tag with this name or slug already exists.')
		}

		return this.prisma.tag.create({ data: createTagDto })
	}

	async findAll(
		query: AdminTagQueryDto,
	): Promise<TagListResponseDto> {
		const { page = 1, limit = 10, search, deleted = false, sortBy = 'createdAt', sortOrder = 'desc' } = query
		const skip = (page - 1) * limit

		const where: Prisma.TagWhereInput = {
			deletedAt: deleted ? { not: null } : null,
		}

		if (search) {
			where.OR = [
				{ name: { contains: search, mode: 'insensitive' } },
				{ slug: { contains: search, mode: 'insensitive' } },
			]
		}

		const [data, total] = await this.prisma.$transaction([
			this.prisma.tag.findMany({
				where,
				skip,
				take: limit,
				orderBy: { [sortBy]: sortOrder },
			}),
			this.prisma.tag.count({ where }),
		])

		const totalPages = Math.ceil(total / limit)

		return {
			data: data as any, // Type assertion to handle the complex type mapping
			meta: {
				total,
				page,
				limit,
				totalPages,
				hasNext: page < totalPages,
				hasPrevious: page > 1,
			},
		}
	}

	async findOne(id: number) {
		const tag = await this.prisma.tag.findUnique({ where: { id } })
		if (!tag) {
			throw new NotFoundException(`Tag with ID ${id} not found.`)
		}
		return tag
	}

	async update(id: number, updateTagDto: UpdateTagDto) {
		await this.findOne(id)

		if (updateTagDto.name || updateTagDto.slug) {
			const existingTag = await this.prisma.tag.findFirst({
				where: {
					id: { not: id },
					OR: [
						{ name: updateTagDto.name },
						{ slug: updateTagDto.slug },
					],
				},
			})
			if (existingTag) {
				throw new ConflictException(
					'Another tag with this name or slug already exists.',
				)
			}
		}
		return this.prisma.tag.update({ where: { id }, data: updateTagDto })
	}

	async delete(id: number): Promise<void> {
		await this.findOne(id)
		await this.prisma.tag.update({
			where: { id },
			data: { deletedAt: new Date() },
		})
	}

	async restore(id: number) {
		const tag = await this.prisma.tag.findUnique({
			where: { id, deletedAt: { not: null } },
		})
		if (!tag) {
			throw new NotFoundException(`Tag with ID ${id} not found or is not deleted.`)
		}
		return this.prisma.tag.update({
			where: { id },
			data: { deletedAt: null },
		})
	}

	async permanentDelete(id: number): Promise<void> {
		const tag = await this.prisma.tag.findFirst({
			where: { id, deletedAt: { not: null } },
		})
		if (!tag) {
			throw new NotFoundException(
				`Tag with ID ${id} is not soft-deleted or does not exist.`,
			)
		}
		await this.prisma.tag.delete({ where: { id } })
	}
	
	async findPublic(query: TagQueryDto): Promise<TagListResponseDto> {
		const publicQuery = { ...query, deleted: false };
		return this.findAll(publicQuery as AdminTagQueryDto);
	}

	async getStats(): Promise<any> {
		const [
			total,
			deleted,
		] = await this.prisma.$transaction([
			this.prisma.tag.count({ where: { deletedAt: null } }),
			this.prisma.tag.count({ where: { deletedAt: { not: null } } }),
		]);

		const now = new Date();
		const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
		const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
		const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

		const [thisMonth, thisWeek, today] = await this.prisma.$transaction([
			this.prisma.tag.count({
				where: {
					deletedAt: null,
					createdAt: { gte: startOfMonth },
				},
			}),
			this.prisma.tag.count({
				where: {
					deletedAt: null,
					createdAt: { gte: startOfWeek },
				},
			}),
			this.prisma.tag.count({
				where: {
					deletedAt: null,
					createdAt: { gte: startOfDay },
				},
			}),
		]);

		// Get most popular tag (by blog count)
		const mostPopularTag = await this.prisma.tag.findFirst({
			where: { deletedAt: null },
			include: {
				_count: {
					select: { blogs: true },
				},
			},
			orderBy: {
				blogs: { _count: 'desc' },
			},
		});

		return {
			total,
			deleted,
			thisMonth,
			thisWeek,
			today,
			mostPopular: mostPopularTag?.name || 'N/A',
		};
	}

	async getOptions(): Promise<TagOptionDto[]> {
		const tags = await this.prisma.tag.findMany({
			where: { deletedAt: null },
			select: { id: true, name: true, slug: true },
			orderBy: { name: 'asc' },
		})
		return tags.map(tag => ({
			value: tag.id,
			label: tag.name,
			slug: tag.slug,
		}))
	}

	async bulkDelete(tagIds: number[]): Promise<any> {
		const result = await this.prisma.tag.updateMany({
			where: {
				id: { in: tagIds },
				deletedAt: null,
			},
			data: { deletedAt: new Date() },
		});

		return {
			success: true,
			affected: result.count,
			message: `Successfully deleted ${result.count} tags`,
		};
	}

	async bulkRestore(tagIds: number[]): Promise<any> {
		const result = await this.prisma.tag.updateMany({
			where: {
				id: { in: tagIds },
				deletedAt: { not: null },
			},
			data: { deletedAt: null },
		});

		return {
			success: true,
			affected: result.count,
			message: `Successfully restored ${result.count} tags`,
		};
	}

	async bulkPermanentDelete(tagIds: number[]): Promise<any> {
		const result = await this.prisma.tag.deleteMany({
			where: {
				id: { in: tagIds },
				deletedAt: { not: null },
			},
		});

		return {
			success: true,
			affected: result.count,
			message: `Successfully permanently deleted ${result.count} tags`,
		};
	}

	async getTagOptions(): Promise<TagOptionDto[]> {
		return this.getOptions();
	}
} 