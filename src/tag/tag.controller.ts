import {
	Controller,
	Get,
	Post,
	Patch,
	Delete,
	Param,
	Query,
	Body,
	ParseIntPipe,
	UseGuards,
	HttpCode,
	HttpStatus,
} from '@nestjs/common'
import {
	ApiTags,
	ApiOperation,
	ApiResponse,
	ApiBearerAuth,
	ApiParam,
} from '@nestjs/swagger'
import { TagService } from './tag.service'
import {
	Public,
	CrudPermissions,
} from '../common/decorators/permissions.decorator'
import {
	CreateTagDto,
	UpdateTagDto,
	TagQueryDto,
	BulkTagOperationDto,
	BulkDeleteResponseDto,
	BulkRestoreResponseDto,
	BulkPermanentDeleteResponseDto,
	TagListResponseDto,
	TagResponseDto,
	TagStatsDto,
	TagOptionDto,
} from './dto/tag.dto'
import { AuthGuard } from '../auth/auth.guard'

@ApiTags('Tags')
@ApiBearerAuth()
@Controller('tags')
export class TagController {
	constructor(private readonly tagService: TagService) {}

	// =============================================================================
	// MAIN ENDPOINTS
	// =============================================================================

	@Get()
	@UseGuards(AuthGuard)
	@CrudPermissions.Tags.Read()
	@ApiOperation({
		summary: 'Lấy danh sách thẻ (Admin)',
		description: 'Lấy danh sách tất cả thẻ với quyền admin, bao gồm cả thẻ đã xóa',
	})
	@ApiResponse({
		status: 200,
		description: 'Danh sách thẻ',
		type: TagListResponseDto,
	})
	async findAll(@Query() query: TagQueryDto): Promise<TagListResponseDto> {
		return this.tagService.findAll(query)
	}

	@Get('public')
	@Public()
	@ApiOperation({
		summary: 'Lấy danh sách thẻ công khai',
		description: 'Lấy danh sách thẻ cho người dùng công khai',
	})
	@ApiResponse({
		status: 200,
		description: 'Danh sách thẻ công khai',
		type: TagListResponseDto,
	})
	async findPublic(@Query() query: TagQueryDto): Promise<TagListResponseDto> {
		return this.tagService.findPublic(query)
	}

	@Get('deleted')
	@UseGuards(AuthGuard)
	@CrudPermissions.Tags.Read()
	@ApiOperation({
		summary: 'Lấy danh sách thẻ đã xóa',
		description: 'Lấy danh sách thẻ đã bị xóa mềm',
	})
	@ApiResponse({
		status: 200,
		description: 'Danh sách thẻ đã xóa',
		type: TagListResponseDto,
	})
	async findDeleted(@Query() query: TagQueryDto): Promise<TagListResponseDto> {
		const deletedQuery = { ...query, deleted: true }
		return this.tagService.findAll(deletedQuery)
	}

	@Get('stats')
	@UseGuards(AuthGuard)
	@CrudPermissions.Tags.Read()
	@ApiOperation({
		summary: 'Lấy thống kê thẻ',
		description: 'Lấy thống kê tổng quan về thẻ trong hệ thống',
	})
	@ApiResponse({
		status: 200,
		description: 'Thống kê thẻ',
		type: TagStatsDto,
	})
	async getStats(): Promise<TagStatsDto> {
		return this.tagService.getStats()
	}

	@Get('options')
	@UseGuards(AuthGuard)
	@CrudPermissions.Tags.Read()
	@ApiOperation({
		summary: 'Lấy danh sách tùy chọn thẻ',
		description: 'Lấy danh sách thẻ dạng tùy chọn cho dropdown/select',
	})
	@ApiResponse({
		status: 200,
		description: 'Danh sách tùy chọn thẻ',
		type: [TagOptionDto],
	})
	async getOptions(): Promise<TagOptionDto[]> {
		return this.tagService.getOptions()
	}

	// =============================================================================
	// BULK OPERATIONS
	// =============================================================================

	@Post('bulk/delete')
	@HttpCode(HttpStatus.OK)
	@UseGuards(AuthGuard)
	@CrudPermissions.Tags.BulkDelete()
	@ApiOperation({
		summary: 'Xóa mềm nhiều thẻ',
		description: 'Xóa mềm nhiều thẻ cùng lúc',
	})
	@ApiResponse({
		status: 200,
		description: 'Xóa thành công',
		type: BulkDeleteResponseDto,
	})
	async bulkDelete(@Body() body: BulkTagOperationDto): Promise<BulkDeleteResponseDto> {
		return this.tagService.bulkDelete(body.tagIds)
	}

	@Post('bulk/restore')
	@HttpCode(HttpStatus.OK)
	@UseGuards(AuthGuard)
	@CrudPermissions.Tags.BulkRestore()
	@ApiOperation({
		summary: 'Khôi phục nhiều thẻ',
		description: 'Khôi phục nhiều thẻ đã bị xóa mềm',
	})
	@ApiResponse({
		status: 200,
		description: 'Khôi phục thành công',
		type: BulkRestoreResponseDto,
	})
	async bulkRestore(@Body() body: BulkTagOperationDto): Promise<BulkRestoreResponseDto> {
		return this.tagService.bulkRestore(body.tagIds)
	}

