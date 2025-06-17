import { Controller, Get, UseGuards } from '@nestjs/common';
import { RoleService } from './role.service';
import { AuthGuard } from '../auth/auth.guard';

export interface RoleOption {
  value: number;
  label: string;
}

@Controller('api/roles')
@UseGuards(AuthGuard)
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Get()
  async getAllRoles() {
    return this.roleService.findAll();
  }
  @Get('options')
  async getRoleOptions(): Promise<{
    success: boolean;
    data: RoleOption[];
    message: string;
  }> {
    try {
      const options = await this.roleService.getRoleOptions();
      return {
        success: true,
        data: options,
        message: 'Role options retrieved successfully',
      };
    } catch (error) {
      return {
        success: false,
        data: [],
        message: error.message || 'Failed to retrieve role options',
      };
    }
  }
}
