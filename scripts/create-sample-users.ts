import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createSampleUsers() {
  try {
    console.log('🚀 Creating sample users...');

    // First, let's make sure we have roles
    const adminRole = await prisma.role.upsert({
      where: { name: 'Admin' },
      update: {},
      create: {
        name: 'Admin',
        description: 'Administrator with full system access',
      },
    });

    const editorRole = await prisma.role.upsert({
      where: { name: 'Editor' },
      update: {},
      create: {
        name: 'Editor',
        description: 'Content editor with publishing permissions',
      },
    });

    const userRole = await prisma.role.upsert({
      where: { name: 'User' },
      update: {},
      create: {
        name: 'User',
        description: 'Regular user with basic permissions',
      },
    });

    // Create sample users
    const hashedPassword = await bcrypt.hash('password123', 12);

    const users = [
      {
        email: 'admin@example.com',
        name: 'Admin User',
        hashedPassword,
        roleId: adminRole.id,
        emailVerified: new Date(),
        avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      },
      {
        email: 'editor@example.com',
        name: 'Editor User',
        hashedPassword,
        roleId: editorRole.id,
        emailVerified: new Date(),
        avatarUrl: 'https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=150&h=150&fit=crop&crop=face',
      },
      {
        email: 'john.doe@example.com',
        name: 'John Doe',
        hashedPassword,
        roleId: userRole.id,
        emailVerified: new Date(),
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      },
      {
        email: 'jane.smith@example.com',
        name: 'Jane Smith',
        hashedPassword,
        roleId: userRole.id,
        emailVerified: null, // Unverified user
        avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
      },
      {
        email: 'bob.wilson@example.com',
        name: 'Bob Wilson',
        hashedPassword,
        roleId: editorRole.id,
        emailVerified: new Date(),
        avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
      },
      {
        email: 'alice.brown@example.com',
        name: 'Alice Brown',
        hashedPassword,
        roleId: userRole.id,
        emailVerified: new Date(),
        avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face',
      },
      {
        email: 'charlie.davis@example.com',
        name: 'Charlie Davis',
        hashedPassword,
        roleId: userRole.id,
        emailVerified: null, // Unverified user
      },
      {
        email: 'diana.miller@example.com',
        name: 'Diana Miller',
        hashedPassword,
        roleId: userRole.id,
        emailVerified: new Date(),
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face',
      },
      {
        email: 'edward.jones@example.com',
        name: 'Edward Jones',
        hashedPassword,
        roleId: userRole.id,
        emailVerified: new Date(),
      },
      {
        email: 'fiona.garcia@example.com',
        name: 'Fiona Garcia',
        hashedPassword,
        roleId: userRole.id,
        emailVerified: null, // Unverified user
        avatarUrl: 'https://images.unsplash.com/photo-1550525811-e5869dd03032?w=150&h=150&fit=crop&crop=face',
      },
    ];

    for (const userData of users) {
      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email },
      });

      if (!existingUser) {
        const user = await prisma.user.create({
          data: userData,
        });

        // Create user profile for some users
        if (Math.random() > 0.3) { // 70% chance
          await prisma.userProfile.create({
            data: {
              userId: user.id,
              bio: `This is a sample bio for ${user.name}. Lorem ipsum dolor sit amet, consectetur adipiscing elit.`,
              avatarUrl: userData.avatarUrl,
              socialLinks: {
                website: `https://${user.name?.toLowerCase().replace(' ', '')}.dev`,
                github: `https://github.com/${user.name?.toLowerCase().replace(' ', '')}`,
                twitter: `https://twitter.com/${user.name?.toLowerCase().replace(' ', '')}`,
                linkedin: `https://linkedin.com/in/${user.name?.toLowerCase().replace(' ', '')}`,
              },
            },
          });
        }

        console.log(`✅ Created user: ${user.email}`);
      } else {
        console.log(`⏭️  User already exists: ${userData.email}`);
      }
    }

    console.log('🎉 Sample users created successfully!');
  } catch (error) {
    console.error('❌ Error creating sample users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createSampleUsers();
