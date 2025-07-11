import {
  IsEmail,
  IsOptional,
  IsString,
  IsInt,
  IsBoolean,
  IsDateString,
  IsArray,
  ArrayMinSize,
  Min,
  Max,
  IsUrl,
  IsObject,
  ValidateNested,
  IsEnum,
  MinLength,
  MaxLength,
  Matches,
  IsNumber,
  IsPositive,
  ArrayNotEmpty,
} from 'class-validator';
import { Transform, Type, Exclude } from 'class-transformer';
import {
  ApiProperty,
  ApiPropertyOptional,
  PartialType,
  OmitType,
} from '@nestjs/swagger';

// =============================================================================
// DOCUMENTATION
// =============================================================================
/**
 * @file user.dto.ts
 * @description This file contains all Data Transfer Objects (DTOs) for the User module.
 * These DTOs are used for:
 * - Validating incoming request bodies (`CreateUserDto`, `UpdateUserDto`, etc.)
 * - Typing query parameters (`UserQueryDto`)
 * - Shaping responses sent back to the client (`UserResponseDto`, `UserListResponseDto`, etc.)
 *
 * The DTOs leverage `class-validator` for robust validation and `class-transformer` for
 * transforming incoming data into the correct types. Swagger decorators (`@ApiProperty`)
 * are used to generate comprehensive API documentation.
 *
 * @version 2.1.0
 * @author PHGroup Development Team
 */

// =============================================================================
// ENUMS & CONSTANTS
// =============================================================================
export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export enum UserSortBy {
  ID = 'id',
  EMAIL = 'email',
  NAME = 'name',
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  DELETED_AT = 'deletedAt', // Added for sorting deleted users
  ROLE_ID = 'roleId',
}

export enum AdminUserAction {
  SUSPEND = 'suspend',
  ACTIVATE = 'activate',
  VERIFY_EMAIL = 'verify_email',
  UNVERIFY_EMAIL = 'unverify_email',
  FORCE_PASSWORD_RESET = 'force_password_reset',
}

export enum ExportFormat {
  CSV = 'csv',
  XLSX = 'xlsx',
  JSON = 'json',
}

// =============================================================================
// NESTED & SHARED DTOs
// =============================================================================
export class UserProfileDto {
  @ApiPropertyOptional({ description: 'Bio mô tả người dùng', maxLength: 1000 })
  @IsOptional()
  @IsString({ message: 'Bio phải là chuỗi ký tự' })
  @MaxLength(1000, { message: 'Bio không được vượt quá 1000 ký tự' })
  bio?: string;

  @ApiPropertyOptional({ description: 'Số điện thoại', example: '0901234567' })
  @IsOptional()
  @IsString({ message: 'Số điện thoại phải là chuỗi ký tự' })
  @Matches(/^[0-9]{10,11}$/, { message: 'Số điện thoại không hợp lệ' })
  phone?: string;

  @ApiPropertyOptional({ description: 'URL ảnh đại diện' })
  @IsOptional()
  @IsUrl({}, { message: 'Avatar URL không hợp lệ' })
  avatarUrl?: string;

  @ApiPropertyOptional({ description: 'Liên kết mạng xã hội (JSON object)' })
  @IsOptional()
  @IsObject({ message: 'Social links phải là object JSON' })
  socialLinks?: Record<string, any>;
}

export class UserPermissionDto {
  @ApiProperty({ description: 'ID quyền' })
  @IsInt()
  @IsPositive()
  id: number;

