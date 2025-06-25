import {
	Injectable,
	NotFoundException,
	ConflictException,
	BadRequestException,
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
			includeDeleted = false,
		} = query

		const skip = (page - 1) * limit
		
		// Fix: Properly handle deleted and includeDeleted logic
		let where: Prisma.UserWhereInput = {}
		
		if (!includeDeleted) {
			// Default: Only show active users (deletedAt is null)
			where.deletedAt = null
		} else if (deleted) {
			// Show only deleted users (deletedAt is not null)
			where.deletedAt = { not: null }
		}
		// If includeDeleted=true and deleted=false, show all users (no deletedAt filter)

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
		const user = await this.prisma.user.findUnique({
			where: { email },
			include: {
				role: true,
				profile: true,
			},
		})

		if (!user || (!includeDeleted && user.deletedAt)) {
			return null
		}

		return this.formatUserResponse(user)
	}

	async create(createUserDto: CreateUserDto): Promise<UserResponseDto> {
		const { password, profile, ...userData } = createUserDto

		// Validate roleId if provided
		if (userData.roleId) {
			const roleExists = await this.prisma.role.findUnique({
				where: { id: userData.roleId }
			})
			if (!roleExists) {
				throw new BadRequestException(`Role with ID ${userData.roleId} does not exist.`)
			}
		}

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
			if (error instanceof Prisma.PrismaClientKnownRequestError &&
				error.code === 'P2003') {
				throw new BadRequestException('Invalid foreign key constraint.')
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
		if (!userIds || userIds.length === 0) {
			throw new BadRequestException('userIds array cannot be empty')
		}

		// Validate all userIds are positive integers
		for (const id of userIds) {
			if (!Number.isInteger(id) || id <= 0) {
				throw new BadRequestException(`Invalid user ID: ${id}. Must be a positive integer.`)
			}
		}

		const result = await this.prisma.user.updateMany({
			where: {
				id: { in: userIds },
				deletedAt: null,
			},
			data: {
				deletedAt: new Date(),
			},
		})

		return { deletedCount: result.count }
	}

	async bulkRestore(userIds: number[]): Promise<{ restoredCount: number }> {
		if (!userIds || userIds.length === 0) {
			throw new BadRequestException('userIds array cannot be empty')
		}

		// Validate all userIds are positive integers
		for (const id of userIds) {
			if (!Number.isInteger(id) || id <= 0) {
				throw new BadRequestException(`Invalid user ID: ${id}. Must be a positive integer.`)
			}
		}

		const result = await this.prisma.user.updateMany({
			where: {
				id: { in: userIds },
				deletedAt: { not: null },
			},
			data: {
				deletedAt: null,
			},
		})

		return { restoredCount: result.count }
	}

	async bulkPermanentDelete(
		userIds: number[],
	): Promise<{ deletedCount: number }> {
		console.log('🔥 BULK PERMANENT DELETE START');
		console.log('🔥 Received userIds:', userIds);
		console.log('🔥 UserIds type:', typeof userIds);
		console.log('🔥 UserIds length:', userIds?.length);
		
		if (!userIds || userIds.length === 0) {
			console.log('❌ Empty userIds array');
			throw new BadRequestException('userIds array cannot be empty')
		}

		// Validate all userIds are positive integers
		for (const id of userIds) {
			console.log(`🔍 Validating ID: ${id} (type: ${typeof id})`);
			if (!Number.isInteger(id) || id <= 0) {
				console.log(`❌ Invalid user ID: ${id}`);
				throw new BadRequestException(`Invalid user ID: ${id}. Must be a positive integer.`)
			}
		}

		console.log('✅ All userIds validated');
		
		try {
			// Check how many users exist before deletion
			const existingUsers = await this.prisma.user.findMany({
				where: { id: { in: userIds } },
				select: { id: true, email: true, deletedAt: true }
			});
			console.log('📊 Users found before deletion:', existingUsers);
			console.log('📊 Users count before deletion:', existingUsers.length);
			
			if (existingUsers.length === 0) {
				console.log('⚠️ No users found with provided IDs');
				return { deletedCount: 0 };
			}
			
			// Use transaction to ensure atomic deletion
			const result = await this.prisma.$transaction(async (tx) => {
				console.log('🔄 Starting transaction for user deletion');
				
				// Delete related data manually if needed (optional, as most have CASCADE)
				// This is for safety in case some constraints don't cascade properly
				
				// Delete user profiles (should cascade automatically, but being explicit)
				const profilesDeleted = await tx.userProfile.deleteMany({
					where: { userId: { in: userIds } }
				});
				console.log('🗑️ Deleted user profiles:', profilesDeleted.count);
				
				// Delete user sessions (should cascade automatically)
				const sessionsDeleted = await tx.userSession.deleteMany({
					where: { userId: { in: userIds } }
				});
				console.log('🗑️ Deleted user sessions:', sessionsDeleted.count);
				
				// Delete accounts (should cascade automatically)
				const accountsDeleted = await tx.account.deleteMany({
					where: { userId: { in: userIds } }
				});
				console.log('🗑️ Deleted accounts:', accountsDeleted.count);
				
				// Delete NextAuth sessions (should cascade automatically)
				const nextAuthSessionsDeleted = await tx.session.deleteMany({
					where: { userId: { in: userIds } }
				});
				console.log('🗑️ Deleted NextAuth sessions:', nextAuthSessionsDeleted.count);
				
				// Now delete users
				const usersDeleted = await tx.user.deleteMany({
					where: { id: { in: userIds } },
				});
				console.log('🗑️ Deleted users:', usersDeleted.count);
				
				return usersDeleted;
			});
			
			console.log('🗑️ Transaction completed, result:', result);
			console.log('🗑️ Deleted count:', result.count);
			
			// Verify deletion by checking if users still exist
			const remainingUsers = await this.prisma.user.findMany({
				where: { id: { in: userIds } },
				select: { id: true, email: true }
			});
			console.log('🔍 Users remaining after deletion:', remainingUsers);
			console.log('🔍 Remaining count:', remainingUsers.length);
			
			if (remainingUsers.length > 0) {
				console.log('⚠️ WARNING: Some users were not deleted!');
				console.log('⚠️ Remaining user IDs:', remainingUsers.map(u => u.id));
			} else {
				console.log('✅ All users successfully deleted');
			}
			
			console.log('✅ BULK PERMANENT DELETE COMPLETE');
			return { deletedCount: result.count };
		} catch (error) {
			console.error('💥 BULK PERMANENT DELETE ERROR:', error);
			console.error('💥 Error details:', {
				message: error.message,
				code: error.code,
				meta: error.meta
			});
			throw error;
		}
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
