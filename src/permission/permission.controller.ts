import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  NotFoundException,
  UseGuards,
} from '@nestjs/common';
import { PermissionService } from './permission.service';
import {
  CreatePermissionDto,
  UpdatePermissionDto,
  PermissionQueryDto,
} from './dto/permission.dto';
import { AuthGuard } from '../auth/auth.guard';
import { SuperAdminOnly } from '../common/decorators/permissions.decorator';

@Controller('permissions')
@UseGuards(AuthGuard)
@SuperAdminOnly()
export class PermissionController {
  constructor(private readonly permissionService: PermissionService) {}

  @Post()
  async create(@Body() createPermissionDto: CreatePermissionDto) {
    return this.permissionService.create(createPermissionDto);
  }

  @Get()
  async findAll(@Query() query: PermissionQueryDto) {
    return this.permissionService.findAll(query);
  }

  @Get('stats')
  async getStats() {
    return this.permissionService.getStats();
  }

  @Get('options')
  async getOptions() {
    return this.permissionService.getOptions();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const permission = await this.permissionService.findById(id);
    if (!permission) {
      throw new NotFoundException(`Permission with ID ${id} not found`);
    }
    return permission;
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePermissionDto: UpdatePermissionDto,
  ) {
    return this.permissionService.update(id, updatePermissionDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.permissionService.delete(id);
  }

  @Post(':id/restore')
  async restore(@Param('id', ParseIntPipe) id: number) {
    return this.permissionService.restore(id);
  }
}
