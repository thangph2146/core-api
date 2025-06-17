/**
 * Script để tạo user mẫu cho testing
 * Chạy: npm run seed:user
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createSampleUser() {
  try {
    // Kiểm tra xem user đã tồn tại chưa
    const existingUser = await prisma.user.findUnique({
      where: { email: 'thang.ph2146@gmail.com' },
    });

    if (existingUser) {
      console.log('User already exists with email: thang.ph2146@gmail.com');
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('RachelCu.26112020', 12);

    // Tạo role admin nếu chưa có
    let adminRole = await prisma.role.findUnique({
      where: { name: 'admin' },
    });

    if (!adminRole) {
      adminRole = await prisma.role.create({
        data: {
          name: 'admin',
          description: 'Administrator role with full access',
        },
      });
      console.log('Created admin role');
    }

    // Tạo user
    const user = await prisma.user.create({
      data: {
        email: 'thang.ph2146@gmail.com',
        name: 'Thang Pham',
        hashedPassword,
        roleId: adminRole.id,
        emailVerified: new Date(),
      },
      include: {
        role: true,
      },
    });

    console.log('Successfully created user:', {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role?.name,
    });

  } catch (error) {
    console.error('Error creating user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createSampleUser();
