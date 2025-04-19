import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { ValidationPipe } from '@nestjs/common';
import { createMockIntention, createMockObjectId } from '../utils/test.utils';
import { mockMeetingIntention } from '../mocks/intentions.mock';

describe('Email Intentions (e2e)', () => {
  let app: INestApplication;
  let authToken: string;

  const testIntention = createMockIntention({
    name: 'Test Intention',
    description: 'Test intention for e2e testing',
    keywords: ['test', 'e2e'],
    aiConfig: {
      threshold: 0.8,
      extractFields: ['field1', 'field2'],
      prompt: 'Test prompt for e2e testing',
    },
  });

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

  describe('/api/intentions', () => {
    it('GET / should return all intentions', () => {
      return request(app.getHttpServer())
        .get('/api/intentions')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
          expect(res.body[0]).toHaveProperty('name');
          expect(res.body[0]).toHaveProperty('description');
          expect(res.body[0]).toHaveProperty('keywords');
          expect(res.body[0]).toHaveProperty('aiConfig');
        });
    });

    it('POST / should create a new intention', () => {
      return request(app.getHttpServer())
        .post('/api/intentions')
        .set('Authorization', `Bearer ${authToken}`)
        .send(testIntention)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('_id');
          expect(res.body.name).toBe(testIntention.name);
          expect(res.body.description).toBe(testIntention.description);
          expect(res.body.keywords).toEqual(testIntention.keywords);
          expect(res.body.aiConfig).toEqual(testIntention.aiConfig);
        });
    });

    it('GET /:id should return a specific intention', () => {
      return request(app.getHttpServer())
        .get(`/api/intentions/${mockMeetingIntention._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('_id');
          expect(res.body.name).toBe(mockMeetingIntention.name);
        });
    });

    it('PATCH /:id should update an intention', () => {
      const updateData = {
        description: 'Updated description for e2e test',
        keywords: ['updated', 'test', 'e2e'],
      };

      return request(app.getHttpServer())
        .patch(`/api/intentions/${testIntention._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200)
        .expect((res) => {
          expect(res.body.description).toBe(updateData.description);
          expect(res.body.keywords).toEqual(updateData.keywords);
        });
    });

    it('DELETE /:id should delete an intention', () => {
      return request(app.getHttpServer())
        .delete(`/api/intentions/${testIntention._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });

    it('should handle invalid intention data', () => {
      const invalidIntention = {
        name: '', // Invalid: empty name
        description: 'Test description',
      };

      return request(app.getHttpServer())
        .post('/api/intentions')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidIntention)
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain('name');
        });
    });

    it('should handle non-existent intention', () => {
      const nonExistentId = createMockObjectId();
      return request(app.getHttpServer())
        .get(`/api/intentions/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('/api/intentions/:id/statistics', () => {
    it('should update intention statistics', () => {
      const statistics = {
        confidence: 0.95,
      };

      return request(app.getHttpServer())
        .post(`/api/intentions/${mockMeetingIntention._id}/statistics`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(statistics)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('matchCount');
          expect(res.body).toHaveProperty('averageConfidence');
          expect(res.body.averageConfidence).toBeGreaterThan(0);
        });
    });
  });
});