  @ApiProperty({ description: 'Tên quyền' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Mô tả quyền' })
  @IsOptional()
  @IsString()
  description?: string | null;
}

export class UserRoleDto {
  @ApiProperty({ description: 'ID vai trò' })
  @IsInt()
  @IsPositive()
  id: number;

  @ApiProperty({ description: 'Tên vai trò' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Mô tả vai trò' })
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiPropertyOptional({ description: 'Danh sách quyền của vai trò' })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => UserPermissionDto)
  permissions?: UserPermissionDto[];
}

export class UserAccountDto {
  @ApiProperty({ description: 'ID tài khoản OAuth' })
  @IsString()
  id: string;

  @ApiProperty({ description: 'Nhà cung cấp dịch vụ (Google, Facebook, etc.)' })
  @IsString()
  provider: string;

  @ApiProperty({ description: 'Loại tài khoản OAuth' })
  @IsString()
  type: string;

  @ApiProperty({ description: 'ID tài khoản tại nhà cung cấp' })
  @IsString()
  providerAccountId: string;
}

// =============================================================================
// CREATE & UPDATE DTOs
// =============================================================================
export class CreateUserDto {
  @ApiProperty({
    description: 'Email người dùng',
    example: 'user@example.com',
    uniqueItems: true,
  })
  @IsEmail({}, { message: 'Email không đúng định dạng' })
  @Transform(({ value }) => value?.toLowerCase().trim())
  email: string;

  @ApiProperty({
    description: 'Tên đầy đủ của người dùng',
    example: 'Nguyễn Văn A',
    minLength: 2,
    maxLength: 100,
  })
  @IsString({ message: 'Tên là bắt buộc và phải là chuỗi ký tự' })
  @MinLength(2, { message: 'Tên phải có ít nhất 2 ký tự' })
  @MaxLength(100, { message: 'Tên không được vượt quá 100 ký tự' })
  @Transform(({ value }) => value?.trim())
  name: string;

  @ApiProperty({
    description: 'Mật khẩu người dùng',
    minLength: 8,
    example: 'SecurePassword123!',
  })
  @IsString({ message: 'Mật khẩu là bắt buộc' })
  @MinLength(8, { message: 'Mật khẩu phải có ít nhất 8 ký tự' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).*$/, {
    message:
      'Mật khẩu phải chứa ít nhất 1 chữ thường, 1 chữ hoa, 1 số và 1 ký tự đặc biệt',
  })
  password: string;

  @ApiPropertyOptional({ description: 'URL ảnh đại diện người dùng' })
  @IsOptional()
  @IsUrl({}, { message: 'Avatar URL không hợp lệ' })
  avatarUrl?: string;

  @ApiPropertyOptional({ description: 'URL ảnh profile (dùng cho OAuth)' })
  @IsOptional()
  @IsUrl({}, { message: 'Image URL không hợp lệ' })
  image?: string;

  @ApiPropertyOptional({ description: 'ID vai trò của người dùng' })
  @IsOptional()
  @IsInt({ message: 'Role ID phải là số nguyên' })
  @IsPositive({ message: 'Role ID phải lớn hơn 0' })
  @Type(() => Number)
  roleId?: number;

  @ApiPropertyOptional({ description: 'Thông tin profile chi tiết' })
  @IsOptional()
  @ValidateNested()
  @Type(() => UserProfileDto)
  profile?: UserProfileDto;
}

/**
 * DTO for updating a user.
 * Inherits from CreateUserDto but makes all fields optional and omits the password.
 * Password changes should go through the dedicated 'change-password' endpoint.
 */
export class UpdateUserDto extends PartialType(
  OmitType(CreateUserDto, ['password'] as const),
) {
  @ValidateNested()
  @Type(() => UserProfileDto)
  profile?: UserProfileDto;

  @ApiPropertyOptional({ description: 'Bio mô tả' })
  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: 'Bio không được vượt quá 1000 ký tự' })
  @Transform(({ value }) => (value === '' ? null : value))
  bio?: string;

  @ApiPropertyOptional({ description: 'Số điện thoại', example: '0901234567' })
  @IsOptional()
  @IsString({ message: 'Số điện thoại phải là chuỗi ký tự' })
  @Matches(/^[0-9]{10,11}$/, { message: 'Số điện thoại không hợp lệ' })
  @Transform(({ value }) => (value === '' ? null : value))
  phone?: string;
}

// =============================================================================
// PASSWORD MANAGEMENT DTOs
// =============================================================================
export class ChangePasswordDto {
  @ApiProperty({ description: 'Mật khẩu hiện tại' })
  @IsString({ message: 'Mật khẩu hiện tại là bắt buộc' })
  @MinLength(1, { message: 'Mật khẩu hiện tại không được để trống' })
  currentPassword: string;

  @ApiProperty({ description: 'Mật khẩu mới' })
  @IsString({ message: 'Mật khẩu mới là bắt buộc' })
  @MinLength(8, { message: 'Mật khẩu mới phải có ít nhất 8 ký tự' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).*$/, {
    message:
      'Mật khẩu mới phải chứa ít nhất 1 chữ thường, 1 chữ hoa, 1 số và 1 ký tự đặc biệt',
  })
  newPassword: string;

