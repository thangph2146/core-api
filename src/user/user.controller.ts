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
  HttpCode,
  HttpException,
  ConflictException,
  BadRequestException,
  NotFoundException,
  UsePipes,
} from '@nestjs/common';
import { UserService } from './user.service';
import {
  CreateUserDto,
  UpdateUserDto,
  UserQueryDto,
  BulkUserOperationDto,
} from './dto/user.dto';

@Controller('api/users')
export class UserController {
  constructor(private readonly userService: UserService) {}
  @Get()
  async findAll(@Query() query: UserQueryDto) {
    try {
      const result = await this.userService.findAll(query);
      return {
        success: true,
        data: result.data,
        meta: result.meta,
        message: 'Users retrieved successfully',
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to retrieve users',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  @Get('stats')
  async getUserStats(@Query() query: { deleted?: string }) {
    try {
      const isDeleted = query.deleted === 'true';
      const stats = await this.userService.getUserStats(isDeleted);
      return {
        success: true,
        data: stats,
        message: 'User statistics retrieved successfully',
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to retrieve user statistics',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }  }

  // Bulk operations - placed before parameterized routes to avoid conflicts
  @Delete('bulk-delete')
  @HttpCode(HttpStatus.OK)
  async bulkDelete(@Body() body: BulkUserOperationDto) {
    try {
      console.log('🔍 Bulk Delete - Raw body received:', body);
      console.log('🔍 Bulk Delete - Body type:', typeof body);

      // Manual validation
      if (!body.userIds || !Array.isArray(body.userIds)) {
        throw new BadRequestException('userIds must be an array');
      }

      // Ensure all IDs are strings
      const userIds = body.userIds.map((id) => String(id));
      console.log('🔍 Bulk Delete - Received userIds:', userIds);

      const result = await this.userService.bulkDelete(userIds);
      return {
        success: true,
        data: result,
        message: 'Users deleted successfully',
      };
    } catch (error) {
      console.error('Bulk delete error:', error);
      throw new HttpException(
        error.message || 'Failed to delete users',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Patch('bulk-restore')
  @HttpCode(HttpStatus.OK)
  async bulkRestore(@Body() body: BulkUserOperationDto) {
    try {
      console.log('🔍 Bulk Restore - Raw body received:', body);
      console.log('🔍 Bulk Restore - Body type:', typeof body);

      // Manual validation
      if (!body.userIds || !Array.isArray(body.userIds)) {
        throw new BadRequestException('userIds must be an array');
      }

      // Ensure all IDs are strings
      const userIds = body.userIds.map((id) => String(id));
      console.log('🔍 Bulk Restore - Received userIds:', userIds);

      const result = await this.userService.bulkRestore(userIds);
      return {
        success: true,
        data: result,
        message: 'Users restored successfully',
      };
    } catch (error) {
      console.error('Bulk restore error:', error);
      throw new HttpException(
        error.message || 'Failed to restore users',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete('bulk-permanent-delete')
  @HttpCode(HttpStatus.OK)
  async bulkPermanentDelete(@Body() body: BulkUserOperationDto) {
    try {
      console.log('🔍 Bulk Permanent Delete - Raw body received:', body);
      console.log('🔍 Bulk Permanent Delete - Body type:', typeof body);

      // Manual validation
      if (!body.userIds || !Array.isArray(body.userIds)) {
        throw new BadRequestException('userIds must be an array');
      }

      // Ensure all IDs are strings
      const userIds = body.userIds.map((id) => String(id));
      console.log('🔍 Bulk Permanent Delete - Received userIds:', userIds);

      const result = await this.userService.bulkPermanentDelete(userIds);
      return {
        success: true,
        data: result,
        message: 'Users permanently deleted successfully',
      };
    } catch (error) {
      console.error('Bulk permanent delete error:', error);
      throw new HttpException(
        error.message || 'Failed to permanently delete users',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    try {
      const user = await this.userService.findOne(id);
      return {
        success: true,
        data: user,
        message: 'User retrieved successfully',
      };
    } catch (error) {
      throw new NotFoundException(error.message || 'User not found');
    }
  }

  @Get(':id/detail')
  async findDetailById(@Param('id', ParseIntPipe) id: number) {
    try {
      const user = await this.userService.findDetailById(id);
      return {
        success: true,
        data: user,
        message: 'User details retrieved successfully',
      };
    } catch (error) {
      throw new NotFoundException(error.message || 'User not found');
    }
  }
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createUserDto: CreateUserDto) {
    try {
      const user = await this.userService.create(createUserDto);
      return {
        success: true,
        data: user,
        message: 'User created successfully',
      };
    } catch (error) {
      // Handle specific Prisma errors
      if (error.code === 'P2002') {
        // Unique constraint violation
        const field = error.meta?.target?.[0] || 'field';
        throw new ConflictException(`${field} already exists`);
      }

      // Handle validation errors
      if (error.name === 'ValidationError' || error.status === 400) {
        throw new BadRequestException(error.message || 'Invalid input data');
      }

      // Handle other errors
      throw new HttpException(
        error.message || 'Failed to create user',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    try {
      const user = await this.userService.update(id, updateUserDto);
      return {
        success: true,
        data: user,
        message: 'User updated successfully',
      };
    } catch (error) {
      // Handle specific errors
      if (error.code === 'P2002') {
        throw new ConflictException('Email already exists');
      }
      if (error.code === 'P2025') {
        throw new NotFoundException('User not found');
      }
      throw new BadRequestException(error.message || 'Failed to update user');
    }
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id', ParseIntPipe) id: number) {
    try {
      await this.userService.remove(id);
      return {
        success: true,
        message: 'User deleted successfully',
        data: null,
      };
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('User not found');
      }
      throw new BadRequestException(error.message || 'Failed to delete user');
    }
  }

  @Patch(':id/restore')
  @HttpCode(HttpStatus.OK)
  async restoreUser(@Param('id', ParseIntPipe) id: number) {
    try {
      const user = await this.userService.restore(id);
      return {
        success: true,
        data: user,
        message: 'User restored successfully',
      };
    } catch (error) {
      if (error.message.includes('not found')) {
        throw new NotFoundException('User not found');
      }
      throw new HttpException(
        error.message || 'Failed to restore user',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete(':id/permanent')
  @HttpCode(HttpStatus.OK)
  async permanentDelete(@Param('id', ParseIntPipe) id: number) {
    try {
      await this.userService.permanentDelete(id);
      return {
        success: true,
        message: 'User permanently deleted',
        data: null,
      };
    } catch (error) {
      if (error.message.includes('not found')) {
        throw new NotFoundException('User not found');
      }
      throw new HttpException(
        error.message || 'Failed to permanently delete user',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }  }
}
