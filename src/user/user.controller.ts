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
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto, UpdateUserDto, UserQueryDto } from './dto/user.dto';

@Controller('users')
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
      return {
        success: false,
        message: error.message || 'Failed to retrieve users',
        data: null,
      };
    }
  }
  @Get('stats')
  async getUserStats() {
    try {
      const stats = await this.userService.getUserStats();
      return {
        success: true,
        data: stats,
        message: 'User statistics retrieved successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to retrieve user statistics',
        data: null,
      };
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
      return {
        success: false,
        message: error.message || 'Failed to retrieve user',
        data: null,
      };
    }
  }

  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    try {
      const user = await this.userService.create(createUserDto);
      return {
        success: true,
        data: user,
        message: 'User created successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to create user',
        data: null,
      };
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
      return {
        success: false,
        message: error.message || 'Failed to update user',
        data: null,
      };
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
      return {
        success: false,
        message: error.message || 'Failed to delete user',
        data: null,
      };
    }
  }

  @Patch(':id/restore')
  async restore(@Param('id', ParseIntPipe) id: number) {
    try {
      const user = await this.userService.restore(id);
      return {
        success: true,
        data: user,
        message: 'User restored successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to restore user',
        data: null,
      };
    }
  }

  @Delete(':id/hard')
  @HttpCode(HttpStatus.OK)
  async hardDelete(@Param('id', ParseIntPipe) id: number) {
    try {
      await this.userService.hardDelete(id);
      return {
        success: true,
        message: 'User permanently deleted',
        data: null,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to permanently delete user',
        data: null,
      };
    }
  }
}