  @ApiProperty({ description: 'Xác nhận mật khẩu mới' })
  @IsString({ message: 'Xác nhận mật khẩu là bắt buộc' })
  @IsString({ message: 'Xác nhận mật khẩu là bắt buộc' })
  confirmPassword: string;
}

export class ForgotPasswordDto {
  @ApiProperty({
    description: 'Email để gửi yêu cầu reset mật khẩu',
    example: 'user@example.com',
  })
  @IsEmail({}, { message: 'Email không đúng định dạng' })
  @Transform(({ value }) => value?.toLowerCase().trim())
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty({ description: 'Token reset mật khẩu từ email' })
  @IsString({ message: 'Token là bắt buộc' })
  @MinLength(1, { message: 'Token không được để trống' })
  token: string;

  @ApiProperty({ description: 'Mật khẩu mới' })
  @IsString({ message: 'Mật khẩu mới là bắt buộc' })
  @MinLength(8, { message: 'Mật khẩu mới phải có ít nhất 8 ký tự' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).*$/, {
    message:
      'Mật khẩu mới phải chứa ít nhất 1 chữ thường, 1 chữ hoa, 1 số và 1 ký tự đặc biệt',
  })
  newPassword: string;

  @ApiProperty({ description: 'Xác nhận mật khẩu mới' })
  @IsString({ message: 'Xác nhận mật khẩu là bắt buộc' })
  @IsString({ message: 'Xác nhận mật khẩu là bắt buộc' })
  confirmPassword: string;
}

// =============================================================================
// QUERY & FILTER DTOs
// =============================================================================
export class AdminUserQueryDto {
  @ApiPropertyOptional({
    description: 'Số trang',
    example: 1,
    minimum: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Page phải là số nguyên' })
  @Min(1, { message: 'Page phải lớn hơn hoặc bằng 1' })
  @Transform(({ value }) => {
    const num = Number(value);
    return isNaN(num) || num < 1 ? 1 : num;
  })
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Số lượng item mỗi trang',
    example: 10,
    minimum: 1,
    maximum: 100,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Limit phải là số nguyên' })
  @Min(1, { message: 'Limit phải lớn hơn hoặc bằng 1' })
  @Max(100, { message: 'Limit không được vượt quá 100' })
  @Transform(({ value }) => {
    const num = Number(value);
    return isNaN(num) || num < 1 ? 10 : num > 100 ? 100 : num;
  })
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Từ khóa tìm kiếm',
    example: 'Nguyễn',
  })
  @IsOptional()
  @IsString({ message: 'Search phải là chuỗi ký tự' })
  @MaxLength(255, { message: 'Từ khóa tìm kiếm không được vượt quá 255 ký tự' })
  @Transform(({ value }) => value?.trim())
  search?: string;

  @ApiPropertyOptional({
    description: 'Trường sắp xếp',
    enum: UserSortBy,
    default: UserSortBy.CREATED_AT,
  })
  @IsOptional()
  @IsEnum(UserSortBy, { message: 'Sort by không hợp lệ' })
  sortBy?: UserSortBy = UserSortBy.CREATED_AT;

  @ApiPropertyOptional({
    description: 'Thứ tự sắp xếp',
    enum: SortOrder,
    default: SortOrder.DESC,
  })
  @IsOptional()
  @IsEnum(SortOrder, { message: 'Sort order phải là asc hoặc desc' })
  sortOrder?: SortOrder = SortOrder.DESC;

  @ApiPropertyOptional({
    description: 'Bao gồm cả người dùng đã xóa',
    default: false,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }
    return Boolean(value);
  })
  @IsBoolean({ message: 'Include deleted phải là boolean' })
  includeDeleted?: boolean = false;

  @ApiPropertyOptional({
    description: 'Chỉ lấy người dùng đã xóa',
    default: false,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }
    return Boolean(value);
  })
  @IsBoolean({ message: 'Deleted phải là boolean' })
  deleted?: boolean = false;

  @ApiPropertyOptional({
    description: 'Lọc theo ID vai trò',
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Role ID phải là số nguyên' })
  @IsPositive({ message: 'Role ID phải lớn hơn 0' })
  @Transform(({ value }) => {
    if (!value || value === '') return undefined;
    const num = Number(value);
    return isNaN(num) ? undefined : num;
  })
  roleId?: number;

  @ApiPropertyOptional({
    description: 'Lọc theo trạng thái xác thực email',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }
    return Boolean(value);
  })
  @IsBoolean({ message: 'Verified phải là boolean' })
  verified?: boolean;
}

