import {
	Injectable,
	NotFoundException,
	ConflictException,
} from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import {
	CreateUserDto,
	UpdateUserDto,
	UserQueryDto,
	UserResponseDto,
} from './dto/user.dto'
import { Prisma, User } from '@prisma/client'
import * as bcrypt from 'bcrypt'

type FullUser = User & {
	role?: {
		id: number
		name: string
		description: string | null
		permissions?: {
			id: number
			name: string
			description: string | null
		}[]
	} | null
	profile?: {
		id: number
		bio: string | null
		avatarUrl: string | null
		socialLinks: Prisma.JsonValue
	} | null
	accounts?: {
		id: string
		provider: string
		type: string
	}[]
	_count?: {
		blogs: number
		medias: number
		recruitments: number
		likedBlogs?: number
		bookmarkedBlogs?: number
		blogComments?: number
	}
}

@Injectable()
export class UserService {
	constructor(private prisma: PrismaService) {}

	private formatUserResponse(user: FullUser): UserResponseDto {
		// Ensure password is not returned
		delete (user as Partial<FullUser>).hashedPassword
		return user as UserResponseDto
	}

	private formatUserListResponse(user: FullUser) {
		delete (user as Partial<FullUser>).hashedPassword
		return {
			id: user.id,
			email: user.email,
			name: user.name,
			avatarUrl: user.avatarUrl,
			image: user.image,
			emailVerified: user.emailVerified,
			roleId: user.roleId,
			createdAt: user.createdAt,
			updatedAt: user.updatedAt,
			deletedAt: user.deletedAt,
			role: user.role,
			_count: user._count,
		}
	}

