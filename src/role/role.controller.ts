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

@Controller('api/roles')
@UseGuards(AuthGuard)
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Get()
  async findAll(@Query() query: RoleQueryDto) {
    try {
      const result = await this.roleService.findAll(query);
      return {
        success: true,
        data: result.data,
        meta: result.meta,
        message: 'Roles retrieved successfully',
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to retrieve roles',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('stats')
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
  async create(@Body() createRoleDto: CreateRoleDto) {
    try {
      const role = await this.roleService.create(createRoleDto);
      return {
        success: true,
        data: role,
        message: 'Role created successfully',
      };
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new HttpException(
        error.message || 'Failed to create role',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateRoleDto: UpdateRoleDto,
  ) {
    try {
      const role = await this.roleService.update(id, updateRoleDto);
      return {
        success: true,
        data: role,
        message: 'Role updated successfully',
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      throw new HttpException(
        error.message || 'Failed to update role',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    try {
      const role = await this.roleService.delete(id);
      return {
        success: true,
        data: role,
        message: 'Role deleted successfully',
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      throw new HttpException(
        error.message || 'Failed to delete role',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Patch(':id/restore')
  async restore(@Param('id', ParseIntPipe) id: number) {
    try {
      const role = await this.roleService.restore(id);
      return {
        success: true,
        data: role,
        message: 'Role restored successfully',
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      throw new HttpException(
        error.message || 'Failed to restore role',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  @Post('bulk-delete')
  async bulkDelete(@Body() bulkRoleOperationDto: BulkRoleOperationDto) {
    try {
      const result = await this.roleService.bulkDelete(bulkRoleOperationDto.roleIds);
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
      const result = await this.roleService.bulkRestore(bulkRoleOperationDto.roleIds);
      return {
        success: true,
        data: result,
        message: `${result.restoredCount} roles restored successfully`,      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to restore roles',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('bulk-permanent-delete')
  async bulkPermanentDelete(@Body() bulkRoleOperationDto: BulkRoleOperationDto) { 
    try {
      const result = await this.roleService.bulkPermanentDelete(bulkRoleOperationDto.roleIds);
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