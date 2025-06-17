import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createSampleRoles() {
  try {
    console.log('Creating sample roles...');

    // Check if roles already exist
    const existingRoles = await prisma.role.findMany();
    if (existingRoles.length > 0) {
      console.log('Roles already exist, skipping creation.');
      return;
    }

    // Create permissions first
    const permissions = await Promise.all([
      prisma.permission.upsert({
        where: { name: 'read_users' },
        update: {},
        create: {
          name: 'read_users',
          description: 'Can view users',
        },
      }),
      prisma.permission.upsert({
        where: { name: 'write_users' },
        update: {},
        create: {
          name: 'write_users',
          description: 'Can create and update users',
        },
      }),
      prisma.permission.upsert({
        where: { name: 'delete_users' },
        update: {},
        create: {
          name: 'delete_users',
          description: 'Can delete users',
        },
      }),
      prisma.permission.upsert({
        where: { name: 'read_blogs' },
        update: {},
        create: {
          name: 'read_blogs',
          description: 'Can view blogs',
        },
      }),
      prisma.permission.upsert({
        where: { name: 'write_blogs' },
        update: {},
        create: {
          name: 'write_blogs',
          description: 'Can create and update blogs',
        },
      }),
      prisma.permission.upsert({
        where: { name: 'delete_blogs' },
        update: {},
        create: {
          name: 'delete_blogs',
          description: 'Can delete blogs',
        },
      }),
    ]);

    console.log('Created permissions:', permissions.length);

    // Create roles
    const adminRole = await prisma.role.create({
      data: {
        name: 'Admin',
        description: 'Full system access',
        permissions: {
          connect: permissions.map(p => ({ id: p.id })),
        },
      },
    });

    const editorRole = await prisma.role.create({
      data: {
        name: 'Editor',
        description: 'Can manage content',
        permissions: {
          connect: [
            { id: permissions.find(p => p.name === 'read_blogs')!.id },
            { id: permissions.find(p => p.name === 'write_blogs')!.id },
          ],
        },
      },
    });

    const userRole = await prisma.role.create({
      data: {
        name: 'User',
        description: 'Basic user access',
        permissions: {
          connect: [
            { id: permissions.find(p => p.name === 'read_blogs')!.id },
          ],
        },
      },
    });

    console.log('Created roles:');
    console.log('- Admin:', adminRole.id);
    console.log('- Editor:', editorRole.id);
    console.log('- User:', userRole.id);

    console.log('Sample roles created successfully!');
  } catch (error) {
    console.error('Error creating sample roles:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  createSampleRoles();
}

export { createSampleRoles };
