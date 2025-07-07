import { Controller, Get, Post, Patch, Delete, Param, Body, Query, HttpCode, HttpStatus, UseGuards, ParseIntPipe } from '@nestjs/common'
import { MediaService } from './media.service'
import { CreateMediaDto, UpdateMediaDto, AdminMediaQueryDto } from './dto/media.dto'
import { CrudPermissions } from '../common/decorators/permissions.decorator'
import { AuthGuard } from '../auth/auth.guard'

@Controller('media')
@UseGuards(AuthGuard)
export class MediaController {
	constructor(private readonly mediaService: MediaService) {}

	@Get()
	@CrudPermissions.Media.Read()
	async findAll(@Query() query: AdminMediaQueryDto) {
		return this.mediaService.findAll({ ...query, deleted: false })
	}

	@Get('deleted')
	@CrudPermissions.Media.Read()
	async findDeleted(@Query() query: AdminMediaQueryDto) {
		return this.mediaService.findAll({ ...query, deleted: true })
	}

	@Get(':id')
	@CrudPermissions.Media.Read()
	async findOne(@Param('id', ParseIntPipe) id: number) {
		return this.mediaService.findOne(id)
	}

	@Post()
	@CrudPermissions.Media.Create()
	async create(@Body() createMediaDto: CreateMediaDto) {
		// uploadedById sẽ lấy từ token thực tế, tạm thời để 0 nếu không có
		return this.mediaService.create(createMediaDto, createMediaDto.uploadedById ?? 0)
	}

	@Patch(':id')
	@CrudPermissions.Media.Update()
	async update(@Param('id', ParseIntPipe) id: number, @Body() updateMediaDto: UpdateMediaDto) {
		return this.mediaService.update(id, updateMediaDto)
	}

	@Delete(':id')
	@CrudPermissions.Media.Delete()
	@HttpCode(HttpStatus.NO_CONTENT)
	async remove(@Param('id', ParseIntPipe) id: number) {
		return this.mediaService.remove(id)
	}

	@Post(':id/restore')
	@CrudPermissions.Media.Restore()
	async restore(@Param('id', ParseIntPipe) id: number) {
		return this.mediaService.restore(id)
	}

	@Delete(':id/permanent')
	@CrudPermissions.Media.PermanentDelete()
	@HttpCode(HttpStatus.NO_CONTENT)
	async permanentDelete(@Param('id', ParseIntPipe) id: number) {
		return this.mediaService.bulkPermanentDelete([id])
	}

	@Post('bulk/delete')
	@CrudPermissions.Media.BulkDelete()
	async bulkDelete(@Body('ids') ids: number[]) {
		return this.mediaService.bulkDelete(ids)
	}

	@Post('bulk/restore')
	@CrudPermissions.Media.BulkRestore()
	async bulkRestore(@Body('ids') ids: number[]) {
		return this.mediaService.bulkRestore(ids)
	}

	@Post('bulk/permanent-delete')
	@CrudPermissions.Media.BulkPermanentDelete()
	async bulkPermanentDelete(@Body('ids') ids: number[]) {
		return this.mediaService.bulkPermanentDelete(ids)
	}
} 