	async findAll(query: UserQueryDto) {
		const {
			page = 1,
			limit = 10,
			search,
			roleId,
			sortBy = 'createdAt',
			sortOrder = 'desc',
			deleted = false,
		} = query

		const skip = (page - 1) * limit
		const where: Prisma.UserWhereInput = { deletedAt: deleted ? { not: null } : null }

		if (search) {
			where.OR = [
				{ name: { contains: search, mode: 'insensitive' } },
				{ email: { contains: search, mode: 'insensitive' } },
			]
		}
		if (roleId) {
			where.roleId = roleId
		}

		const orderBy: Prisma.UserOrderByWithRelationInput = { [sortBy]: sortOrder }
		const include: Prisma.UserInclude = {
			role: { select: { id: true, name: true, description: true } },
			_count: { select: { blogs: true, medias: true, recruitments: true } },
		}

		const [users, total] = await this.prisma.$transaction([
			this.prisma.user.findMany({ where, skip, take: limit, orderBy, include }),
			this.prisma.user.count({ where }),
		])

		const totalPages = Math.ceil(total / limit)

		return {
			data: users.map(this.formatUserListResponse),
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

	async findOne(id: number, includeDeleted = false): Promise<UserResponseDto> {
		const user = await this.prisma.user.findUnique({
			where: { id },
			include: {
				role: {
					include: { permissions: { where: { deletedAt: null } } },
				},
				profile: true,
				accounts: true,
				_count: {
					select: {
						blogs: true,
						medias: true,
						recruitments: true,
						likedBlogs: true,
						bookmarkedBlogs: true,
						blogComments: true,
					},
				},
			},
		})

		if (!user || (!includeDeleted && user.deletedAt)) {
			throw new NotFoundException(`User with ID ${id} not found`)
		}

		return this.formatUserResponse(user)
	}

	async findByEmail(
		email: string,
		includeDeleted = false,
	): Promise<UserResponseDto | null> {
		const user = await this.prisma.user.findUnique({ where: { email } })

		if (!user || (!includeDeleted && user.deletedAt)) {
			return null
		}

		return this.formatUserResponse(user)
	}

	async create(createUserDto: CreateUserDto): Promise<UserResponseDto> {
		const { password, profile, ...userData } = createUserDto

		const hashedPassword = await bcrypt.hash(password, 10)

		try {
			const user = await this.prisma.user.create({
				data: {
					...userData,
					hashedPassword,
					profile: profile
						? {
								create: {
									bio: profile.bio,
									avatarUrl: profile.avatarUrl,
									socialLinks: profile.socialLinks || Prisma.JsonNull,
								},
						  }
						: undefined,
				},
				include: { role: true },
			})
			return this.formatUserResponse(user)
		} catch (error) {
			if (
				error instanceof Prisma.PrismaClientKnownRequestError &&
				error.code === 'P2002'
			) {
				throw new ConflictException('User with this email already exists.')
			}
			throw error
		}
	}

	async update(
		id: number,
		updateUserDto: UpdateUserDto,
	): Promise<UserResponseDto> {
		const { profile, ...userData } = updateUserDto

		// Ensure user exists before trying to update
		await this.findOne(id)

		try {
			const user = await this.prisma.user.update({
				where: { id },
				data: {
					...userData,
					profile: profile
						? {
								upsert: {
									create: {
										bio: profile.bio,
										avatarUrl: profile.avatarUrl,
										socialLinks: profile.socialLinks || Prisma.JsonNull,
									},
									update: {
										bio: profile.bio,
										avatarUrl: profile.avatarUrl,
										socialLinks: profile.socialLinks,
									},
								},
						  }
						: undefined,
				},
				include: {
					role: true,
					profile: true,
				},
			})
			return this.formatUserResponse(user)
		} catch (error) {
			if (
				error instanceof Prisma.PrismaClientKnownRequestError &&
				error.code === 'P2002'
			) {
				throw new ConflictException('Email already exists for another user.')
			}
			throw error
		}
	}

	async remove(id: number): Promise<void> {
		await this.findOne(id)
		await this.prisma.user.update({
			where: { id },
			data: { deletedAt: new Date() },
		})
	}

	async restore(id: number): Promise<UserResponseDto> {
		const user = await this.findOne(id, true) // find user even if deleted
		if (!user.deletedAt) {
			throw new ConflictException('User is not deleted.')
		}
		const restoredUser = await this.prisma.user.update({
			where: { id },
			data: { deletedAt: null },
		})
		return this.formatUserResponse(restoredUser)
	}

	async permanentDelete(id: number): Promise<void> {
		await this.findOne(id, true)
		// Additional checks can be added here, e.g., for related data
		await this.prisma.user.delete({ where: { id } })
	}

	// ====== BULK OPERATIONS ======

	async bulkDelete(userIds: number[]): Promise<{ deletedCount: number }> {
		const result = await this.prisma.user.updateMany({
			where: { id: { in: userIds }, deletedAt: null },
			data: { deletedAt: new Date() },
		})
		return { deletedCount: result.count }
	}

	async bulkRestore(userIds: number[]): Promise<{ restoredCount: number }> {
		const result = await this.prisma.user.updateMany({
			where: { id: { in: userIds }, deletedAt: { not: null } },
			data: { deletedAt: null },
		})
		return { restoredCount: result.count }
	}

	async bulkPermanentDelete(
		userIds: number[],
	): Promise<{ deletedCount: number }> {
		const result = await this.prisma.user.deleteMany({
			where: { id: { in: userIds } },
		})
		return { deletedCount: result.count }
	}

	async getUserStats(deleted: boolean = false) {
		const where: Prisma.UserWhereInput = {
			deletedAt: deleted ? { not: null } : null,
		}

		const totalCount = await this.prisma.user.count({ where })
		const totalUsers = await this.prisma.user.count()

		return {
			total: totalUsers,
			active: totalUsers - (await this.prisma.user.count({ where: { deletedAt: { not: null } } })),
			deleted: await this.prisma.user.count({ where: { deletedAt: { not: null } } }),
			countByType: deleted ? totalCount : undefined,
		}
	}
}
