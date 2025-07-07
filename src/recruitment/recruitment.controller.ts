import { Controller, Get, Post, Patch, Delete, Param, Body, Query, HttpCode, HttpStatus, UseGuards, ParseIntPipe, Request } from '@nestjs/common';
import { RecruitmentService } from './recruitment.service';
import { CreateRecruitmentDto, UpdateRecruitmentDto, AdminRecruitmentQueryDto } from './dto/recruitment.dto';
import { CrudPermissions } from '../common/decorators/permissions.decorator';
import { AuthGuard } from '../auth/auth.guard';

@Controller('recruitments')
@UseGuards(AuthGuard)
export class RecruitmentController {
  constructor(private readonly recruitmentService: RecruitmentService) {}

  @Get()
  @CrudPermissions.Recruitment.Read()
  async findAll(@Query() query: AdminRecruitmentQueryDto) {
    return this.recruitmentService.findAll(query);
  }

  @Get('deleted')
  @CrudPermissions.Recruitment.Read()
  async findDeleted(@Query() query: AdminRecruitmentQueryDto) {
    return this.recruitmentService.findAll({ ...query, deleted: true });
  }

  @Get(':id')
  @CrudPermissions.Recruitment.Read()
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.recruitmentService.findOne(id);
  }

  @Post()
  @CrudPermissions.Recruitment.Create()
  async create(@Body() createRecruitmentDto: CreateRecruitmentDto, @Request() req: any) {
    return this.recruitmentService.create({ ...createRecruitmentDto, authorId: req.user?.id || 0 });
  }

  @Patch(':id')
  @CrudPermissions.Recruitment.Update()
  async update(@Param('id', ParseIntPipe) id: number, @Body() updateRecruitmentDto: UpdateRecruitmentDto) {
    return this.recruitmentService.update(id, updateRecruitmentDto);
  }

  @Delete(':id')
  @CrudPermissions.Recruitment.Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.recruitmentService.remove(id);
  }

  @Post(':id/restore')
  @CrudPermissions.Recruitment.Restore()
  async restore(@Param('id', ParseIntPipe) id: number) {
    return this.recruitmentService.restore(id);
  }

  @Delete(':id/permanent')
  @CrudPermissions.Recruitment.PermanentDelete()
  @HttpCode(HttpStatus.NO_CONTENT)
  async permanentDelete(@Param('id', ParseIntPipe) id: number) {
    return this.recruitmentService.bulkPermanentDelete([id]);
  }

  @Post('bulk/delete')
  @CrudPermissions.Recruitment.BulkDelete()
  async bulkDelete(@Body('ids') ids: number[]) {
    return this.recruitmentService.bulkDelete(ids);
  }

  @Post('bulk/restore')
  @CrudPermissions.Recruitment.BulkRestore()
  async bulkRestore(@Body('ids') ids: number[]) {
    return this.recruitmentService.bulkRestore(ids);
  }

  @Post('bulk/permanent-delete')
  @CrudPermissions.Recruitment.BulkPermanentDelete()
  async bulkPermanentDelete(@Body('ids') ids: number[]) {
    return this.recruitmentService.bulkPermanentDelete(ids);
  }
}
