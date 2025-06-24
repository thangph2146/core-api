import {
	Injectable,
	NotFoundException,
	ConflictException,
} from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateTagDto, UpdateTagDto, TagQueryDto, TagOptionDto } from './dto/tag.dto'
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
		query: TagQueryDto,
	): Promise<IPaginatedResponse<any>> {
		const { page = 1, limit = 10, search, deleted = false } = query
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
				orderBy: { createdAt: 'desc' },
			}),
			this.prisma.tag.count({ where }),
		])

		const totalPages = Math.ceil(total / limit)

		return {
			data,
			total,
			page,
			limit,
			totalPages,
			hasNext: page < totalPages,
			hasPrevious: page > 1,
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
	
	async getTagOptions(): Promise<TagOptionDto[]> {
		const tags = await this.prisma.tag.findMany({
			where: { deletedAt: null },
			select: { id: true, name: true },
			orderBy: { name: 'asc' },
		})
		return tags.map(tag => ({
			value: tag.id,
			label: tag.name,
		}))
	}
} 