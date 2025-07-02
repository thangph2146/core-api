import { PrismaClient, Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { faker } from '@faker-js/faker';
import { PERMISSIONS } from '../src/common/constants/permissions.constants';

const prisma = new PrismaClient();

async function main() {
	console.log('🗑️  Xóa tất cả dữ liệu cũ...');
	
	// Xóa dữ liệu theo thứ tự để tránh lỗi foreign key
	await prisma.blogComment.deleteMany();
	await prisma.blogBookmark.deleteMany();
	await prisma.blogLike.deleteMany();
	await prisma.blog.deleteMany();
	await prisma.jobApplication.deleteMany();
	await prisma.recruitment.deleteMany();
	await prisma.contactSubmission.deleteMany();
	await prisma.newsletterSubscription.deleteMany();
	await prisma.service.deleteMany();
	await prisma.media.deleteMany();
	await prisma.userProfile.deleteMany();
	await prisma.userSession.deleteMany();
	await prisma.session.deleteMany();
	await prisma.account.deleteMany();
	await prisma.user.deleteMany();
	await prisma.role.deleteMany();
	await prisma.permission.deleteMany();
	await prisma.tag.deleteMany();
	await prisma.status.deleteMany();
	await prisma.category.deleteMany();

	console.log('✅ Đã xóa tất cả dữ liệu cũ');

	console.log('📊 Tạo Statuses...');
	const statusesToCreate = [
		// Blog Statuses
		{ name: 'Published', description: 'Bài viết đã được xuất bản.', type: 'BLOG' },
		{ name: 'Draft', description: 'Bài viết là bản nháp.', type: 'BLOG' },
		{ name: 'Archived', description: 'Bài viết đã được lưu trữ.', type: 'BLOG' },
		// Recruitment Statuses
		{ name: 'Open', description: 'Tin tuyển dụng đang mở.', type: 'RECRUITMENT' },
		{ name: 'Closed', description: 'Tin tuyển dụng đã đóng.', type: 'RECRUITMENT' },
		// General Statuses
		{ name: 'Active', description: 'Đối tượng đang hoạt động.', type: 'GENERAL' },
		{ name: 'Inactive', description: 'Đối tượng không hoạt động.', type: 'GENERAL' },
		{ name: 'Pending', description: 'Đối tượng đang chờ xử lý.', type: 'GENERAL' },
	];

	await prisma.status.createMany({
		data: statusesToCreate,
		skipDuplicates: true,
	});
	console.log(`✅ Đã tạo ${statusesToCreate.length} statuses.`);

	console.log('🔑 Tạo Permissions...');

	// Generate permissions from the constants file to ensure consistency
	const permissionsToCreate = Object.values(PERMISSIONS)
		.flatMap(group => Object.values(group))
		.map(permissionName => {
			const [resource, action] = (permissionName as string).split(':');
			const resourceTitle = resource
				.replace(/_/g, ' ')
				.replace(/\b\w/g, l => l.toUpperCase());
			const actionTitle = action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

			let description = `Quyền ${actionTitle.toLowerCase()} ${resourceTitle.toLowerCase()}`;
			if (action === 'full_access') {
				description = `Quyền quản lý toàn bộ ${resourceTitle.toLowerCase()}`;
			}

			return {
				name: permissionName as string,
				description: description,
				metaTitle: `Quyền ${actionTitle} ${resourceTitle}`,
			};
		});

	const permissions = await prisma.permission.createMany({
		data: permissionsToCreate,
		skipDuplicates: true,
	});

	console.log(`✅ Đã tạo ${permissions.count} permissions`);
	console.log('👑 Tạo Roles...');

	// Create Super Admin Role
	const superAdminRole = await prisma.role.create({
		data: {
			name: 'Super Admin',
			description: 'Quản trị viên cấp cao nhất với toàn quyền hệ thống.',
			permissions: {
				connect: [{ name: PERMISSIONS.ADMIN.FULL_ACCESS }],
			},
		},
	});

	// Create Admin Role
	const adminRole = await prisma.role.create({
		data: {
			name: 'Admin',
			description: 'Quản trị viên hệ thống với quyền quản lý cao.',
			permissions: {
				connect: [
					{ name: PERMISSIONS.USERS.FULL_ACCESS },
					{ name: PERMISSIONS.ROLES.FULL_ACCESS },
					{ name: PERMISSIONS.BLOGS.FULL_ACCESS },
					{ name: PERMISSIONS.CONTENT_TYPES.FULL_ACCESS },
					{ name: PERMISSIONS.MEDIA.FULL_ACCESS },
					{ name: PERMISSIONS.RECRUITMENT.FULL_ACCESS },
					{ name: PERMISSIONS.SETTINGS.FULL_ACCESS },
				],
			},
		},
	});

	// Create Editor Role
	const editorRole = await prisma.role.create({
		data: {
			name: 'Editor',
			description: 'Biên tập viên quản lý nội dung.',
			permissions: {
				connect: [
					{ name: PERMISSIONS.BLOGS.CREATE },
					{ name: PERMISSIONS.BLOGS.READ },
					{ name: PERMISSIONS.BLOGS.UPDATE },
					{ name: PERMISSIONS.BLOGS.DELETE },
					{ name: PERMISSIONS.CONTENT_TYPES.CREATE },
					{ name: PERMISSIONS.CONTENT_TYPES.READ },
					{ name: PERMISSIONS.MEDIA.CREATE },
					{ name: PERMISSIONS.MEDIA.READ },
					{ name: PERMISSIONS.MEDIA.UPDATE },
					{ name: PERMISSIONS.MEDIA.DELETE },
				],
			},
		},
	});

	// Create HR Manager Role
	const hrManagerRole = await prisma.role.create({
		data: {
			name: 'HR Manager',
			description: 'Quản lý nhân sự chuyên về tuyển dụng.',
			permissions: {
				connect: [
					{ name: PERMISSIONS.RECRUITMENT.FULL_ACCESS },
					{ name: PERMISSIONS.USERS.READ }, // To view candidate profiles
				],
			},
		},
	});

	// Create Client Role
	const clientRole = await prisma.role.create({
		data: {
			name: 'Client',
			description: 'Người dùng cuối có quyền tương tác với các tính năng công khai.',
			permissions: {
				connect: [
					{ name: PERMISSIONS.BLOGS.READ },
					{ name: PERMISSIONS.BLOGS.LIKE },
					{ name: PERMISSIONS.BLOGS.BOOKMARK },
					{ name: PERMISSIONS.COMMENTS.CREATE },
					{ name: PERMISSIONS.COMMENTS.READ },
					{ name: PERMISSIONS.COMMENTS.UPDATE },
					{ name: PERMISSIONS.COMMENTS.DELETE },
					{ name: PERMISSIONS.RECRUITMENT.APPLY },
				],
			},
		},
	});

	console.log(`✅ Đã tạo 5 roles: Super Admin, Admin, Editor, HR Manager, Client`);

	console.log('👤 Tạo User chính...');

	// Hash password for main user
	const hashedPassword = await bcrypt.hash('RachelCu.26112020', 10);

	// Create main user
	const mainUser = await prisma.user.create({
		data: {
			email: 'thang.ph2146@gmail.com',
			name: 'Phạm Hoàng Thắng',
			hashedPassword: hashedPassword,
			emailVerified: new Date(),
			roleId: superAdminRole.id,
			profile: {
				create: {
					bio: 'Quản trị viên hệ thống và nhà phát triển full-stack.',
					socialLinks: {
						github: 'https://github.com/thangph',
						linkedin: 'https://linkedin.com/in/thangph',
						facebook: 'https://facebook.com/thangph2146',
					},
				},
			},
		},
	});

	console.log(`✅ Đã tạo user chính: ${mainUser.email}`);

	console.log('👤 Tạo 20 user test...');
	const testUsers: Prisma.UserCreateArgs[] = [];
	const testPassword = await bcrypt.hash('password123', 10);

	// Use the 'editorRole' created earlier, no need to query again.
	if (!editorRole) {
		console.error('❌ Không tìm thấy vai trò "Editor". Bỏ qua việc tạo người dùng thử nghiệm.');
	} else {
		for (let i = 0; i < 20; i++) {
			const firstName = faker.person.firstName();
			const lastName = faker.person.lastName();
			const email = faker.internet.email({ firstName, lastName, provider: 'phgroup.dev' });

			testUsers.push({
				data: {
					email: email,
					name: `${firstName} ${lastName}`,
					hashedPassword: testPassword,
					emailVerified: new Date(),
					roleId: clientRole.id, // Assign client role to test users
					profile: {
						create: {
							bio: faker.person.bio(),
						},
					},
				},
			});
		}
		
		for (const userData of testUsers) {
			await prisma.user.create(userData);
		}

		console.log('✅ Đã tạo 20 user test.');
	}

	console.log('🌟 Hoàn thành seed database!');
	console.log('\n📋 Tóm tắt dữ liệu đã tạo:');
	console.log(`- ${permissions.count} Permissions`);
	console.log(`- 5 Roles (Super Admin, Admin, Editor, HR Manager, Client)`);
	console.log(`- 21 Users (1 Super Admin + 20 Test Users)`);
	console.log('\n🔑 Thông tin đăng nhập:');
	console.log('🎯 SUPER ADMIN:');
	console.log('  📧 Email: thang.ph2146@gmail.com');
	console.log('  🔒 Password: RachelCu.26112020');
	console.log('\n🎯 TEST USERS:');
	console.log('  📧 Email: testuser1@phgroup.com - testuser20@phgroup.com');
	console.log('  🔒 Password: password123');
}

main()
	.catch(e => {
		console.error('❌ Lỗi khi seed database:', e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
