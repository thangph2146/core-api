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
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { StatusService } from './status.service';
import {
  CrudPermissions,
  Public,
} from '../common/decorators/permissions.decorator';
import {
  CreateStatusDto,
  UpdateStatusDto,
  AdminStatusQueryDto,
  StatusQueryDto,
} from './dto/status.dto';
import { AuthGuard } from '../auth/auth.guard';

@Controller('statuses')
@UseGuards(AuthGuard)
export class StatusController {
  constructor(private readonly statusService: StatusService) {}

  // =================================================================================
  // PUBLIC ENDPOINTS
  // =================================================================================

  @Get()
  @Public()
  async findAll(@Query() query: StatusQueryDto) {
    return this.statusService.findAll(query);
  }

  @Get('options')
  @Public()
  async getOptions(@Query('type') type?: string) {
    return this.statusService.getOptions(type);
  }

  @Get(':id')
  @Public()
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.statusService.findOne(id);
  }

  // =================================================================================
  // ADMIN ENDPOINTS
  // =================================================================================

  @Get('deleted')
  @CrudPermissions.Status.ViewDeleted()
  async findDeleted(@Query() query: AdminStatusQueryDto) {
    return this.statusService.findAllAdmin({ ...query, showDeleted: true });
  }

  @Get('admin')
  @CrudPermissions.Status.Read()
  async findAllAdmin(@Query() query: AdminStatusQueryDto) {
    return this.statusService.findAllAdmin(query);
  }

  @Get('admin/:id')
  @CrudPermissions.Status.Read()
  async findOneAdmin(@Param('id', ParseIntPipe) id: number) {
    return this.statusService.findOneAdmin(id);
  }

  @Post()
  @CrudPermissions.Status.Create()
  async create(@Body() createStatusDto: CreateStatusDto) {
    return this.statusService.create(createStatusDto);
  }

  @Patch(':id')
  @CrudPermissions.Status.Update()
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateStatusDto: UpdateStatusDto,
  ) {
    return this.statusService.update(id, updateStatusDto);
  }

  @Delete(':id')
  @CrudPermissions.Status.Delete()
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.statusService.remove(id);
  }

  @Patch(':id/restore')
  @CrudPermissions.Status.Restore()
  async restore(@Param('id', ParseIntPipe) id: number) {
    return this.statusService.restore(id);
  }

  @Delete('permanent/:id')
  @CrudPermissions.Status.PermanentDelete()
  async permanentDelete(@Param('id', ParseIntPipe) id: number) {
    return this.statusService.permanentDelete(id);
  }

  // =================================================================================
  // BULK ENDPOINTS
  // =================================================================================

  @Post('bulk-delete')
  @CrudPermissions.Status.BulkDelete()
  async bulkDelete(@Body('ids') ids: number[]) {
    return this.statusService.bulkDelete(ids);
  }

  @Post('bulk-restore')
  @CrudPermissions.Status.BulkRestore()
  async bulkRestore(@Body('ids') ids: number[]) {
    return this.statusService.bulkRestore(ids);
  }

  @Post('bulk-permanent-delete')
  @CrudPermissions.Status.BulkPermanentDelete()
  async bulkPermanentDelete(@Body('ids') ids: number[]) {
    return this.statusService.bulkPermanentDelete(ids);
  }
}
