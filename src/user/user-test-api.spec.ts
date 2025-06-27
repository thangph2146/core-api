import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../app.module';
import { requestCounts } from '../common/interceptors/rate-limit.interceptor';

describe('User API - Integration Test Suite', () => {
  let app: INestApplication;
  let accessToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    // THIS IS THE CRITICAL FIX
    app.setGlobalPrefix('api');
    await app.init();

    const loginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: 'thang.ph2146@gmail.com',
        password: 'RachelCu.26112020',
      })
      .expect(200);

    accessToken = loginResponse.body.data.accessToken;
  });

  beforeEach(() => {
    requestCounts.clear();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Separate APIs for Users and Deleted Users Tests', () => {
    const uniqueUserEmail = `lifecycle.test.${Date.now()}@example.com`;
    let newUserId: number;

    it('should create a new user successfully to test lifecycle', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/users')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          email: uniqueUserEmail,
          name: 'Lifecycle Test',
          password: 'Password123!',
        })
        .expect(201);
      
      newUserId = response.body.id;
      expect(newUserId).toBeDefined();
    });

    it('should verify the new user appears in the active list', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/users')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
      
      const userExists = response.body.data.some(user => user.id === newUserId);
      expect(userExists).toBe(true);
    });

    it('should soft-delete the user', async () => {
      await request(app.getHttpServer())
        .delete(`/api/users/${newUserId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(204);
    });

    it('should verify the user now appears in the deleted list', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/users/deleted')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const userExists = response.body.data.some(user => user.id === newUserId);
      expect(userExists).toBe(true);
    });

    it('should verify the user no longer appears in the active list', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/users')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const userExists = response.body.data.some(user => user.id === newUserId);
      expect(userExists).toBe(false);
    });
  });
}); 