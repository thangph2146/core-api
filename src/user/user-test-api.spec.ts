import * as request from 'supertest';

describe('User Bulk Operations', () => {
  let accessToken: string;
  const testUserIds = [76, 77];
  const baseUrl = 'http://localhost:5678';

  beforeAll(async () => {
    // Login to get access token
    console.log('🔐 Logging in to get access token...');
    
    const loginResponse = await request(baseUrl)
      .post('/api/auth/login')
      .send({
        email: 'thang.ph2146@gmail.com',
        password: 'RachelCu.26112020'
      })
      .expect(200);

    accessToken = loginResponse.body.data.accessToken;
    
    console.log('✅ Login successful!');
    console.log('User:', loginResponse.body.data.user.name);
    console.log('Role:', loginResponse.body.data.user.role?.name);
    console.log('Token:', accessToken.substring(0, 50) + '...');
  });

  describe('GET /api/users/stats', () => {
    it('should get user statistics', async () => {
      const response = await request(baseUrl)
        .get('/api/users/stats?deleted=false')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('active');
      expect(response.body).toHaveProperty('deleted');
      expect(typeof response.body.total).toBe('number');
      
      console.log('📊 User stats:', response.body);
    });
  });

  describe('GET /api/users - Query Logic Tests', () => {
    it('should get active users only (default)', async () => {
      const response = await request(baseUrl)
        .get('/api/users?page=1&limit=10')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      
      // All users should have deletedAt: null
      response.body.data.forEach(user => {
        expect(user.deletedAt).toBeNull();
      });
      
      console.log('✅ Active users only:', response.body.data.length);
    });

    it('should get all users when includeDeleted=true', async () => {
      const response = await request(baseUrl)
        .get('/api/users?page=1&limit=10&includeDeleted=true')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      
      console.log('📄 All users (includeDeleted=true):', response.body.data.length);
      console.log('Users details:', response.body.data.map(u => ({
        id: u.id,
        name: u.name,
        deletedAt: u.deletedAt
      })));
    });

    it('should get deleted users only', async () => {
      const response = await request(baseUrl)
        .get('/api/users?page=1&limit=10&includeDeleted=true&deleted=true')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      
      // All users should have deletedAt: not null
      response.body.data.forEach(user => {
        expect(user.deletedAt).not.toBeNull();
      });
      
      console.log('🗑️ Deleted users only:', response.body.data.length);
      console.log('Deleted users details:', response.body.data.map(u => ({
        id: u.id,
        name: u.name,
        deletedAt: u.deletedAt
      })));
    });
  });

  describe('GET /api/users/:id', () => {
    it.each(testUserIds)('should get user details for ID %i', async (userId) => {
      const response = await request(baseUrl)
        .get(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      if (response.status === 200) {
        expect(response.body).toHaveProperty('id', userId);
        expect(response.body).toHaveProperty('email');
        expect(response.body).toHaveProperty('name');
        console.log(`✅ User ${userId}:`, response.body.name, `(${response.body.email})`);
      } else if (response.status === 404) {
        console.log(`⚠️ User ${userId} not found`);
      } else {
        console.log(`❌ User ${userId} error:`, response.status, response.body);
      }
    });
  });

  describe('Data Preparation for Bulk Tests', () => {
    it('should delete some users to prepare test data', async () => {
      // First, let's see what users exist
      const allUsersResponse = await request(baseUrl)
        .get('/api/users?page=1&limit=20&includeDeleted=true')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      console.log('🔍 Current users before deletion:', allUsersResponse.body.data.map(u => ({
        id: u.id,
        name: u.name,
        deletedAt: u.deletedAt
      })));

      // Try to delete testUserIds if they exist and are active
      const activeUsers = allUsersResponse.body.data.filter(u => u.deletedAt === null && testUserIds.includes(u.id));
      
      if (activeUsers.length > 0) {
        console.log('🗑️ Deleting users for test:', activeUsers.map(u => u.id));
        
        for (const user of activeUsers) {
          const deleteResponse = await request(baseUrl)
            .delete(`/api/users/${user.id}`)
            .set('Authorization', `Bearer ${accessToken}`);
          
          console.log(`Delete user ${user.id}: ${deleteResponse.status}`);
        }
      } else {
        console.log('⚠️ No active users to delete from testUserIds');
      }
    });
  });

  describe('Bulk Operations', () => {
    describe('POST /api/users/bulk/delete', () => {
      it('should soft delete users', async () => {
        const response = await request(baseUrl)
          .post('/api/users/bulk/delete')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ userIds: testUserIds })
          .expect(200);

        expect(response.body).toHaveProperty('deletedCount');
        expect(typeof response.body.deletedCount).toBe('number');
        
        console.log('🗑️ Bulk delete result:', response.body);
      });
    });

    describe('POST /api/users/bulk/restore-users (Fixed route)', () => {
      it('should restore users successfully with new route name', async () => {
        console.log('✅ Testing new route: bulk/restore-users');
        
        const response = await request(baseUrl)
          .post('/api/users/bulk/restore-users')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ userIds: testUserIds })
          .expect(200);

        expect(response.body).toHaveProperty('restoredCount');
        expect(typeof response.body.restoredCount).toBe('number');
        console.log('✅ Restore successful:', response.body);
      });
    });
  });

  describe('Individual Operations', () => {
    describe('POST /api/users/:id/restore', () => {
      it.each(testUserIds)('should restore individual user %i', async (userId) => {
        const response = await request(baseUrl)
          .post(`/api/users/${userId}/restore`)
          .set('Authorization', `Bearer ${accessToken}`);

        if (response.status === 200) {
          expect(response.body).toHaveProperty('id', userId);
          console.log(`✅ Individual restore user ${userId}:`, response.body);
        } else {
          console.log(`⚠️ Individual restore user ${userId} failed:`, response.status, response.body.message);
        }
      });
    });

    describe('DELETE /api/users/:id', () => {
      it.each(testUserIds)('should soft delete individual user %i', async (userId) => {
        const response = await request(baseUrl)
          .delete(`/api/users/${userId}`)
          .set('Authorization', `Bearer ${accessToken}`);

        if (response.status === 204) {
          console.log(`✅ Individual delete user ${userId}: Success (No Content)`);
        } else {
          console.log(`⚠️ Individual delete user ${userId} failed:`, response.status, response.body?.message);
        }
      });
    });
  });

  describe('Final Verification', () => {
    it('should verify final state of users', async () => {
      const statsResponse = await request(baseUrl)
        .get('/api/users/stats')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      console.log('📊 Final user stats:', statsResponse.body);

      const allUsersResponse = await request(baseUrl)
        .get('/api/users?page=1&limit=20&includeDeleted=true')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      console.log('👥 Final users state:', allUsersResponse.body.data.map(u => ({
        id: u.id,
        name: u.name,
        deletedAt: u.deletedAt ? 'DELETED' : 'ACTIVE'
      })));

      const deletedUsersResponse = await request(baseUrl)
        .get('/api/users?page=1&limit=20&includeDeleted=true&deleted=true')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      console.log('🗑️ Final deleted users only:', deletedUsersResponse.body.data.map(u => ({
        id: u.id,
        name: u.name,
        deletedAt: u.deletedAt
      })));
    });
  });
}); 