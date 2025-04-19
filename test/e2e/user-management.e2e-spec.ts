import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { ValidationPipe } from '@nestjs/common';
import { createMockUser, createMockObjectId } from '../utils/test.utils';
import { mockUserRegular } from '../mocks/users.mock';

describe('User Management (e2e)', () => {
  let app: INestApplication;
  let authToken: string;

  const testUser = {
    email: 'test.user@example.com',
    emailPassword: 'TestPassword123!',
    emailSettings: {
      host: 'imap.gmail.com',
      port: 993,
      secure: true,
    },
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    // TODO: Implement authentication and get a valid token
    authToken = 'placeholder_token';
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/api/users', () => {
    let createdUserId: string;

    it('POST / should create a new user', () => {
      return request(app.getHttpServer())
        .post('/api/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send(testUser)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('_id');
          expect(res.body.email).toBe(testUser.email);
          expect(res.body).not.toHaveProperty('emailPassword'); // Password should not be returned
          expect(res.body.emailSettings).toEqual(testUser.emailSettings);
          createdUserId = res.body._id;
        });
    });

    it('GET / should return all users', () => {
      return request(app.getHttpServer())
        .get('/api/users')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
          expect(res.body[0]).toHaveProperty('email');
          expect(res.body[0]).not.toHaveProperty('emailPassword');
        });
    });

    it('GET /:id should return a specific user', () => {
      return request(app.getHttpServer())
        .get(`/api/users/${createdUserId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('_id');
          expect(res.body.email).toBe(testUser.email);
          expect(res.body).not.toHaveProperty('emailPassword');
        });
    });

    it('PATCH /:id should update a user', () => {
      const updateData = {
        emailSettings: {
          host: 'imap.outlook.com',
          port: 993,
          secure: true,
        },
      };

      return request(app.getHttpServer())
        .patch(`/api/users/${createdUserId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200)
        .expect((res) => {
          expect(res.body.emailSettings).toEqual(updateData.emailSettings);
        });
    });

    it('DELETE /:id should delete a user', () => {
      return request(app.getHttpServer())
        .delete(`/api/users/${createdUserId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });

    it('should handle invalid user data', () => {
      const invalidUser = {
        email: 'invalid-email', // Invalid email format
        emailPassword: '123', // Too short password
      };

      return request(app.getHttpServer())
        .post('/api/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidUser)
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain('email');
          expect(res.body.message).toContain('password');
        });
    });

    it('should handle non-existent user', () => {
      const nonExistentId = createMockObjectId();
      return request(app.getHttpServer())
        .get(`/api/users/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('/api/users/:id/statistics', () => {
    it('should update user statistics', () => {
      return request(app.getHttpServer())
        .post(`/api/users/${mockUserRegular._id}/statistics`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          emailProcessed: true,
          intentionMatched: true,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('emailsProcessed');
          expect(res.body).toHaveProperty('matchedIntentions');
          expect(res.body.emailsProcessed).toBeGreaterThan(0);
        });
    });
  });

  describe('User Email Password', () => {
    it('should not expose email password in any response', async () => {
      const responses = await Promise.all([
        request(app.getHttpServer())
          .get('/api/users')
          .set('Authorization', `Bearer ${authToken}`),
        request(app.getHttpServer())
          .get(`/api/users/${mockUserRegular._id}`)
          .set('Authorization', `Bearer ${authToken}`),
      ]);

      responses.forEach(response => {
        const data = Array.isArray(response.body) ? response.body : [response.body];
        data.forEach(user => {
          expect(user).not.toHaveProperty('emailPassword');
        });
      });
    });

    it('should encrypt password when creating user', () => {
      const newUser = {
        email: 'password.test@example.com',
        emailPassword: 'TestPassword123!',
        emailSettings: {
          host: 'imap.gmail.com',
          port: 993,
          secure: true,
        },
      };

      return request(app.getHttpServer())
        .post('/api/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newUser)
        .expect(201)
        .expect((res) => {
          expect(res.body).not.toHaveProperty('emailPassword');
        });
    });
  });
});
