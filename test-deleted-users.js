// Simple test script to check deleted users in the database
const { PrismaClient } = require('@prisma/client');

async function testDeletedUsers() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Testing deleted users query...');
    
    // Test 1: Direct query for deleted users
    const deletedUsers = await prisma.user.findMany({
      where: {
        deletedAt: { not: null }
      },
      select: {
        id: true,
        email: true,
        name: true,
        deletedAt: true,
      },
      take: 10
    });
    
    console.log(`📊 Found ${deletedUsers.length} deleted users:`);
    deletedUsers.forEach(user => {
      console.log(`  - ID: ${user.id}, Email: ${user.email}, DeletedAt: ${user.deletedAt}`);
    });
    
    // Test 2: Count all users with deletedAt
    const deletedCount = await prisma.user.count({
      where: {
        deletedAt: { not: null }
      }
    });
    
    console.log(`📈 Total deleted users count: ${deletedCount}`);
    
    // Test 3: Check data types
    if (deletedUsers.length > 0) {
      const firstDeleted = deletedUsers[0];
      console.log(`🔬 First deleted user details:`);
      console.log(`  - deletedAt type: ${typeof firstDeleted.deletedAt}`);
      console.log(`  - deletedAt value: ${firstDeleted.deletedAt}`);
      console.log(`  - deletedAt instanceof Date: ${firstDeleted.deletedAt instanceof Date}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDeletedUsers();
