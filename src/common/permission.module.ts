import { Module, Global } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ResourceOwnershipService } from './services/resource-ownership.service';
import { PermissionManagementService } from './services/permission-management.service';
import { 
  PermissionController, 
  RolePermissionController, 
  UserPermissionController 
} from './controllers/permission.controller';
import { RolesGuard, ResourceOwnershipGuard } from './guards/enhanced-roles.guard';

@Global()
@Module({
  imports: [PrismaModule],
  providers: [
    ResourceOwnershipService,
    PermissionManagementService,
    RolesGuard,
    ResourceOwnershipGuard,
  ],
  controllers: [
    PermissionController,
    RolePermissionController,
    UserPermissionController,
  ],
  exports: [
    ResourceOwnershipService,
    PermissionManagementService,
    RolesGuard,
    ResourceOwnershipGuard,
  ],
})
export class PermissionModule {}
