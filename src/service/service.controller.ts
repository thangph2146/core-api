import { Controller, Get, Post, Patch, Delete, Param, Body, Query, HttpCode, HttpStatus, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ServiceService } from './service.service';
import { CreateServiceDto, UpdateServiceDto, AdminServiceQueryDto } from './dto/service.dto';
import { CrudPermissions } from '../common/decorators/permissions.decorator';
import { AuthGuard } from '../auth/auth.guard';

@Controller('services')
@UseGuards(AuthGuard)
export class ServiceController {
  constructor(private readonly serviceService: ServiceService) {}

  @Get()
  @CrudPermissions.Services.Read()
  async findAll(@Query() query: AdminServiceQueryDto) {
    return this.serviceService.findAll(query);
  }

  @Get('deleted')
  @CrudPermissions.Services.ViewDeleted()
  async findDeleted(@Query() query: AdminServiceQueryDto) {
    return this.serviceService.findAll({ ...query, deleted: true });
  }

  @Get(':id')
  @CrudPermissions.Services.Read()
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.serviceService.findOne(id);
  }

  @Post()
  @CrudPermissions.Services.Create()
  async create(@Body() createServiceDto: CreateServiceDto) {
    return this.serviceService.create(createServiceDto);
  }

  @Patch(':id')
  @CrudPermissions.Services.Update()
  async update(@Param('id', ParseIntPipe) id: number, @Body() updateServiceDto: UpdateServiceDto) {
    return this.serviceService.update(id, updateServiceDto);
  }

  @Delete(':id')
  @CrudPermissions.Services.Delete()
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.serviceService.remove(id);
  }

  @Post('restore/:id')
  @CrudPermissions.Services.Restore()
  async restore(@Param('id', ParseIntPipe) id: number) {
    return this.serviceService.restore(id);
  }

  @Delete('permanent/:id')
  @CrudPermissions.Services.PermanentDelete()
  async permanentDelete(@Param('id', ParseIntPipe) id: number) {
    return this.serviceService.permanentDelete(id);
  }

  @Post('bulk-delete')
  @CrudPermissions.Services.BulkDelete()
  async bulkDelete(@Body('ids') ids: number[]) {
    return this.serviceService.bulkDelete(ids);
  }

  @Post('bulk-restore')
  @CrudPermissions.Services.BulkRestore()
  async bulkRestore(@Body('ids') ids: number[]) {
    return this.serviceService.bulkRestore(ids);
  }

  @Post('bulk-permanent-delete')
  @CrudPermissions.Services.BulkPermanentDelete()
  async bulkPermanentDelete(@Body('ids') ids: number[]) {
    return this.serviceService.bulkPermanentDelete(ids);
  }
}