// Public query DTO (không có deleted options)
export class UserQueryDto {
  @ApiPropertyOptional({
    description: 'Số trang',
    example: 1,
    minimum: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Page phải là số nguyên' })
  @Min(1, { message: 'Page phải lớn hơn hoặc bằng 1' })
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Số lượng item mỗi trang',
    example: 10,
    minimum: 1,
    maximum: 100,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Limit phải là số nguyên' })
  @Min(1, { message: 'Limit phải lớn hơn hoặc bằng 1' })
  @Max(100, { message: 'Limit không được vượt quá 100' })
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Từ khóa tìm kiếm',
    example: 'Nguyễn',
  })
  @IsOptional()
  @IsString({ message: 'Search phải là chuỗi ký tự' })
  @MaxLength(255, { message: 'Từ khóa tìm kiếm không được vượt quá 255 ký tự' })
  search?: string;

  @ApiPropertyOptional({
    description: 'Trường sắp xếp',
    enum: ['id', 'email', 'name', 'createdAt', 'updatedAt'],
    default: 'createdAt',
  })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({
    description: 'Thứ tự sắp xếp',
    enum: SortOrder,
    default: SortOrder.DESC,
  })
  @IsOptional()
  @IsEnum(SortOrder, { message: 'Sort order phải là asc hoặc desc' })
  sortOrder?: SortOrder = SortOrder.DESC;

