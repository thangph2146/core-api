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
  HttpStatus,
  HttpException,
  ConflictException,
  NotFoundException,
  UseGuards,
} from '@nestjs/common';
import { RoleService } from './role.service';
import {
  CreateRoleDto,
  UpdateRoleDto,
  RoleQueryDto,
  BulkRoleOperationDto,
} from './dto/role.dto';
import { AuthGuard } from '../auth/auth.guard';
import {
  RoleManagement,
  SuperAdminOnly,
  RequirePermissions,
} from '../common/decorators/roles.decorator';

@Controller('api/roles')
@UseGuards(AuthGuard)
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Get()
  @RoleManagement.Read()
  async findAll(@Query() query: RoleQueryDto) {
    try {
      const result = await this.roleService.findAll(query);
      return {
        success: true,
        data: result.data,
        meta: result.meta,
        message: 'Danh sách vai trò được tải thành công',
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Không thể tải danh sách vai trò',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('stats')
  @RoleManagement.Read()
  async getRoleStats(@Query() query: { deleted?: string }) {
    try {
      const isDeleted = query.deleted === 'true';
      const stats = await this.roleService.getRoleStats(isDeleted);
      return {
        success: true,
        data: stats,
        message: 'Role statistics retrieved successfully',
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to retrieve role statistics',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('options')
  async getRoleOptions() {
    try {
      const options = await this.roleService.getRoleOptions();
      return {
        success: true,
        data: options,
        message: 'Role options retrieved successfully',
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to retrieve role options',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    try {
      const role = await this.roleService.findById(id);
      if (!role) {
        throw new NotFoundException('Role not found');
      }
      return {
        success: true,
        data: role,
        message: 'Role retrieved successfully',
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to retrieve role',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  @Post()
  @RoleManagement.Create()
  async create(@Body() createRoleDto: CreateRoleDto) {
    try {
      const role = await this.roleService.create(createRoleDto);
      return {
        success: true,
        data: role,
        message: `Vai trò "${role.name}" đã được tạo thành công`,
      };
    } catch (error) {
      if (error instanceof ConflictException) {
        throw new ConflictException(
          `Vai trò với tên "${createRoleDto.name}" đã tồn tại`,
        );
      }
      throw new HttpException(
        error.message || 'Không thể tạo vai trò',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  @Patch(':id')
  @RoleManagement.Update()
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateRoleDto: UpdateRoleDto,
  ) {
    try {
      const role = await this.roleService.update(id, updateRoleDto);
      return {
        success: true,
        data: role,
        message: `Vai trò "${role.name}" đã được cập nhật thành công`,
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      throw new HttpException(
        error.message || 'Không thể cập nhật vai trò',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  @Delete(':id')
  @RoleManagement.Delete()
  async remove(@Param('id', ParseIntPipe) id: number) {
    try {
      const role = await this.roleService.delete(id);
      return {
        success: true,
        data: role,
        message: `Vai trò "${role.name}" đã được xóa thành công`,
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      throw new HttpException(
        error.message || 'Không thể xóa vai trò',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  @Patch(':id/restore')
  @RoleManagement.Update()
  async restore(@Param('id', ParseIntPipe) id: number) {
    try {
      const role = await this.roleService.restore(id);
      return {
        success: true,
        data: role,
        message: `Vai trò "${role.name}" đã được khôi phục thành công`,
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      throw new HttpException(
        error.message || 'Không thể khôi phục vai trò',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  @Post('bulk-delete')
  async bulkDelete(@Body() bulkRoleOperationDto: BulkRoleOperationDto) {
    try {
      const result = await this.roleService.bulkDelete(
        bulkRoleOperationDto.roleIds,
      );
      return {
        success: true,
        data: result,
        message: `${result.deletedCount} roles deleted successfully`,
      };
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new HttpException(
        error.message || 'Failed to delete roles',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('bulk-restore')
  async bulkRestore(@Body() bulkRoleOperationDto: BulkRoleOperationDto) {
    try {
      const result = await this.roleService.bulkRestore(
        bulkRoleOperationDto.roleIds,
      );
      return {
        success: true,
        data: result,
        message: `${result.restoredCount} roles restored successfully`,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to restore roles',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('bulk-permanent-delete')
  async bulkPermanentDelete(
    @Body() bulkRoleOperationDto: BulkRoleOperationDto,
  ) {
    try {
      const result = await this.roleService.bulkPermanentDelete(
        bulkRoleOperationDto.roleIds,
      );
      return {
        success: true,
        data: result,
        message: `${result.deletedCount} roles permanently deleted successfully`,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to permanently delete roles',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
