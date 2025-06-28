import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../app.module';
import { SanitizationPipe } from '../common/pipes/sanitization.pipe';
import { requestCounts } from '../common/interceptors/rate-limit.interceptor';

describe('User API - Integration Test Suite', () => {
  let app: INestApplication;
  let accessToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // APPLY GLOBAL PIPES FOR TESTING
    // This is crucial for tests to behave like the main application
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: false,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
      new SanitizationPipe(),
    );

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

      const userExists = response.body.data.some(
        (user) => user.id === newUserId,
      );
      expect(userExists).toBe(true);
    });

    it('should update the user via PATCH', async () => {
      const updatedName = `Updated Lifecycle Test ${Date.now()}`;
      const response = await request(app.getHttpServer())
        .patch(`/api/users/${newUserId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: updatedName,
        })
        .expect(200);

      expect(response.body.name).toBe(updatedName);
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

      const userExists = response.body.data.some(
        (user) => user.id === newUserId,
      );
      expect(userExists).toBe(true);
    });

    it('should verify the user no longer appears in the active list', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/users')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const userExists = response.body.data.some(
        (user) => user.id === newUserId,
      );
      expect(userExists).toBe(false);
    });

    it('should restore the user using bulk restore', async () => {
      // Restore the user
      const restoreResponse = await request(app.getHttpServer())
        .post('/api/users/bulk/restore')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ userIds: [newUserId] })
        .expect(200);

      expect(restoreResponse.body.restoredCount).toBe(1);

      // Verify the user is no longer in the deleted list
      const deletedResponse = await request(app.getHttpServer())
        .get('/api/users/deleted')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const deletedUserExists = deletedResponse.body.data.some(
        (user) => user.id === newUserId,
      );
      expect(deletedUserExists).toBe(false);

      // Verify the user is back in the active list
      const activeResponse = await request(app.getHttpServer())
        .get('/api/users')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const activeUserExists = activeResponse.body.data.some(
        (user) => user.id === newUserId,
      );
      expect(activeUserExists).toBe(true);
    });
  });
});
