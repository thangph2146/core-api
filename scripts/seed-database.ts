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
  
  // Tạo permissions dựa trên schema và API endpoints
  const permissions = await Promise.all([
    // ========== SYSTEM ADMIN PERMISSIONS ==========
    prisma.permission.create({
      data: {
        name: 'admin:full_access',
        description: 'Quyền quản trị toàn bộ hệ thống',
        metaTitle: 'Quyền quản trị toàn bộ',
        metaDescription: 'Quyền cao nhất, có thể truy cập mọi chức năng của hệ thống'
      }
    }),
    prisma.permission.create({
      data: {
        name: 'admin:system_settings',
        description: 'Quản lý cài đặt hệ thống',
        metaTitle: 'Quyền cài đặt hệ thống',
        metaDescription: 'Cho phép thay đổi cài đặt cấu hình hệ thống'
      }
    }),
    prisma.permission.create({
      data: {
        name: 'admin:view_logs',
        description: 'Xem logs hệ thống',
        metaTitle: 'Quyền xem logs',
        metaDescription: 'Cho phép xem nhật ký hoạt động của hệ thống'
      }
    }),
    prisma.permission.create({
      data: {
        name: 'admin:manage_sessions',
        description: 'Quản lý phiên đăng nhập',
        metaTitle: 'Quyền quản lý sessions',
        metaDescription: 'Cho phép quản lý và kiểm soát phiên đăng nhập người dùng'
      }
    }),
    prisma.permission.create({
      data: {
        name: 'admin:maintenance_mode',
        description: 'Bật/tắt chế độ bảo trì',
        metaTitle: 'Quyền chế độ bảo trì',
        metaDescription: 'Cho phép bật/tắt chế độ bảo trì hệ thống'
      }
    }),

    // ========== USER MANAGEMENT PERMISSIONS ==========
    prisma.permission.create({
      data: {
        name: 'users:create',
        description: 'Tạo người dùng mới',
        metaTitle: 'Quyền tạo người dùng',
        metaDescription: 'Cho phép tạo tài khoản người dùng mới trong hệ thống'
      }
    }),
    prisma.permission.create({
      data: {
        name: 'users:read',
        description: 'Xem thông tin người dùng',
        metaTitle: 'Quyền xem người dùng',
        metaDescription: 'Cho phép xem danh sách và thông tin chi tiết người dùng'
      }
    }),
    prisma.permission.create({
      data: {
        name: 'users:update',
        description: 'Cập nhật thông tin người dùng',
        metaTitle: 'Quyền chỉnh sửa người dùng',
        metaDescription: 'Cho phép chỉnh sửa thông tin cá nhân và cài đặt người dùng'
      }
    }),
    prisma.permission.create({
      data: {
        name: 'users:delete',
        description: 'Xóa người dùng',
        metaTitle: 'Quyền xóa người dùng',
        metaDescription: 'Cho phép xóa tài khoản người dùng khỏi hệ thống'
      }
    }),
    prisma.permission.create({
      data: {
        name: 'users:manage_all',
        description: 'Quản lý toàn bộ người dùng',
        metaTitle: 'Quyền quản lý toàn bộ người dùng',
        metaDescription: 'Quyền cao nhất trong quản lý người dùng, bao gồm cả admin khác'
      }
    }),
    prisma.permission.create({
      data: {
        name: 'users:view_profile',
        description: 'Xem hồ sơ người dùng',
        metaTitle: 'Quyền xem hồ sơ',
        metaDescription: 'Cho phép xem thông tin hồ sơ của người dùng khác'
      }
    }),
    prisma.permission.create({
      data: {
        name: 'users:update_own_profile',
        description: 'Cập nhật hồ sơ cá nhân',
        metaTitle: 'Quyền cập nhật hồ sơ cá nhân',
        metaDescription: 'Cho phép người dùng cập nhật thông tin hồ sơ của chính mình'
      }
    }),
    prisma.permission.create({
      data: {
        name: 'users:change_password',
        description: 'Đổi mật khẩu',
        metaTitle: 'Quyền đổi mật khẩu',
        metaDescription: 'Cho phép người dùng thay đổi mật khẩu của chính mình'
      }
    }),
    prisma.permission.create({
      data: {
        name: 'users:reset_password',
        description: 'Reset mật khẩu người dùng',
        metaTitle: 'Quyền reset mật khẩu',
        metaDescription: 'Cho phép reset mật khẩu cho người dùng khác'
      }
    }),
    prisma.permission.create({
      data: {
        name: 'users:impersonate',
        description: 'Đăng nhập thay người dùng khác',
        metaTitle: 'Quyền impersonate',
        metaDescription: 'Cho phép đăng nhập với tư cách người dùng khác để debug'
      }
    }),

    // ========== ROLE MANAGEMENT PERMISSIONS ==========
    prisma.permission.create({
      data: {
        name: 'roles:create',
        description: 'Tạo vai trò mới',
        metaTitle: 'Quyền tạo vai trò',
        metaDescription: 'Cho phép tạo các vai trò và phân quyền mới'
      }
    }),
    prisma.permission.create({
      data: {
        name: 'roles:read',
        description: 'Xem thông tin vai trò',
        metaTitle: 'Quyền xem vai trò',
        metaDescription: 'Cho phép xem danh sách vai trò và quyền hạn'
      }
    }),
    prisma.permission.create({
      data: {
        name: 'roles:update',
        description: 'Cập nhật vai trò',
        metaTitle: 'Quyền chỉnh sửa vai trò',
        metaDescription: 'Cho phép chỉnh sửa thông tin và quyền hạn của vai trò'
      }
    }),
    prisma.permission.create({
      data: {
        name: 'roles:delete',
        description: 'Xóa vai trò',
        metaTitle: 'Quyền xóa vai trò',
        metaDescription: 'Cho phép xóa vai trò khỏi hệ thống'
      }
    }),
    prisma.permission.create({
      data: {
        name: 'roles:assign_permissions',
        description: 'Gán quyền cho vai trò',
        metaTitle: 'Quyền gán permissions',
        metaDescription: 'Cho phép gán/bỏ gán quyền hạn cho các vai trò'
      }
    }),
    prisma.permission.create({
      data: {
        name: 'roles:assign_to_users',
        description: 'Gán vai trò cho người dùng',
        metaTitle: 'Quyền gán vai trò',
        metaDescription: 'Cho phép gán vai trò cho người dùng'
      }
    }),

    // ========== PERMISSION MANAGEMENT ==========
    prisma.permission.create({
      data: {
        name: 'permissions:read',
        description: 'Xem danh sách quyền hạn',
        metaTitle: 'Quyền xem permissions',
        metaDescription: 'Cho phép xem tất cả quyền hạn trong hệ thống'
      }
    }),
    prisma.permission.create({
      data: {
        name: 'permissions:manage',
        description: 'Quản lý quyền hạn hệ thống',
        metaTitle: 'Quyền quản lý permissions',
        metaDescription: 'Cho phép tạo, sửa, xóa quyền hạn trong hệ thống'
      }
    }),

    // ========== BLOG MANAGEMENT PERMISSIONS ==========
    prisma.permission.create({
      data: {
        name: 'blogs:create',
        description: 'Tạo bài viết blog',
        metaTitle: 'Quyền tạo blog',
        metaDescription: 'Cho phép tạo và viết bài blog mới'
      }
    }),
    prisma.permission.create({
      data: {
        name: 'blogs:read',
        description: 'Xem bài viết blog',
        metaTitle: 'Quyền xem blog',
        metaDescription: 'Cho phép xem danh sách và nội dung bài blog'
      }
    }),
    prisma.permission.create({
      data: {
        name: 'blogs:update',
        description: 'Cập nhật bài viết blog',
        metaTitle: 'Quyền chỉnh sửa blog',
        metaDescription: 'Cho phép chỉnh sửa nội dung và thông tin bài blog'
      }
    }),
    prisma.permission.create({
      data: {
        name: 'blogs:delete',
        description: 'Xóa bài viết blog',
        metaTitle: 'Quyền xóa blog',
        metaDescription: 'Cho phép xóa bài viết blog khỏi hệ thống'
      }
    }),
    prisma.permission.create({
      data: {
        name: 'blogs:publish',
        description: 'Xuất bản bài viết',
        metaTitle: 'Quyền xuất bản blog',
        metaDescription: 'Cho phép xuất bản bài viết để hiển thị công khai'
      }
    }),
    prisma.permission.create({
      data: {
        name: 'blogs:unpublish',
        description: 'Hủy xuất bản bài viết',
        metaTitle: 'Quyền hủy xuất bản blog',
        metaDescription: 'Cho phép hủy xuất bản bài viết đã được công khai'
      }
    }),
    prisma.permission.create({
      data: {
        name: 'blogs:manage_all',
        description: 'Quản lý toàn bộ blog',
        metaTitle: 'Quyền quản lý toàn bộ blog',
        metaDescription: 'Quyền cao nhất trong quản lý blog, bao gồm cả blog của người khác'
      }
    }),
    prisma.permission.create({
      data: {
        name: 'blogs:moderate',
        description: 'Kiểm duyệt bài viết',
        metaTitle: 'Quyền kiểm duyệt blog',
        metaDescription: 'Cho phép kiểm duyệt và phê duyệt bài viết trước khi xuất bản'
      }
    }),
    prisma.permission.create({
      data: {
        name: 'blogs:view_drafts',
        description: 'Xem bài viết nháp',
        metaTitle: 'Quyền xem bản nháp',
        metaDescription: 'Cho phép xem các bài viết đang ở trạng thái nháp'
      }
    }),
    prisma.permission.create({
      data: {
        name: 'blogs:schedule',
        description: 'Lên lịch xuất bản',
        metaTitle: 'Quyền lên lịch blog',
        metaDescription: 'Cho phép lên lịch tự động xuất bản bài viết'
      }
    }),

    // ========== CATEGORY MANAGEMENT PERMISSIONS ==========
    prisma.permission.create({
      data: {
        name: 'categories:create',
        description: 'Tạo danh mục',
        metaTitle: 'Quyền tạo danh mục',
        metaDescription: 'Cho phép tạo danh mục mới cho blog và dịch vụ'
      }
    }),
    prisma.permission.create({
      data: {
        name: 'categories:read',
        description: 'Xem danh mục',
        metaTitle: 'Quyền xem danh mục',
        metaDescription: 'Cho phép xem danh sách và chi tiết danh mục'
      }
    }),
    prisma.permission.create({
      data: {
        name: 'categories:update',
        description: 'Cập nhật danh mục',
        metaTitle: 'Quyền chỉnh sửa danh mục',
        metaDescription: 'Cho phép chỉnh sửa thông tin và cấu trúc danh mục'
      }
    }),
    prisma.permission.create({
      data: {
        name: 'categories:delete',
        description: 'Xóa danh mục',
        metaTitle: 'Quyền xóa danh mục',
        metaDescription: 'Cho phép xóa danh mục khỏi hệ thống'
      }
    }),
    prisma.permission.create({
      data: {
        name: 'categories:manage_hierarchy',
        description: 'Quản lý cây danh mục',
        metaTitle: 'Quyền quản lý cây danh mục',
        metaDescription: 'Cho phép sắp xếp và quản lý cấu trúc phân cấp danh mục'
      }
    }),

    // ========== TAG MANAGEMENT PERMISSIONS ==========
    prisma.permission.create({
      data: {
        name: 'tags:create',
        description: 'Tạo thẻ tag',
        metaTitle: 'Quyền tạo tag',
        metaDescription: 'Cho phép tạo thẻ tag mới để gắn cho bài viết'
      }
    }),
    prisma.permission.create({
      data: {
        name: 'tags:read',
        description: 'Xem thẻ tag',
        metaTitle: 'Quyền xem tag',
        metaDescription: 'Cho phép xem danh sách và thông tin chi tiết thẻ tag'
      }
    }),
    prisma.permission.create({
      data: {
        name: 'tags:update',
        description: 'Cập nhật thẻ tag',
        metaTitle: 'Quyền chỉnh sửa tag',
        metaDescription: 'Cho phép chỉnh sửa thông tin thẻ tag'
      }
    }),
    prisma.permission.create({
      data: {
        name: 'tags:delete',
        description: 'Xóa thẻ tag',
        metaTitle: 'Quyền xóa tag',
        metaDescription: 'Cho phép xóa thẻ tag khỏi hệ thống'
      }
    }),

    // ========== MEDIA MANAGEMENT PERMISSIONS ==========
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
    prisma.permission.create({
      data: {
        name: 'media:manage_all',
        description: 'Quản lý toàn bộ media',
        metaTitle: 'Quyền quản lý toàn bộ media',
        metaDescription: 'Quyền cao nhất trong quản lý media, bao gồm cả media của người khác'
      }
    }),
    prisma.permission.create({
      data: {
        name: 'media:organize',
        description: 'Tổ chức thư viện media',
        metaTitle: 'Quyền tổ chức media',
        metaDescription: 'Cho phép tổ chức, phân loại file trong thư viện media'
      }
    }),

    // ========== COMMENT MANAGEMENT PERMISSIONS ==========
    prisma.permission.create({
      data: {
        name: 'comments:create',
        description: 'Tạo bình luận',
        metaTitle: 'Quyền tạo bình luận',
        metaDescription: 'Cho phép tạo bình luận cho bài viết'
      }
    }),
    prisma.permission.create({
      data: {
        name: 'comments:read',
        description: 'Xem bình luận',
        metaTitle: 'Quyền xem bình luận',
        metaDescription: 'Cho phép xem danh sách và nội dung bình luận'
      }
    }),
    prisma.permission.create({
      data: {
        name: 'comments:update',
        description: 'Cập nhật bình luận',
        metaTitle: 'Quyền chỉnh sửa bình luận',
        metaDescription: 'Cho phép chỉnh sửa nội dung bình luận'
      }
    }),
    prisma.permission.create({
      data: {
        name: 'comments:delete',
        description: 'Xóa bình luận',
        metaTitle: 'Quyền xóa bình luận',
        metaDescription: 'Cho phép xóa bình luận khỏi hệ thống'
      }
    }),
    prisma.permission.create({
      data: {
        name: 'comments:moderate',
        description: 'Kiểm duyệt bình luận',
        metaTitle: 'Quyền kiểm duyệt bình luận',
        metaDescription: 'Cho phép kiểm duyệt và phê duyệt bình luận'
      }
    }),
    prisma.permission.create({
      data: {
        name: 'comments:approve',
        description: 'Phê duyệt bình luận',
        metaTitle: 'Quyền phê duyệt bình luận',
        metaDescription: 'Cho phép phê duyệt bình luận để hiển thị công khai'
      }
    }),

    // ========== RECRUITMENT MANAGEMENT PERMISSIONS ==========
    prisma.permission.create({
      data: {
        name: 'recruitment:create',
        description: 'Tạo tin tuyển dụng',
        metaTitle: 'Quyền tạo tin tuyển dụng',
        metaDescription: 'Cho phép tạo tin tuyển dụng mới'
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
    prisma.permission.create({
      data: {
        name: 'recruitment:publish',
        description: 'Xuất bản tin tuyển dụng',
        metaTitle: 'Quyền xuất bản tin tuyển dụng',
        metaDescription: 'Cho phép xuất bản tin tuyển dụng để hiển thị công khai'
      }
    }),
    prisma.permission.create({
      data: {
        name: 'recruitment:manage_all',
        description: 'Quản lý toàn bộ tuyển dụng',
        metaTitle: 'Quyền quản lý toàn bộ tuyển dụng',
        metaDescription: 'Quyền cao nhất trong quản lý tuyển dụng'
      }
    }),
    prisma.permission.create({
      data: {
        name: 'recruitment:view_applications',
        description: 'Xem hồ sơ ứng tuyển',
        metaTitle: 'Quyền xem hồ sơ ứng tuyển',
        metaDescription: 'Cho phép xem danh sách và chi tiết hồ sơ ứng tuyển'
      }
    }),
    prisma.permission.create({
      data: {
        name: 'recruitment:manage_applications',
        description: 'Quản lý hồ sơ ứng tuyển',
        metaTitle: 'Quyền quản lý hồ sơ ứng tuyển',
        metaDescription: 'Cho phép thay đổi trạng thái và quản lý hồ sơ ứng tuyển'
      }
    }),

    // ========== SERVICE MANAGEMENT PERMISSIONS ==========
    prisma.permission.create({
      data: {
        name: 'services:create',
        description: 'Tạo dịch vụ',
        metaTitle: 'Quyền tạo dịch vụ',
        metaDescription: 'Cho phép tạo dịch vụ mới'
      }
    }),
    prisma.permission.create({
      data: {
        name: 'services:read',
        description: 'Xem dịch vụ',
        metaTitle: 'Quyền xem dịch vụ',
        metaDescription: 'Cho phép xem danh sách và chi tiết dịch vụ'
      }
    }),
    prisma.permission.create({
      data: {
        name: 'services:update',
        description: 'Cập nhật dịch vụ',
        metaTitle: 'Quyền chỉnh sửa dịch vụ',
        metaDescription: 'Cho phép chỉnh sửa thông tin dịch vụ'
      }
    }),
    prisma.permission.create({
      data: {
        name: 'services:delete',
        description: 'Xóa dịch vụ',
        metaTitle: 'Quyền xóa dịch vụ',
        metaDescription: 'Cho phép xóa dịch vụ khỏi hệ thống'
      }
    }),
    prisma.permission.create({
      data: {
        name: 'services:manage_all',
        description: 'Quản lý toàn bộ dịch vụ',
        metaTitle: 'Quyền quản lý toàn bộ dịch vụ',
        metaDescription: 'Quyền cao nhất trong quản lý dịch vụ'
      }
    }),

    // ========== CONTACT MANAGEMENT PERMISSIONS ==========
    prisma.permission.create({
      data: {
        name: 'contacts:read',
        description: 'Xem liên hệ',
        metaTitle: 'Quyền xem liên hệ',
        metaDescription: 'Cho phép xem danh sách và chi tiết form liên hệ'
      }
    }),
    prisma.permission.create({
      data: {
        name: 'contacts:update',
        description: 'Cập nhật trạng thái liên hệ',
        metaTitle: 'Quyền cập nhật liên hệ',
        metaDescription: 'Cho phép thay đổi trạng thái xử lý liên hệ'
      }
    }),
    prisma.permission.create({
      data: {
        name: 'contacts:delete',
        description: 'Xóa liên hệ',
        metaTitle: 'Quyền xóa liên hệ',
        metaDescription: 'Cho phép xóa form liên hệ khỏi hệ thống'
      }
    }),
    prisma.permission.create({
      data: {
        name: 'contacts:respond',
        description: 'Phản hồi liên hệ',
        metaTitle: 'Quyền phản hồi liên hệ',
        metaDescription: 'Cho phép gửi email phản hồi cho khách hàng'
      }
    }),
    prisma.permission.create({
      data: {
        name: 'contacts:export',
        description: 'Xuất dữ liệu liên hệ',
        metaTitle: 'Quyền xuất dữ liệu liên hệ',
        metaDescription: 'Cho phép xuất danh sách liên hệ ra file Excel/CSV'
      }
    }),

    // ========== NEWSLETTER PERMISSIONS ==========
    prisma.permission.create({
      data: {
        name: 'newsletter:read',
        description: 'Xem danh sách đăng ký newsletter',
        metaTitle: 'Quyền xem newsletter',
        metaDescription: 'Cho phép xem danh sách email đăng ký nhận tin'
      }
    }),
    prisma.permission.create({
      data: {
        name: 'newsletter:manage',
        description: 'Quản lý newsletter',
        metaTitle: 'Quyền quản lý newsletter',
        metaDescription: 'Cho phép gửi email và quản lý danh sách newsletter'
      }
    }),
    prisma.permission.create({
      data: {
        name: 'newsletter:send',
        description: 'Gửi email newsletter',
        metaTitle: 'Quyền gửi newsletter',
        metaDescription: 'Cho phép gửi email newsletter đến danh sách đăng ký'
      }
    }),

    // ========== ANALYTICS & REPORTS PERMISSIONS ==========
    prisma.permission.create({
      data: {
        name: 'analytics:view_basic',
        description: 'Xem báo cáo cơ bản',
        metaTitle: 'Quyền xem analytics cơ bản',
        metaDescription: 'Cho phép xem báo cáo thống kê cơ bản của hệ thống'
      }
    }),
    prisma.permission.create({
      data: {
        name: 'analytics:view_advanced',
        description: 'Xem báo cáo chi tiết',
        metaTitle: 'Quyền xem analytics chi tiết',
        metaDescription: 'Cho phép xem báo cáo thống kê chi tiết và phân tích nâng cao'
      }
    }),
    prisma.permission.create({
      data: {
        name: 'analytics:export',
        description: 'Xuất báo cáo',
        metaTitle: 'Quyền xuất báo cáo',
        metaDescription: 'Cho phép xuất báo cáo thống kê ra file Excel/PDF'
      }
    }),

    // ========== SETTINGS MANAGEMENT PERMISSIONS ==========
    prisma.permission.create({
      data: {
        name: 'settings:read',
        description: 'Xem cài đặt',
        metaTitle: 'Quyền xem cài đặt',
        metaDescription: 'Cho phép xem các cài đặt hệ thống'
      }
    }),
    prisma.permission.create({
      data: {
        name: 'settings:update',
        description: 'Cập nhật cài đặt',
        metaTitle: 'Quyền cập nhật cài đặt',
        metaDescription: 'Cho phép thay đổi cài đặt hệ thống'
      }
    }),
    prisma.permission.create({
      data: {
        name: 'settings:manage_seo',
        description: 'Quản lý cài đặt SEO',
        metaTitle: 'Quyền quản lý SEO',
        metaDescription: 'Cho phép cấu hình các thông số SEO của website'
      }
    }),
    prisma.permission.create({
      data: {
        name: 'settings:manage_general',
        description: 'Quản lý cài đặt chung',
        metaTitle: 'Quyền cài đặt chung',
        metaDescription: 'Cho phép thay đổi cài đặt chung của website'
      }
    }),

    // ========== STATUS MANAGEMENT PERMISSIONS ==========
    prisma.permission.create({
      data: {
        name: 'status:create',
        description: 'Tạo trạng thái mới',
        metaTitle: 'Quyền tạo trạng thái',
        metaDescription: 'Cho phép tạo trạng thái mới cho các đối tượng'
      }
    }),
    prisma.permission.create({
      data: {
        name: 'status:read',
        description: 'Xem trạng thái',
        metaTitle: 'Quyền xem trạng thái',
        metaDescription: 'Cho phép xem danh sách trạng thái'
      }
    }),
    prisma.permission.create({
      data: {
        name: 'status:update',
        description: 'Cập nhật trạng thái',
        metaTitle: 'Quyền cập nhật trạng thái',
        metaDescription: 'Cho phép chỉnh sửa thông tin trạng thái'
      }
    }),
    prisma.permission.create({
      data: {
        name: 'status:delete',
        description: 'Xóa trạng thái',
        metaTitle: 'Quyền xóa trạng thái',
        metaDescription: 'Cho phép xóa trạng thái khỏi hệ thống'
      }
    }),
  ]);

  console.log(`✅ Đã tạo ${permissions.length} permissions`);
  console.log('👑 Tạo Roles...');
  
  // Tạo Super Admin Role
  const superAdminRole = await prisma.role.create({
    data: {
      name: 'Super Administrator',
      description: 'Quản trị viên cấp cao nhất với toàn quyền hệ thống',
      metaTitle: 'Vai trò Super Administrator',
      metaDescription: 'Vai trò có quyền cao nhất, có thể thực hiện mọi hành động trong hệ thống',
      permissions: {
        connect: [
          { name: 'admin:full_access' },
        ]
      }
    }
  });

  // Tạo Administrator Role
  const adminRole = await prisma.role.create({
    data: {
      name: 'Administrator',
      description: 'Quản trị viên hệ thống với quyền quản lý cao',
      metaTitle: 'Vai trò Administrator',
      metaDescription: 'Vai trò quản trị viên với quyền quản lý hầu hết các chức năng hệ thống',
      permissions: {
        connect: [
          // System permissions
          { name: 'admin:system_settings' },
          { name: 'admin:view_logs' },
          { name: 'admin:manage_sessions' },
          
          // User management
          { name: 'users:create' },
          { name: 'users:read' },
          { name: 'users:update' },
          { name: 'users:delete' },
          { name: 'users:manage_all' },
          { name: 'users:view_profile' },
          { name: 'users:reset_password' },
          
          // Role management
          { name: 'roles:create' },
          { name: 'roles:read' },
          { name: 'roles:update' },
          { name: 'roles:delete' },
          { name: 'roles:assign_permissions' },
          { name: 'roles:assign_to_users' },
          
          // Permission management
          { name: 'permissions:read' },
          { name: 'permissions:manage' },
          
          // Content management
          { name: 'blogs:create' },
          { name: 'blogs:read' },
          { name: 'blogs:update' },
          { name: 'blogs:delete' },
          { name: 'blogs:publish' },
          { name: 'blogs:unpublish' },
          { name: 'blogs:manage_all' },
          { name: 'blogs:moderate' },
          { name: 'blogs:view_drafts' },
          { name: 'blogs:schedule' },
          
          // Category & Tag management
          { name: 'categories:create' },
          { name: 'categories:read' },
          { name: 'categories:update' },
          { name: 'categories:delete' },
          { name: 'categories:manage_hierarchy' },
          { name: 'tags:create' },
          { name: 'tags:read' },
          { name: 'tags:update' },
          { name: 'tags:delete' },
          
          // Media management
          { name: 'media:upload' },
          { name: 'media:read' },
          { name: 'media:update' },
          { name: 'media:delete' },
          { name: 'media:manage_all' },
          { name: 'media:organize' },
          
          // Comment management
          { name: 'comments:create' },
          { name: 'comments:read' },
          { name: 'comments:update' },
          { name: 'comments:delete' },
          { name: 'comments:moderate' },
          { name: 'comments:approve' },
          
          // Recruitment management
          { name: 'recruitment:create' },
          { name: 'recruitment:read' },
          { name: 'recruitment:update' },
          { name: 'recruitment:delete' },
          { name: 'recruitment:publish' },
          { name: 'recruitment:manage_all' },
          { name: 'recruitment:view_applications' },
          { name: 'recruitment:manage_applications' },
          
          // Service management
          { name: 'services:create' },
          { name: 'services:read' },
          { name: 'services:update' },
          { name: 'services:delete' },
          { name: 'services:manage_all' },
          
          // Contact & Newsletter
          { name: 'contacts:read' },
          { name: 'contacts:update' },
          { name: 'contacts:delete' },
          { name: 'contacts:respond' },
          { name: 'contacts:export' },
          { name: 'newsletter:read' },
          { name: 'newsletter:manage' },
          { name: 'newsletter:send' },
          
          // Analytics & Settings
          { name: 'analytics:view_basic' },
          { name: 'analytics:view_advanced' },
          { name: 'analytics:export' },
          { name: 'settings:read' },
          { name: 'settings:update' },
          { name: 'settings:manage_seo' },
          { name: 'settings:manage_general' },
          
          // Status management
          { name: 'status:create' },
          { name: 'status:read' },
          { name: 'status:update' },
          { name: 'status:delete' },
        ]
      }
    }
  });

  // Tạo HR Manager Role
  const hrManagerRole = await prisma.role.create({
    data: {
      name: 'HR Manager',
      description: 'Quản lý nhân sự chuyên về tuyển dụng',
      metaTitle: 'Vai trò HR Manager',
      metaDescription: 'Vai trò quản lý nhân sự với quyền quản lý tuyển dụng và ứng viên',
      permissions: {
        connect: [
          // User management (limited)
          { name: 'users:read' },
          { name: 'users:view_profile' },
          
          // Recruitment management (full)
          { name: 'recruitment:create' },
          { name: 'recruitment:read' },
          { name: 'recruitment:update' },
          { name: 'recruitment:delete' },
          { name: 'recruitment:publish' },
          { name: 'recruitment:manage_all' },
          { name: 'recruitment:view_applications' },
          { name: 'recruitment:manage_applications' },
          
          // Category management (for recruitment)
          { name: 'categories:read' },
          { name: 'categories:create' },
          { name: 'categories:update' },
          
          // Contact management
          { name: 'contacts:read' },
          { name: 'contacts:update' },
          { name: 'contacts:respond' },
          { name: 'contacts:export' },
          
          // Analytics (basic)
          { name: 'analytics:view_basic' },
          
          // Media (basic)
          { name: 'media:upload' },
          { name: 'media:read' },
          { name: 'media:update' },
        ]
      }
    }
  });

  // Tạo Editor Role
  const editorRole = await prisma.role.create({
    data: {
      name: 'Editor',
      description: 'Biên tập viên quản lý nội dung blog và dịch vụ',
      metaTitle: 'Vai trò Editor',
      metaDescription: 'Vai trò chuyên quản lý nội dung, blog và dịch vụ của website',
      permissions: {
        connect: [
          // Blog management
          { name: 'blogs:create' },
          { name: 'blogs:read' },
          { name: 'blogs:update' },
          { name: 'blogs:delete' },
          { name: 'blogs:publish' },
          { name: 'blogs:unpublish' },
          { name: 'blogs:view_drafts' },
          { name: 'blogs:schedule' },
          
          // Category & Tag management
          { name: 'categories:create' },
          { name: 'categories:read' },
          { name: 'categories:update' },
          { name: 'categories:manage_hierarchy' },
          { name: 'tags:create' },
          { name: 'tags:read' },
          { name: 'tags:update' },
          { name: 'tags:delete' },
          
          // Media management
          { name: 'media:upload' },
          { name: 'media:read' },
          { name: 'media:update' },
          { name: 'media:organize' },
          
          // Comment management
          { name: 'comments:read' },
          { name: 'comments:moderate' },
          { name: 'comments:approve' },
          
          // Service management
          { name: 'services:create' },
          { name: 'services:read' },
          { name: 'services:update' },
          { name: 'services:delete' },
          
          // Basic permissions
          { name: 'users:update_own_profile' },
          { name: 'users:change_password' },
          
          // Analytics (basic)
          { name: 'analytics:view_basic' },
        ]
      }
    }
  });

  // Tạo Moderator Role
  const moderatorRole = await prisma.role.create({
    data: {
      name: 'Moderator',
      description: 'Người kiểm duyệt nội dung và quản lý bình luận',
      metaTitle: 'Vai trò Moderator',
      metaDescription: 'Vai trò kiểm duyệt nội dung và xử lý bình luận từ người dùng',
      permissions: {
        connect: [
          // Basic user management
          { name: 'users:read' },
          { name: 'users:view_profile' },
          { name: 'users:update_own_profile' },
          { name: 'users:change_password' },
          
          // Blog management (limited)
          { name: 'blogs:read' },
          { name: 'blogs:update' },
          { name: 'blogs:moderate' },
          { name: 'blogs:view_drafts' },
          
          // Comment management (full)
          { name: 'comments:create' },
          { name: 'comments:read' },
          { name: 'comments:update' },
          { name: 'comments:delete' },
          { name: 'comments:moderate' },
          { name: 'comments:approve' },
          
          // Category & Tag (read only)
          { name: 'categories:read' },
          { name: 'tags:read' },
          
          // Media (basic)
          { name: 'media:read' },
          { name: 'media:upload' },
          
          // Contact management
          { name: 'contacts:read' },
          { name: 'contacts:update' },
          { name: 'contacts:respond' },
        ]
      }
    }
  });

  // Tạo Author Role
  const authorRole = await prisma.role.create({
    data: {
      name: 'Author',
      description: 'Tác giả viết bài và quản lý nội dung cá nhân',
      metaTitle: 'Vai trò Author',
      metaDescription: 'Vai trò dành cho các tác giả viết bài và quản lý nội dung của mình',
      permissions: {
        connect: [
          // Basic user management
          { name: 'users:update_own_profile' },
          { name: 'users:change_password' },
          { name: 'users:view_profile' },
          
          // Blog management (own content)
          { name: 'blogs:create' },
          { name: 'blogs:read' },
          { name: 'blogs:update' },
          { name: 'blogs:view_drafts' },
          
          // Comment management (limited)
          { name: 'comments:create' },
          { name: 'comments:read' },
          { name: 'comments:update' },
          
          // Category & Tag (read + create)
          { name: 'categories:read' },
          { name: 'tags:read' },
          { name: 'tags:create' },
          
          // Media management (own)
          { name: 'media:upload' },
          { name: 'media:read' },
          { name: 'media:update' },
        ]
      }
    }
  });

  // Tạo User Role
  const userRole = await prisma.role.create({
    data: {
      name: 'User',
      description: 'Người dùng thông thường',
      metaTitle: 'Vai trò User',
      metaDescription: 'Vai trò cơ bản cho người dùng đăng ký tài khoản',
      permissions: {
        connect: [
          // Basic permissions
          { name: 'users:update_own_profile' },
          { name: 'users:change_password' },
          
          // Read permissions
          { name: 'blogs:read' },
          { name: 'categories:read' },
          { name: 'tags:read' },
          { name: 'services:read' },
          
          // Comment permissions
          { name: 'comments:create' },
          { name: 'comments:read' },
          { name: 'comments:update' }, // Only own comments
        ]
      }
    }
  });

  console.log(`✅ Đã tạo 7 roles: Super Admin, Admin, HR Manager, Editor, Moderator, Author, User`);

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
      email: 'thang.ph2146@gmail.com',      name: 'Phạm Hoàng Thắng',
      hashedPassword: hashedPassword,
      emailVerified: new Date(),
      roleId: superAdminRole.id,
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
    // Admin user
    prisma.user.create({
      data: {
        email: 'admin@example.com',
        name: 'Nguyễn Văn Quản',
        hashedPassword: await bcrypt.hash('admin123', 10),
        emailVerified: new Date(),
        roleId: adminRole.id,
        avatarUrl: 'https://ui-avatars.com/api/?name=Nguyen+Van+Quan&background=dc2626&color=ffffff&size=200',
        profile: {
          create: {
            bio: 'Quản trị viên hệ thống với kinh nghiệm quản lý nhiều năm.',
            avatarUrl: 'https://ui-avatars.com/api/?name=Nguyen+Van+Quan&background=dc2626&color=ffffff&size=200',
            socialLinks: {
              linkedin: 'https://linkedin.com/in/nguyenvanquan'
            }
          }
        }
      }
    }),
    
    // HR Manager user
    prisma.user.create({
      data: {
        email: 'hr@example.com',
        name: 'Trần Thị Nhân',
        hashedPassword: await bcrypt.hash('hr123', 10),
        emailVerified: new Date(),
        roleId: hrManagerRole.id,
        avatarUrl: 'https://ui-avatars.com/api/?name=Tran+Thi+Nhan&background=0ea5e9&color=ffffff&size=200',
        profile: {
          create: {
            bio: 'Chuyên gia nhân sự với nhiều năm kinh nghiệm tuyển dụng.',
            avatarUrl: 'https://ui-avatars.com/api/?name=Tran+Thi+Nhan&background=0ea5e9&color=ffffff&size=200',
            socialLinks: {
              linkedin: 'https://linkedin.com/in/tranthinha'
            }
          }
        }
      }
    }),
    
    // Editor user
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
    
    // Moderator user
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
    
    // Author user
    prisma.user.create({
      data: {
        email: 'author@example.com',
        name: 'Lê Văn Viết',
        hashedPassword: await bcrypt.hash('author123', 10),
        emailVerified: new Date(),
        roleId: authorRole.id,
        avatarUrl: 'https://ui-avatars.com/api/?name=Le+Van+Viet&background=7c3aed&color=ffffff&size=200',
        profile: {
          create: {
            bio: 'Tác giả chuyên viết về công nghệ và đời sống.',
            avatarUrl: 'https://ui-avatars.com/api/?name=Le+Van+Viet&background=7c3aed&color=ffffff&size=200',
            socialLinks: {
              website: 'https://levanviet.com',
              twitter: 'https://twitter.com/levanviet'
            }
          }
        }
      }
    }),
    
    // Regular user
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
  console.log(`- ${permissions.length} Permissions (đầy đủ cho tất cả API)`);
  console.log(`- 7 Roles (Super Admin, Admin, HR Manager, Editor, Moderator, Author, User)`);
  console.log(`- ${statuses.length} Statuses`);
  console.log(`- ${categories.length} Categories`);
  console.log(`- ${tags.length} Tags`);
  console.log(`- ${sampleUsers.length + 1} Users`);
  console.log('\n🔑 Thông tin đăng nhập:');
  console.log('🎯 SUPER ADMIN:');
  console.log('  📧 Email: thang.ph2146@gmail.com');
  console.log('  🔒 Password: RachelCu.26112020');
  console.log('  👑 Role: Super Administrator (Toàn quyền)');
  console.log('\n🎯 CÁC TÀI KHOẢN TEST:');
  console.log('  📧 admin@example.com | 🔒 admin123 | 👑 Administrator');
  console.log('  📧 hr@example.com | 🔒 hr123 | 👤 HR Manager');
  console.log('  📧 editor@example.com | 🔒 editor123 | ✏️ Editor');
  console.log('  📧 moderator@example.com | 🔒 moderator123 | 🛡️ Moderator');
  console.log('  📧 author@example.com | 🔒 author123 | 📝 Author');
  console.log('  📧 user@example.com | 🔒 user123 | 👤 User');
}

main()
  .catch((e) => {
    console.error('❌ Lỗi khi seed database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