	@Post('bulk/permanent-delete')
	@HttpCode(HttpStatus.OK)
	@UseGuards(AuthGuard)
	@CrudPermissions.Tags.BulkPermanentDelete()
	@ApiOperation({
		summary: 'Xóa vĩnh viễn nhiều thẻ',
		description: 'Xóa vĩnh viễn nhiều thẻ khỏi hệ thống',
	})
	@ApiResponse({
		status: 200,
		description: 'Xóa vĩnh viễn thành công',
		type: BulkPermanentDeleteResponseDto,
	})
	async bulkPermanentDelete(@Body() body: BulkTagOperationDto): Promise<BulkPermanentDeleteResponseDto> {
		return this.tagService.bulkPermanentDelete(body.tagIds)
	}

	// =============================================================================
	// INDIVIDUAL OPERATIONS
	// =============================================================================

	@Get(':id')
	@UseGuards(AuthGuard)
	@CrudPermissions.Tags.Read()
	@ApiOperation({
		summary: 'Lấy thông tin thẻ theo ID',
		description: 'Lấy thông tin chi tiết của một thẻ theo ID',
	})
	@ApiParam({ name: 'id', description: 'ID thẻ', type: Number })
	@ApiResponse({
		status: 200,
		description: 'Thông tin thẻ',
		type: TagResponseDto,
	})
	@ApiResponse({ status: 404, description: 'Không tìm thấy thẻ' })
	async findOne(@Param('id', ParseIntPipe) id: number): Promise<TagResponseDto> {
		return this.tagService.findOne(id) as any
	}

	@Post()
	@UseGuards(AuthGuard)
	@CrudPermissions.Tags.Create()
	@ApiOperation({
		summary: 'Tạo thẻ mới',
		description: 'Tạo một thẻ mới trong hệ thống',
	})
	@ApiResponse({
		status: 201,
		description: 'Tạo thẻ thành công',
		type: TagResponseDto,
	})
	@ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
	@ApiResponse({ status: 409, description: 'Tên hoặc slug đã tồn tại' })
	async create(@Body() createTagDto: CreateTagDto): Promise<TagResponseDto> {
		return this.tagService.create(createTagDto) as any
	}

	@Patch(':id')
	@UseGuards(AuthGuard)
	@CrudPermissions.Tags.Update()
	@ApiOperation({
		summary: 'Cập nhật thông tin thẻ',
		description: 'Cập nhật thông tin của một thẻ',
	})
	@ApiParam({ name: 'id', description: 'ID thẻ', type: Number })
	@ApiResponse({
		status: 200,
		description: 'Cập nhật thành công',
		type: TagResponseDto,
	})
	@ApiResponse({ status: 404, description: 'Không tìm thấy thẻ' })
	async update(
		@Param('id', ParseIntPipe) id: number,
		@Body() updateTagDto: UpdateTagDto,
	): Promise<TagResponseDto> {
		return this.tagService.update(id, updateTagDto) as any
	}

	@Delete(':id')
	@UseGuards(AuthGuard)
	@CrudPermissions.Tags.Delete()
	@ApiOperation({
		summary: 'Xóa mềm thẻ',
		description: 'Xóa mềm một thẻ (có thể khôi phục)',
	})
	@ApiParam({ name: 'id', description: 'ID thẻ', type: Number })
	@ApiResponse({ status: 200, description: 'Xóa thành công' })
	@ApiResponse({ status: 404, description: 'Không tìm thấy thẻ' })
	async remove(@Param('id', ParseIntPipe) id: number): Promise<{ message: string }> {
		await this.tagService.remove(id)
		return { message: 'Tag deleted successfully' }
	}

	@Post(':id/restore')
	@HttpCode(HttpStatus.OK)
	@UseGuards(AuthGuard)
	@CrudPermissions.Tags.Restore()
	@ApiOperation({
		summary: 'Khôi phục thẻ',
		description: 'Khôi phục một thẻ đã bị xóa mềm',
	})
	@ApiParam({ name: 'id', description: 'ID thẻ', type: Number })
	@ApiResponse({
		status: 200,
		description: 'Khôi phục thành công',
		type: TagResponseDto,
	})
	@ApiResponse({ status: 404, description: 'Không tìm thấy thẻ' })
	async restore(@Param('id', ParseIntPipe) id: number): Promise<TagResponseDto> {
		return this.tagService.restore(id) as any
	}

	@Delete(':id/permanent')
	@UseGuards(AuthGuard)
	@CrudPermissions.Tags.PermanentDelete()
	@ApiOperation({
		summary: 'Xóa vĩnh viễn thẻ',
		description: 'Xóa vĩnh viễn một thẻ khỏi hệ thống',
	})
	@ApiParam({ name: 'id', description: 'ID thẻ', type: Number })
	@ApiResponse({ status: 200, description: 'Xóa vĩnh viễn thành công' })
	@ApiResponse({ status: 404, description: 'Không tìm thấy thẻ' })
	async permanentDelete(@Param('id', ParseIntPipe) id: number): Promise<{ message: string }> {
		await this.tagService.permanentDelete(id)
		return { message: 'Tag permanently deleted successfully' }
	}
}