  @ApiPropertyOptional({
    description: 'Lọc theo ID vai trò',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Role ID phải là số nguyên' })
  @IsPositive({ message: 'Role ID phải lớn hơn 0' })
  roleId?: number;
}

// =============================================================================
// BULK OPERATION DTOs
// =============================================================================
export class BulkUserOperationDto {
  @ApiProperty({
    description: 'Danh sách ID người dùng',
    example: [1, 2, 3],
    type: [Number],
    minItems: 1,
  })
  @Transform(({ value }) => {
    if (Array.isArray(value)) {
      return value.map(Number).filter((id) => !isNaN(id) && id > 0);
    }
    return value;
  })
  @IsArray({ message: 'userIds phải là một mảng' })
  @ArrayNotEmpty({ message: 'Mảng userIds không được rỗng' })
  @ArrayMinSize(1, { message: 'Phải có ít nhất 1 user ID' })
  @Type(() => Number)
  @IsInt({ each: true, message: 'Mỗi user ID phải là số nguyên' })
  @IsPositive({ each: true, message: 'Mỗi user ID phải lớn hơn 0' })
  userIds: number[];
}

/**
 * DTO đặc biệt cho bulk restore - thiết kế đơn giản để tránh conflict validation
 */
export class BulkRestoreUsersDto {
  @ApiProperty({
    description: 'Mảng ID người dùng cần khôi phục',
    type: [Number],
    example: [413, 412, 411, 410, 409],
    isArray: true,
    minItems: 1,
    maxItems: 100,
  })
  @IsArray({ message: 'userIds phải là một mảng số nguyên' })
  @ArrayNotEmpty({ message: 'Danh sách userIds không được rỗng' })
  @ArrayMinSize(1, { message: 'Phải có ít nhất 1 user ID' })
  @Type(() => Number)
  @IsInt({ each: true, message: 'Mỗi user ID phải là số nguyên' })
  @IsPositive({ each: true, message: 'Mỗi user ID phải lớn hơn 0' })
  userIds: number[];
}

export class BulkUpdateUserDto {
  @ApiProperty({
    description: 'Mảng ID người dùng cần cập nhật',
    type: [Number],
    example: [1, 2, 3],
  })
  @IsArray({ message: 'userIds phải là một mảng' })
  @ArrayNotEmpty({ message: 'Mảng userIds không được rỗng' })
  @IsInt({ each: true, message: 'Mỗi user ID phải là số nguyên' })
  @IsPositive({ each: true, message: 'Mỗi user ID phải lớn hơn 0' })
  @Type(() => Number)
  userIds: number[];

  @ApiProperty({ description: 'Dữ liệu cập nhật cho tất cả người dùng' })
  @ValidateNested()
  @Type(() => UpdateUserDto)
  updateData: UpdateUserDto;
}

// =============================================================================
// ADMIN & EXPORT DTOs
// =============================================================================
export class AdminUserActionDto {
  @ApiProperty({
    description: 'Hành động quản trị cần thực hiện',
    enum: AdminUserAction,
    example: AdminUserAction.SUSPEND,
  })
  @IsEnum(AdminUserAction, {
    message:
      'Action phải là suspend, activate, verify_email, unverify_email, hoặc force_password_reset',
  })
  action: AdminUserAction;

  @ApiPropertyOptional({
    description: 'Lý do thực hiện hành động',
    maxLength: 500,
    example: 'Vi phạm quy tắc cộng đồng',
  })
  @IsOptional()
  @IsString({ message: 'Reason phải là chuỗi ký tự' })
  @MaxLength(500, { message: 'Reason không được vượt quá 500 ký tự' })
  reason?: string;
}

export class UserExportDto {
  @ApiPropertyOptional({
    description: 'Định dạng xuất file',
    enum: ExportFormat,
    default: ExportFormat.CSV,
    example: ExportFormat.CSV,
  })
  @IsOptional()
  @IsEnum(ExportFormat, { message: 'Format phải là csv, xlsx hoặc json' })
  format?: ExportFormat = ExportFormat.CSV;

  @ApiPropertyOptional({
    description: 'Các trường dữ liệu cần xuất',
    type: [String],
    example: ['id', 'email', 'name', 'role', 'createdAt'],
  })
  @IsOptional()
  @IsArray({ message: 'Fields phải là mảng' })
  @IsString({ each: true, message: 'Mỗi field phải là chuỗi ký tự' })
  fields?: string[];

  @ApiPropertyOptional({
    description: 'Bao gồm người dùng đã xóa trong xuất file',
    default: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'Include deleted phải là boolean' })
  includeDeleted?: boolean = false;
}

// =============================================================================
// RESPONSE DTOs
// =============================================================================
export class UserCountsResponseDto {
  @ApiProperty({ description: 'Số bài blog đã viết' })
  blogs: number;

  @ApiProperty({ description: 'Số file media đã upload' })
  medias: number;

  @ApiProperty({ description: 'Số bài tuyển dụng đã đăng' })
  recruitments: number;

  @ApiPropertyOptional({ description: 'Số blog đã like' })
  likedBlogs?: number;

  @ApiPropertyOptional({ description: 'Số blog đã bookmark' })
  bookmarkedBlogs?: number;

  @ApiPropertyOptional({ description: 'Số bình luận blog' })
  blogComments?: number;

  @ApiPropertyOptional({ description: 'Số phản hồi liên hệ' })
  contactSubmissionResponses?: number;
}

export class UserProfileResponseDto {
  @ApiProperty({ description: 'ID profile' })
  id: number;

  @ApiPropertyOptional({ description: 'Bio mô tả' })
  bio: string | null;

  @ApiPropertyOptional({ description: 'Số điện thoại' })
  phone: string | null;

  @ApiPropertyOptional({ description: 'URL ảnh đại diện' })
  avatarUrl: string | null;

  @ApiPropertyOptional({ description: 'Liên kết mạng xã hội' })
  socialLinks: any;

  @ApiProperty({ description: 'Ngày tạo profile' })
  createdAt: Date;

  @ApiProperty({ description: 'Ngày cập nhật profile' })
  updatedAt: Date;
}

export class UserRoleResponseDto {
  @ApiProperty({ description: 'ID vai trò' })
  id: number;

  @ApiProperty({ description: 'Tên vai trò' })
  name: string;

  @ApiPropertyOptional({ description: 'Mô tả vai trò' })
  description: string | null;

  @ApiPropertyOptional({ description: 'Danh sách quyền của vai trò' })
  permissions?: {
    id: number;
    name: string;
    description: string | null;
  }[];
}

export class UserResponseDto {
  @ApiProperty({ description: 'ID người dùng' })
  id: number;

  @ApiProperty({ description: 'Email người dùng' })
  email: string;

  @ApiPropertyOptional({ description: 'Tên đầy đủ' })
  name: string | null;

  @ApiPropertyOptional({ description: 'URL ảnh đại diện' })
  avatarUrl: string | null;

  @ApiPropertyOptional({ description: 'URL ảnh profile (OAuth)' })
  image: string | null;

  @ApiPropertyOptional({ description: 'ID vai trò' })
  roleId: number | null;

  @ApiProperty({ description: 'Ngày tạo tài khoản' })
  createdAt: Date;

  @ApiProperty({ description: 'Ngày cập nhật cuối' })
  updatedAt: Date;

  @ApiPropertyOptional({ description: 'Ngày xóa (soft delete)' })
  deletedAt: Date | null;

  // Loại bỏ các trường nhạy cảm khỏi response
  @Exclude()
  hashedPassword?: string;

  @Exclude()
  passwordResetToken?: string;

  @Exclude()
  passwordResetTokenExpiry?: Date;

  @Exclude()
  metaTitle?: string;

  @Exclude()
  metaDescription?: string;

  // Relations
  @ApiPropertyOptional({ description: 'Thông tin vai trò' })
  role?: UserRoleResponseDto | null;

  @ApiPropertyOptional({ description: 'Thông tin profile chi tiết' })
  profile?: UserProfileResponseDto | null;

  @ApiPropertyOptional({ description: 'Danh sách tài khoản OAuth' })
  accounts?: UserAccountDto[];

  @ApiPropertyOptional({ description: 'Thống kê hoạt động của người dùng' })
  _count?: UserCountsResponseDto;
}

export class UserMetaResponseDto {
  @ApiProperty({ description: 'Tổng số bản ghi' })
  total: number;

  @ApiProperty({ description: 'Trang hiện tại' })
  page: number;

  @ApiProperty({ description: 'Số bản ghi mỗi trang' })
  limit: number;

  @ApiProperty({ description: 'Tổng số trang' })
  totalPages: number;

  @ApiProperty({ description: 'Có trang tiếp theo' })
  hasNext: boolean;

  @ApiProperty({ description: 'Có trang trước' })
  hasPrevious: boolean;

  @ApiPropertyOptional({ description: 'Từ khóa tìm kiếm đã dùng' })
  search?: string;

  @ApiPropertyOptional({ description: 'Trường sắp xếp đã dùng' })
  sortBy?: string;

  @ApiPropertyOptional({ description: 'Thứ tự sắp xếp đã dùng' })
  sortOrder?: string;
}

export class UserListResponseDto {
  @ApiProperty({
    description: 'Danh sách người dùng',
    type: [UserResponseDto],
    isArray: true,
  })
  data: UserResponseDto[];

  @ApiProperty({ description: 'Thông tin phân trang' })
  meta: UserMetaResponseDto;
}

export class UserStatsResponseDto {
  @ApiProperty({ description: 'Tổng số người dùng' })
  total: number;

  @ApiProperty({ description: 'Số người dùng đang hoạt động' })
  active: number;

  @ApiProperty({ description: 'Số người dùng đã xóa' })
  deleted: number;

  @ApiProperty({ description: 'Số người dùng có vai trò' })
  usersWithRoles: number;

  @ApiProperty({ description: 'Số người dùng không có vai trò' })
  usersWithoutRoles: number;

  @ApiProperty({ description: 'Số người dùng tạo gần đây (30 ngày)' })
  recentUsers: number;

  @ApiPropertyOptional({
    description: 'Thống kê theo vai trò (role_1: 10, role_2: 5)',
    example: { role_1: 10, role_2: 5, no_role: 2 },
  })
  byRole?: Record<string, number>;

  @ApiPropertyOptional({
    description: 'Thống kê theo khoảng thời gian',
    example: { '2024-01': 15, '2024-02': 20 },
  })
  byPeriod?: Record<string, number>;

  @ApiPropertyOptional({
    description: 'Thống kê chi tiết theo vai trò',
    type: 'object',
    additionalProperties: { type: 'number' },
    example: [{ roleId: 1, roleName: 'Admin', userCount: 5 }],
  })
  roleStats?: { roleId: number; roleName: string; userCount: number }[];

  @ApiProperty({ description: 'Thời gian tạo thống kê' })
  createdAt: string;
}

/**
 * Details for bulk operation responses - improved to match role service pattern
 */
class BulkOperationDetailsDto {
  @ApiProperty({ 
    description: 'Danh sách ID đã xử lý thành công',
    example: [1, 2, 3]
  })
  successIds: number[];

  @ApiProperty({ 
    description: 'Danh sách ID bị bỏ qua',
    example: [4, 5]
  })
  skippedIds: number[];

  @ApiPropertyOptional({
    description: 'Mảng chứa thông điệp lỗi chi tiết (nếu có)',
    example: ['User with ID 4 not found', 'User with ID 5 is already deleted'],
  })
  errors?: string[];
}

/**
 * Base DTO for bulk operation responses - enhanced with detailed structure
 */
class BulkOperationResponseDto {
  @ApiProperty({ description: 'Trạng thái thành công', example: true })
  success: boolean;

  @ApiProperty({ description: 'Thông báo kết quả' })
  message: string;

  @ApiProperty({ description: 'Chi tiết kết quả thao tác', type: BulkOperationDetailsDto })
  details: BulkOperationDetailsDto;
}

export class BulkDeleteResponseDto extends BulkOperationResponseDto {
  @ApiProperty({ description: 'Số người dùng đã xóa thành công', example: 10 })
  deletedCount: number;

  @ApiProperty({ description: 'Số người dùng bị bỏ qua', example: 2 })
  skippedCount: number;
}

export class BulkRestoreResponseDto extends BulkOperationResponseDto {
  @ApiProperty({
    description: 'Số người dùng đã khôi phục thành công',
    example: 8,
  })
  restoredCount: number;

  @ApiProperty({ description: 'Số người dùng bị bỏ qua', example: 1 })
  skippedCount: number;
}

export class BulkPermanentDeleteResponseDto extends BulkOperationResponseDto {
  @ApiProperty({
    description: 'Số người dùng đã xóa vĩnh viễn thành công',
    example: 5,
  })
  deletedCount: number;

  @ApiProperty({ description: 'Số người dùng bị bỏ qua', example: 3 })
  skippedCount: number;
}

export class BulkUpdateResponseDto extends BulkOperationResponseDto {
  @ApiProperty({
    description: 'Số người dùng đã cập nhật thành công',
    example: 12,
  })
  updatedCount: number;

  @ApiProperty({ description: 'Số người dùng bị bỏ qua', example: 0 })
  skippedCount: number;
}

export class UserOptionDto {
  @ApiProperty({ description: 'Giá trị option', example: 1 })
  value: number;

  @ApiProperty({ description: 'Nhãn hiển thị', example: 'Nguyễn Văn A (user@example.com)' })
  label: string;
}

export class UserStatsDto {
  @ApiProperty({ description: 'Tổng số người dùng', example: 100 })
  totalUsers: number;

  @ApiProperty({ description: 'Số người dùng đang hoạt động', example: 85 })
  activeUsers: number;

  @ApiProperty({ description: 'Số người dùng đã xóa', example: 15 })
  deletedUsers: number;

  @ApiProperty({ description: 'Số người dùng có vai trò', example: 80 })
  usersWithRoles: number;

  @ApiProperty({ description: 'Số người dùng không có vai trò', example: 5 })
  usersWithoutRoles: number;

  @ApiProperty({ description: 'Số người dùng mới (30 ngày)', example: 12 })
  recentUsers: number;
}

/**
 * DTO for updating user profile
 * Specifically for profile-related fields
 */
export class UpdateProfileDto {
  @ApiPropertyOptional({ description: 'Tên đầy đủ của người dùng' })
  @IsOptional()
  @IsString({ message: 'Tên phải là chuỗi ký tự' })
  @MinLength(2, { message: 'Tên phải có ít nhất 2 ký tự' })
  @MaxLength(100, { message: 'Tên không được vượt quá 100 ký tự' })
  @Transform(({ value }) => value?.trim())
  name?: string;

  @ApiPropertyOptional({ description: 'Email người dùng' })
  @IsOptional()
  @IsEmail({}, { message: 'Email không đúng định dạng' })
  @Transform(({ value }) => value?.toLowerCase().trim())
  email?: string;

  @ApiPropertyOptional({ description: 'URL ảnh đại diện' })
  @IsOptional()
  @IsUrl({}, { message: 'Avatar URL không hợp lệ' })
  avatarUrl?: string;

  @ApiPropertyOptional({ description: 'Bio mô tả' })
  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: 'Bio không được vượt quá 1000 ký tự' })
  @Transform(({ value }) => (value === '' ? null : value))
  bio?: string;

  @ApiPropertyOptional({ description: 'Số điện thoại', example: '0901234567' })
  @IsOptional()
  @IsString({ message: 'Số điện thoại phải là chuỗi ký tự' })
  @Matches(/^[0-9]{10,11}$/, { message: 'Số điện thoại không hợp lệ' })
  @Transform(({ value }) => (value === '' ? null : value))
  phone?: string;

  @ApiPropertyOptional({ description: 'Liên kết mạng xã hội (JSON object)' })
  @IsOptional()
  @IsObject({ message: 'Social links phải là object JSON' })
  socialLinks?: Record<string, any>;
}
