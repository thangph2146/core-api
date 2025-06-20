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
import { RequirePermissions } from '../common/decorators/roles.decorator';

@Controller('api/permissions')
@UseGuards(AuthGuard)
export class PermissionController {
  constructor(private readonly permissionService: PermissionService) {}

  @Post()
  @RequirePermissions('permissions.create', 'system.manage')
  async create(@Body() createPermissionDto: CreatePermissionDto) {
    return this.permissionService.create(createPermissionDto);
  }

  @Get()
  @RequirePermissions('permissions.read')
  async findAll(@Query() query: PermissionQueryDto) {
    return this.permissionService.findAll(query);
  }

  @Get('stats')
  @RequirePermissions('permissions.read', 'system.analytics')
  async getStats() {
    return this.permissionService.getStats();
  }

  @Get(':id')
  @RequirePermissions('permissions.read')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const permission = await this.permissionService.findById(id);
    if (!permission) {
      throw new NotFoundException(`Permission with ID ${id} not found`);
    }
    return permission;
  }

  @Patch(':id')
  @RequirePermissions('permissions.update')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePermissionDto: UpdatePermissionDto,
  ) {
    return this.permissionService.update(id, updatePermissionDto);
  }

  @Delete(':id')
  @RequirePermissions('permissions.delete', 'system.manage')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.permissionService.delete(id);
  }

  @Post(':id/restore')
  @RequirePermissions('permissions.restore', 'system.manage')
  async restore(@Param('id', ParseIntPipe) id: number) {
    return this.permissionService.restore(id);
  }
}
