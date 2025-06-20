import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

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

  console.log('🔑 Tạo Permissions...');
  
  // Tạo permissions dựa trên schema
  const permissions = await Promise.all([
    // User Management
    prisma.permission.create({
      data: {
        name: 'user:create',
        description: 'Tạo người dùng mới',
        metaTitle: 'Quyền tạo người dùng',
        metaDescription: 'Cho phép tạo tài khoản người dùng mới trong hệ thống'
      }
    }),
    prisma.permission.create({
      data: {
        name: 'user:read',
        description: 'Xem thông tin người dùng',
        metaTitle: 'Quyền xem người dùng',
        metaDescription: 'Cho phép xem danh sách và thông tin chi tiết người dùng'
      }
    }),
    prisma.permission.create({
      data: {
        name: 'user:update',
        description: 'Cập nhật thông tin người dùng',
        metaTitle: 'Quyền chỉnh sửa người dùng',
        metaDescription: 'Cho phép chỉnh sửa thông tin cá nhân và cài đặt người dùng'
      }
    }),
    prisma.permission.create({
      data: {
        name: 'user:delete',
        description: 'Xóa người dùng',
        metaTitle: 'Quyền xóa người dùng',
        metaDescription: 'Cho phép xóa tài khoản người dùng khỏi hệ thống'
      }
    }),

    // Role Management
    prisma.permission.create({
      data: {
        name: 'role:create',
        description: 'Tạo vai trò mới',
        metaTitle: 'Quyền tạo vai trò',
        metaDescription: 'Cho phép tạo các vai trò và phân quyền mới'
      }
    }),
    prisma.permission.create({
      data: {
        name: 'role:read',
        description: 'Xem thông tin vai trò',
        metaTitle: 'Quyền xem vai trò',
        metaDescription: 'Cho phép xem danh sách vai trò và quyền hạn'
      }
    }),
    prisma.permission.create({
      data: {
        name: 'role:update',
        description: 'Cập nhật vai trò',
        metaTitle: 'Quyền chỉnh sửa vai trò',
        metaDescription: 'Cho phép chỉnh sửa thông tin và quyền hạn của vai trò'
      }
    }),
    prisma.permission.create({
      data: {
        name: 'role:delete',
        description: 'Xóa vai trò',
        metaTitle: 'Quyền xóa vai trò',
        metaDescription: 'Cho phép xóa vai trò khỏi hệ thống'
      }
    }),

    // Blog Management
    prisma.permission.create({
      data: {
        name: 'blog:create',
        description: 'Tạo bài viết blog',
        metaTitle: 'Quyền tạo blog',
        metaDescription: 'Cho phép tạo và viết bài blog mới'
      }
    }),
    prisma.permission.create({
      data: {
        name: 'blog:read',
        description: 'Xem bài viết blog',
        metaTitle: 'Quyền xem blog',
        metaDescription: 'Cho phép xem danh sách và nội dung bài blog'
      }
    }),
    prisma.permission.create({
      data: {
        name: 'blog:update',
        description: 'Cập nhật bài viết blog',
        metaTitle: 'Quyền chỉnh sửa blog',
        metaDescription: 'Cho phép chỉnh sửa nội dung và thông tin bài blog'
      }
    }),
    prisma.permission.create({
      data: {
        name: 'blog:delete',
        description: 'Xóa bài viết blog',
        metaTitle: 'Quyền xóa blog',
        metaDescription: 'Cho phép xóa bài viết blog khỏi hệ thống'
      }
    }),
    prisma.permission.create({
      data: {
        name: 'blog:publish',
        description: 'Xuất bản bài viết blog',
        metaTitle: 'Quyền xuất bản blog',
        metaDescription: 'Cho phép xuất bản và hủy xuất bản bài blog'
      }
    }),

    // Category Management
    prisma.permission.create({
      data: {
        name: 'category:create',
        description: 'Tạo danh mục',
        metaTitle: 'Quyền tạo danh mục',
        metaDescription: 'Cho phép tạo danh mục mới cho blog và dịch vụ'
      }
    }),
    prisma.permission.create({
      data: {
        name: 'category:read',
        description: 'Xem danh mục',
        metaTitle: 'Quyền xem danh mục',
        metaDescription: 'Cho phép xem danh sách và chi tiết danh mục'
      }
    }),
    prisma.permission.create({
      data: {
        name: 'category:update',
        description: 'Cập nhật danh mục',
        metaTitle: 'Quyền chỉnh sửa danh mục',
        metaDescription: 'Cho phép chỉnh sửa thông tin và cấu trúc danh mục'
      }
    }),
    prisma.permission.create({
      data: {
        name: 'category:delete',
        description: 'Xóa danh mục',
        metaTitle: 'Quyền xóa danh mục',
        metaDescription: 'Cho phép xóa danh mục khỏi hệ thống'
      }
    }),

    // Tag Management
    prisma.permission.create({
      data: {
        name: 'tag:create',
        description: 'Tạo thẻ tag',
        metaTitle: 'Quyền tạo tag',
        metaDescription: 'Cho phép tạo thẻ tag mới cho bài viết'
      }
    }),
    prisma.permission.create({
      data: {
        name: 'tag:read',
        description: 'Xem thẻ tag',
        metaTitle: 'Quyền xem tag',
        metaDescription: 'Cho phép xem danh sách và thông tin thẻ tag'
      }
    }),
    prisma.permission.create({
      data: {
        name: 'tag:update',
        description: 'Cập nhật thẻ tag',
        metaTitle: 'Quyền chỉnh sửa tag',
        metaDescription: 'Cho phép chỉnh sửa thông tin thẻ tag'
      }
    }),
    prisma.permission.create({
      data: {
        name: 'tag:delete',
        description: 'Xóa thẻ tag',
        metaTitle: 'Quyền xóa tag',
        metaDescription: 'Cho phép xóa thẻ tag khỏi hệ thống'
      }
    }),

    // Service Management
    prisma.permission.create({
      data: {
        name: 'service:create',
        description: 'Tạo dịch vụ',
        metaTitle: 'Quyền tạo dịch vụ',
        metaDescription: 'Cho phép tạo dịch vụ mới'
      }
    }),
    prisma.permission.create({
      data: {
        name: 'service:read',
        description: 'Xem dịch vụ',
        metaTitle: 'Quyền xem dịch vụ',
        metaDescription: 'Cho phép xem danh sách và chi tiết dịch vụ'
      }
    }),
    prisma.permission.create({
      data: {
        name: 'service:update',
        description: 'Cập nhật dịch vụ',
        metaTitle: 'Quyền chỉnh sửa dịch vụ',
        metaDescription: 'Cho phép chỉnh sửa thông tin dịch vụ'
      }
    }),
    prisma.permission.create({
      data: {
        name: 'service:delete',
        description: 'Xóa dịch vụ',
        metaTitle: 'Quyền xóa dịch vụ',
        metaDescription: 'Cho phép xóa dịch vụ khỏi hệ thống'
      }
    }),

    // Media Management
    prisma.permission.create({
      data: {
        name: 'media:upload',
        description: 'Tải lên media',
        metaTitle: 'Quyền tải lên media',
        metaDescription: 'Cho phép tải lên hình ảnh và file media'
      }
    }),
    prisma.permission.create({
      data: {
        name: 'media:read',
        description: 'Xem media',
        metaTitle: 'Quyền xem media',
        metaDescription: 'Cho phép xem danh sách và chi tiết file media'
      }
    }),
    prisma.permission.create({
      data: {
        name: 'media:update',
        description: 'Cập nhật media',
        metaTitle: 'Quyền chỉnh sửa media',
        metaDescription: 'Cho phép chỉnh sửa thông tin file media'
      }
    }),
    prisma.permission.create({
      data: {
        name: 'media:delete',
        description: 'Xóa media',
        metaTitle: 'Quyền xóa media',
        metaDescription: 'Cho phép xóa file media khỏi hệ thống'
      }
    }),

    // Contact Management
    prisma.permission.create({
      data: {
        name: 'contact:read',
        description: 'Xem liên hệ',
        metaTitle: 'Quyền xem liên hệ',
        metaDescription: 'Cho phép xem danh sách và chi tiết liên hệ từ khách hàng'
      }
    }),
    prisma.permission.create({
      data: {
        name: 'contact:respond',
        description: 'Phản hồi liên hệ',
        metaTitle: 'Quyền phản hồi liên hệ',
        metaDescription: 'Cho phép phản hồi và xử lý liên hệ từ khách hàng'
      }
    }),

    // Newsletter Management
    prisma.permission.create({
      data: {
        name: 'newsletter:read',
        description: 'Xem newsletter',
        metaTitle: 'Quyền xem newsletter',
        metaDescription: 'Cho phép xem danh sách đăng ký newsletter'
      }
    }),
    prisma.permission.create({
      data: {
        name: 'newsletter:manage',
        description: 'Quản lý newsletter',
        metaTitle: 'Quyền quản lý newsletter',
        metaDescription: 'Cho phép quản lý danh sách và gửi newsletter'
      }
    }),

    // Recruitment Management
    prisma.permission.create({
      data: {
        name: 'recruitment:create',
        description: 'Tạo tin tuyển dụng',
        metaTitle: 'Quyền tạo tin tuyển dụng',
        metaDescription: 'Cho phép tạo bài đăng tuyển dụng mới'
      }
    }),
    prisma.permission.create({
      data: {
        name: 'recruitment:read',
        description: 'Xem tin tuyển dụng',
        metaTitle: 'Quyền xem tin tuyển dụng',
        metaDescription: 'Cho phép xem danh sách và chi tiết tin tuyển dụng'
      }
    }),
    prisma.permission.create({
      data: {
        name: 'recruitment:update',
        description: 'Cập nhật tin tuyển dụng',
        metaTitle: 'Quyền chỉnh sửa tin tuyển dụng',
        metaDescription: 'Cho phép chỉnh sửa thông tin tin tuyển dụng'
      }
    }),
    prisma.permission.create({
      data: {
        name: 'recruitment:delete',
        description: 'Xóa tin tuyển dụng',
        metaTitle: 'Quyền xóa tin tuyển dụng',
        metaDescription: 'Cho phép xóa tin tuyển dụng khỏi hệ thống'
      }
    }),

    // System Admin
    prisma.permission.create({
      data: {
        name: 'system:admin',
        description: 'Quản trị hệ thống',
        metaTitle: 'Quyền quản trị hệ thống',
        metaDescription: 'Quyền cao nhất, có thể truy cập mọi chức năng của hệ thống'
      }
    }),
  ]);

  console.log(`✅ Đã tạo ${permissions.length} permissions`);

  console.log('👑 Tạo Roles...');
  
  // Tạo roles
  const adminRole = await prisma.role.create({
    data: {
      name: 'Administrator',
      description: 'Quản trị viên có toàn quyền quản lý hệ thống',
      metaTitle: 'Vai trò Quản trị viên',
      metaDescription: 'Vai trò có quyền cao nhất trong hệ thống, có thể quản lý tất cả chức năng',
      permissions: {
        connect: permissions.map(p => ({ id: p.id }))
      }
    }
  });

  const editorRole = await prisma.role.create({
    data: {
      name: 'Editor',
      description: 'Biên tập viên quản lý nội dung blog và dịch vụ',
      metaTitle: 'Vai trò Biên tập viên',
      metaDescription: 'Vai trò chuyên quản lý nội dung, blog và dịch vụ của website',
      permissions: {
        connect: permissions.filter(p => 
          p.name.startsWith('blog:') ||
          p.name.startsWith('category:') ||
          p.name.startsWith('tag:') ||
          p.name.startsWith('service:') ||
          p.name.startsWith('media:')
        ).map(p => ({ id: p.id }))
      }
    }
  });

  const moderatorRole = await prisma.role.create({
    data: {
      name: 'Moderator',
      description: 'Người kiểm duyệt nội dung và quản lý liên hệ',
      metaTitle: 'Vai trò Kiểm duyệt viên',
      metaDescription: 'Vai trò kiểm duyệt nội dung và xử lý liên hệ từ người dùng',
      permissions: {
        connect: permissions.filter(p => 
          p.name.includes(':read') ||
          p.name.startsWith('contact:') ||
          p.name.startsWith('newsletter:') ||
          p.name === 'blog:update' ||
          p.name === 'blog:publish'
        ).map(p => ({ id: p.id }))
      }
    }
  });

  const userRole = await prisma.role.create({
    data: {
      name: 'User',
      description: 'Người dùng thông thường',
      metaTitle: 'Vai trò Người dùng',
      metaDescription: 'Vai trò cơ bản cho người dùng đăng ký tài khoản',
      permissions: {
        connect: permissions.filter(p => 
          p.name === 'blog:read' ||
          p.name === 'service:read' ||
          p.name === 'category:read' ||
          p.name === 'tag:read'
        ).map(p => ({ id: p.id }))
      }
    }
  });

  console.log(`✅ Đã tạo 4 roles: Admin, Editor, Moderator, User`);

  console.log('📊 Tạo Status...');
  
  // Tạo status cho các entities
  const statuses = await Promise.all([
    // Blog statuses
    prisma.status.create({
      data: {
        name: 'Draft',
        description: 'Bài viết đang soạn thảo',
        type: 'blog',
        metaTitle: 'Trạng thái Bản nháp',
        metaDescription: 'Bài viết đang được soạn thảo, chưa xuất bản'
      }
    }),
    prisma.status.create({
      data: {
        name: 'Published',
        description: 'Bài viết đã xuất bản',
        type: 'blog',
        metaTitle: 'Trạng thái Đã xuất bản',
        metaDescription: 'Bài viết đã được xuất bản và hiển thị công khai'
      }
    }),
    prisma.status.create({
      data: {
        name: 'Archived',
        description: 'Bài viết đã lưu trữ',
        type: 'blog',
        metaTitle: 'Trạng thái Lưu trữ',
        metaDescription: 'Bài viết đã được lưu trữ, không hiển thị công khai'
      }
    }),

    // Service statuses
    prisma.status.create({
      data: {
        name: 'Active',
        description: 'Dịch vụ đang hoạt động',
        type: 'service',
        metaTitle: 'Trạng thái Hoạt động',
        metaDescription: 'Dịch vụ đang được cung cấp'
      }
    }),
    prisma.status.create({
      data: {
        name: 'Inactive',
        description: 'Dịch vụ tạm ngưng',
        type: 'service',
        metaTitle: 'Trạng thái Tạm ngưng',
        metaDescription: 'Dịch vụ tạm thời ngưng cung cấp'
      }
    }),

    // Contact statuses
    prisma.status.create({
      data: {
        name: 'New',
        description: 'Liên hệ mới',
        type: 'contact',
        metaTitle: 'Trạng thái Mới',
        metaDescription: 'Liên hệ mới chưa được xử lý'
      }
    }),
    prisma.status.create({
      data: {
        name: 'In Progress',
        description: 'Đang xử lý',
        type: 'contact',
        metaTitle: 'Trạng thái Đang xử lý',
        metaDescription: 'Liên hệ đang được xử lý'
      }
    }),
    prisma.status.create({
      data: {
        name: 'Resolved',
        description: 'Đã giải quyết',
        type: 'contact',
        metaTitle: 'Trạng thái Đã giải quyết',
        metaDescription: 'Liên hệ đã được giải quyết xong'
      }
    }),

    // Recruitment statuses
    prisma.status.create({
      data: {
        name: 'Open',
        description: 'Đang tuyển dụng',
        type: 'recruitment',
        metaTitle: 'Trạng thái Đang tuyển',
        metaDescription: 'Vị trí đang mở để tuyển dụng'
      }
    }),
    prisma.status.create({
      data: {
        name: 'Closed',
        description: 'Đã đóng tuyển dụng',
        type: 'recruitment',
        metaTitle: 'Trạng thái Đã đóng',
        metaDescription: 'Vị trí đã đóng, không nhận ứng viên'
      }
    }),

    // Job Application statuses
    prisma.status.create({
      data: {
        name: 'Applied',
        description: 'Đã ứng tuyển',
        type: 'application',
        metaTitle: 'Trạng thái Đã ứng tuyển',
        metaDescription: 'Hồ sơ đã được nộp'
      }
    }),
    prisma.status.create({
      data: {
        name: 'Under Review',
        description: 'Đang xem xét',
        type: 'application',
        metaTitle: 'Trạng thái Đang xem xét',
        metaDescription: 'Hồ sơ đang được xem xét'
      }
    }),
    prisma.status.create({
      data: {
        name: 'Accepted',
        description: 'Được chấp nhận',
        type: 'application',
        metaTitle: 'Trạng thái Được chấp nhận',
        metaDescription: 'Hồ sơ được chấp nhận'
      }
    }),
    prisma.status.create({
      data: {
        name: 'Rejected',
        description: 'Bị từ chối',
        type: 'application',
        metaTitle: 'Trạng thái Bị từ chối',
        metaDescription: 'Hồ sơ bị từ chối'
      }
    }),
  ]);

  console.log(`✅ Đã tạo ${statuses.length} statuses`);

  console.log('📂 Tạo Categories...');
  
  // Tạo categories
  const categories = await Promise.all([
    // Blog categories
    prisma.category.create({
      data: {
        name: 'Công nghệ',
        slug: 'cong-nghe',
        description: 'Các bài viết về công nghệ, lập trình, AI',
        type: 'blog',
        metaTitle: 'Danh mục Công nghệ',
        metaDescription: 'Tổng hợp các bài viết về công nghệ mới, lập trình và trí tuệ nhân tạo'
      }
    }),
    prisma.category.create({
      data: {
        name: 'Kinh doanh',
        slug: 'kinh-doanh',
        description: 'Các bài viết về kinh doanh, khởi nghiệp, marketing',
        type: 'blog',
        metaTitle: 'Danh mục Kinh doanh',
        metaDescription: 'Chia sẻ kinh nghiệm kinh doanh, khởi nghiệp và chiến lược marketing'
      }
    }),
    prisma.category.create({
      data: {
        name: 'Đời sống',
        slug: 'doi-song',
        description: 'Các bài viết về cuộc sống, sức khỏe, du lịch',
        type: 'blog',
        metaTitle: 'Danh mục Đời sống',
        metaDescription: 'Những câu chuyện về cuộc sống, mẹo sức khỏe và trải nghiệm du lịch'
      }
    }),

    // Service categories
    prisma.category.create({
      data: {
        name: 'Phát triển Web',
        slug: 'phat-trien-web',
        description: 'Dịch vụ thiết kế và phát triển website',
        type: 'service',
        metaTitle: 'Dịch vụ Phát triển Web',
        metaDescription: 'Cung cấp dịch vụ thiết kế, phát triển website chuyên nghiệp'
      }
    }),
    prisma.category.create({
      data: {
        name: 'Ứng dụng Mobile',
        slug: 'ung-dung-mobile',
        description: 'Dịch vụ phát triển ứng dụng di động',
        type: 'service',
        metaTitle: 'Dịch vụ Ứng dụng Mobile',
        metaDescription: 'Phát triển ứng dụng iOS, Android chuyên nghiệp'
      }
    }),
    prisma.category.create({
      data: {
        name: 'Tư vấn IT',
        slug: 'tu-van-it',
        description: 'Dịch vụ tư vấn công nghệ thông tin',
        type: 'service',
        metaTitle: 'Dịch vụ Tư vấn IT',
        metaDescription: 'Tư vấn giải pháp công nghệ thông tin cho doanh nghiệp'
      }
    }),

    // Recruitment categories
    prisma.category.create({
      data: {
        name: 'IT - Phần mềm',
        slug: 'it-phan-mem',
        description: 'Vị trí tuyển dụng trong lĩnh vực IT và phần mềm',
        type: 'recruitment',
        metaTitle: 'Tuyển dụng IT - Phần mềm',
        metaDescription: 'Các vị trí việc làm trong lĩnh vực công nghệ thông tin và phần mềm'
      }
    }),
    prisma.category.create({
      data: {
        name: 'Marketing - Sales',
        slug: 'marketing-sales',
        description: 'Vị trí tuyển dụng Marketing và Bán hàng',
        type: 'recruitment',
        metaTitle: 'Tuyển dụng Marketing - Sales',
        metaDescription: 'Cơ hội nghề nghiệp trong lĩnh vực marketing và bán hàng'
      }
    }),
    prisma.category.create({
      data: {
        name: 'Thiết kế - Sáng tạo',
        slug: 'thiet-ke-sang-tao',
        description: 'Vị trí tuyển dụng Thiết kế và Sáng tạo',
        type: 'recruitment',
        metaTitle: 'Tuyển dụng Thiết kế - Sáng tạo',
        metaDescription: 'Việc làm dành cho các nhà thiết kế và người sáng tạo'
      }
    }),
  ]);

  console.log(`✅ Đã tạo ${categories.length} categories`);

  console.log('🏷️ Tạo Tags...');
  
  // Tạo tags
  const tags = await Promise.all([
    prisma.tag.create({
      data: {
        name: 'JavaScript',
        slug: 'javascript',
        metaTitle: 'Tag JavaScript',
        metaDescription: 'Bài viết về ngôn ngữ lập trình JavaScript'
      }
    }),
    prisma.tag.create({
      data: {
        name: 'React',
        slug: 'react',
        metaTitle: 'Tag React',
        metaDescription: 'Thư viện React cho phát triển giao diện người dùng'
      }
    }),
    prisma.tag.create({
      data: {
        name: 'Node.js',
        slug: 'nodejs',
        metaTitle: 'Tag Node.js',
        metaDescription: 'Nền tảng Node.js cho phát triển backend'
      }
    }),
    prisma.tag.create({
      data: {
        name: 'TypeScript',
        slug: 'typescript',
        metaTitle: 'Tag TypeScript',
        metaDescription: 'Ngôn ngữ TypeScript mở rộng từ JavaScript'
      }
    }),
    prisma.tag.create({
      data: {
        name: 'AI',
        slug: 'ai',
        metaTitle: 'Tag AI',
        metaDescription: 'Trí tuệ nhân tạo và machine learning'
      }
    }),
    prisma.tag.create({
      data: {
        name: 'Startup',
        slug: 'startup',
        metaTitle: 'Tag Startup',
        metaDescription: 'Khởi nghiệp và xây dựng doanh nghiệp'
      }
    }),
    prisma.tag.create({
      data: {
        name: 'Marketing',
        slug: 'marketing',
        metaTitle: 'Tag Marketing',
        metaDescription: 'Chiến lược và kỹ thuật marketing'
      }
    }),
    prisma.tag.create({
      data: {
        name: 'Design',
        slug: 'design',
        metaTitle: 'Tag Design',
        metaDescription: 'Thiết kế UI/UX và đồ họa'
      }
    }),
  ]);

  console.log(`✅ Đã tạo ${tags.length} tags`);

  console.log('👤 Tạo User chính...');
  
  // Hash password cho user chính
  const hashedPassword = await bcrypt.hash('RachelCu.26112020', 10);
  
  // Tạo user chính
  const mainUser = await prisma.user.create({
    data: {
      email: 'thang.ph2146@gmail.com',
      name: 'Phạm Hoàng Thắng',
      hashedPassword: hashedPassword,
      emailVerified: new Date(),
      roleId: adminRole.id,
      metaTitle: 'Quản trị viên chính',
      metaDescription: 'Tài khoản quản trị viên chính của hệ thống',
      avatarUrl: 'https://ui-avatars.com/api/?name=Pham+Hoang+Thang&background=6366f1&color=ffffff&size=200',
      profile: {
        create: {
          bio: 'Quản trị viên hệ thống và nhà phát triển full-stack với hơn 5 năm kinh nghiệm trong lĩnh vực công nghệ.',
          avatarUrl: 'https://ui-avatars.com/api/?name=Pham+Hoang+Thang&background=6366f1&color=ffffff&size=200',
          socialLinks: {
            github: 'https://github.com/thangph',
            linkedin: 'https://linkedin.com/in/thangph',
            facebook: 'https://facebook.com/thangph2146'
          },
          metaTitle: 'Profile Phạm Hoàng Thắng',
          metaDescription: 'Thông tin cá nhân của quản trị viên hệ thống'
        }
      }
    }
  });

  console.log(`✅ Đã tạo user chính: ${mainUser.email}`);

  console.log('👥 Tạo một số User mẫu...');
  
  // Tạo một số user mẫu
  const sampleUsers = await Promise.all([
    prisma.user.create({
      data: {
        email: 'editor@example.com',
        name: 'Nguyễn Văn Biên',
        hashedPassword: await bcrypt.hash('editor123', 10),
        emailVerified: new Date(),
        roleId: editorRole.id,
        avatarUrl: 'https://ui-avatars.com/api/?name=Nguyen+Van+Bien&background=10b981&color=ffffff&size=200',
        profile: {
          create: {
            bio: 'Biên tập viên chuyên về nội dung công nghệ và kinh doanh.',
            avatarUrl: 'https://ui-avatars.com/api/?name=Nguyen+Van+Bien&background=10b981&color=ffffff&size=200',
            socialLinks: {
              twitter: 'https://twitter.com/nguyenvanbien',
              linkedin: 'https://linkedin.com/in/nguyenvanbien'
            }
          }
        }
      }
    }),
    prisma.user.create({
      data: {
        email: 'moderator@example.com',
        name: 'Trần Thị Kiểm',
        hashedPassword: await bcrypt.hash('moderator123', 10),
        emailVerified: new Date(),
        roleId: moderatorRole.id,
        avatarUrl: 'https://ui-avatars.com/api/?name=Tran+Thi+Kiem&background=f59e0b&color=ffffff&size=200',
        profile: {
          create: {
            bio: 'Kiểm duyệt viên nội dung và quản lý cộng đồng.',
            avatarUrl: 'https://ui-avatars.com/api/?name=Tran+Thi+Kiem&background=f59e0b&color=ffffff&size=200'
          }
        }
      }
    }),
    prisma.user.create({
      data: {
        email: 'user@example.com',
        name: 'Lê Văn Dùng',
        hashedPassword: await bcrypt.hash('user123', 10),
        emailVerified: new Date(),
        roleId: userRole.id,
        avatarUrl: 'https://ui-avatars.com/api/?name=Le+Van+Dung&background=8b5cf6&color=ffffff&size=200',
        profile: {
          create: {
            bio: 'Người dùng thông thường quan tâm đến công nghệ.',
            avatarUrl: 'https://ui-avatars.com/api/?name=Le+Van+Dung&background=8b5cf6&color=ffffff&size=200'
          }
        }
      }
    }),
  ]);

  console.log(`✅ Đã tạo ${sampleUsers.length} user mẫu`);

  console.log('🌟 Hoàn thành seed database!');
  console.log('\n📋 Tóm tắt dữ liệu đã tạo:');
  console.log(`- ${permissions.length} Permissions`);
  console.log(`- 4 Roles (Admin, Editor, Moderator, User)`);
  console.log(`- ${statuses.length} Statuses`);
  console.log(`- ${categories.length} Categories`);
  console.log(`- ${tags.length} Tags`);
  console.log(`- ${sampleUsers.length + 1} Users`);
  console.log('\n🔑 Thông tin đăng nhập:');
  console.log('📧 Email: thang.ph2146@gmail.com');
  console.log('🔒 Password: RachelCu.26112020');
  console.log('👑 Role: Administrator');
}

main()
  .catch((e) => {
    console.error('❌ Lỗi khi seed database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
