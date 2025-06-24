import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
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
			const [resource, action] = permissionName.split(':');
			const resourceTitle = resource
				.replace(/_/g, ' ')
				.replace(/\b\w/g, l => l.toUpperCase());
			const actionTitle = action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

			let description = `Quyền ${actionTitle.toLowerCase()} ${resourceTitle.toLowerCase()}`;
			if (action === 'full_access') {
				description = `Quyền quản lý toàn bộ ${resourceTitle.toLowerCase()}`;
			}

			return {
				name: permissionName,
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

	console.log(`✅ Đã tạo 4 roles: Super Admin, Admin, Editor, HR Manager`);

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

	console.log('🌟 Hoàn thành seed database!');
	console.log('\n📋 Tóm tắt dữ liệu đã tạo:');
	console.log(`- ${permissions.count} Permissions`);
	console.log(`- 4 Roles (Super Admin, Admin, Editor, HR Manager)`);
	console.log(`- 1 User (Super Admin)`);
	console.log('\n🔑 Thông tin đăng nhập:');
	console.log('🎯 SUPER ADMIN:');
	console.log('  📧 Email: thang.ph2146@gmail.com');
	console.log('  🔒 Password: RachelCu.26112020');
}

main()
	.catch(e => {
		console.error('❌ Lỗi khi seed database:', e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
