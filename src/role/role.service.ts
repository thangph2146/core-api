import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role, Prisma } from '@prisma/client';

export interface RoleOption {
  value: number;
  label: string;
}

@Injectable()
export class RoleService {
  constructor(private prisma: PrismaService) {}

  async findAll(): Promise<Role[]> {
    return this.prisma.role.findMany({
      where: {
        deletedAt: null,
      },
      orderBy: {
        name: 'asc',
      },
      include: {
        permissions: {
          where: {
            deletedAt: null,
          },
        },
        _count: {
          select: {
            users: true,
          },
        },
      },
    });
  }

  async findById(id: number): Promise<Role | null> {
    return this.prisma.role.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        permissions: {
          where: {
            deletedAt: null,
          },
        },
      },
    });
  }
  async getRoleOptions(): Promise<RoleOption[]> {
    try {
      const roles = await this.prisma.role.findMany({
        where: {
          deletedAt: null,
        },
        select: {
          id: true,
          name: true,
        },
        orderBy: {
          name: 'asc',
        },
      });

      // Always return an array, even if empty
      return roles.map((role) => ({
        value: role.id,
        label: role.name,
      }));
    } catch (error) {
      console.error('Error fetching role options:', error);
      // Return empty array instead of throwing
      return [];
    }
  }

  async create(data: Prisma.RoleCreateInput): Promise<Role> {
    return this.prisma.role.create({
      data,
    });
  }

  async update(id: number, data: Prisma.RoleUpdateInput): Promise<Role> {
    return this.prisma.role.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
  }

  async delete(id: number): Promise<Role> {
    return this.prisma.role.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  }
}
