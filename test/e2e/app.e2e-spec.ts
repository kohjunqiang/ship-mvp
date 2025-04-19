import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { ValidationPipe } from '@nestjs/common';
import { createMockUser } from '../utils/test.utils';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    // TODO: Implement authentication and get a valid token
    // This is a placeholder for future authentication implementation
    authToken = 'placeholder_token';
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Health Check', () => {
    it('/ (GET)', () => {
      return request(app.getHttpServer())
        .get('/')
        .expect(200)
        .expect('Application is running');
    });
  });

  describe('API Documentation', () => {
    it('/api/docs (GET)', () => {
      return request(app.getHttpServer())
        .get('/api/docs')
        .expect(200)
        .expect('text/html; charset=utf-8');
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid routes', () => {
      return request(app.getHttpServer())
        .get('/invalid-route')
        .expect(404);
    });

    it('should handle invalid method', () => {
      return request(app.getHttpServer())
        .post('/')
        .expect(404);
    });

    it('should handle validation errors', () => {
      return request(app.getHttpServer())
        .post('/api/users')
        .send({})
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toBeInstanceOf(Array);
          expect(res.body.error).toBe('Bad Request');
        });
    });
  });

  describe('Authentication', () => {
    // Placeholder for future authentication tests
    it('should be implemented', () => {
      expect(true).toBe(true);
    });
  });
});
