import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { setupMongoDB, teardownMongoDB, clearDatabase } from './setup-mongo';

describe('UrlController (e2e)', () => {
  let app: INestApplication;
  let shortUrl: string;
  let shortPath: string;

  beforeAll(async () => {
    // Set up in-memory MongoDB
    await setupMongoDB();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.enableCors();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    // Clean up MongoDB
    await teardownMongoDB();
  });

  afterEach(async () => {
    // Clear database between tests
    await clearDatabase();
  });

  describe('/api/encode (POST)', () => {
    it('should encode a long URL into a short URL', () => {
      return request(app.getHttpServer())
        .post('/api/encode')
        .send({ url: 'https://indicina.co' })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('shortUrl');
          expect(res.body.shortUrl).toMatch(/^http:\/\/short\.est\/[A-Za-z0-9_-]{6}$/);
          
          // Store for later tests
          shortUrl = res.body.shortUrl;
          shortPath = shortUrl.split('/').pop();
        });
    });

    it('should return 400 if URL is not provided', () => {
      return request(app.getHttpServer())
        .post('/api/encode')
        .send({ url: '' })
        .expect(400);
    });
  });

  describe('/api/decode (POST)', () => {
    it('should decode a short URL back to the original URL', () => {
      return request(app.getHttpServer())
        .post('/api/decode')
        .send({ shortUrl })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('url');
          expect(res.body.url).toBe('https://indicina.co');
        });
    });

    it('should return 400 if short URL is not provided', () => {
      return request(app.getHttpServer())
        .post('/api/decode')
        .send({ shortUrl: '' })
        .expect(400);
    });

    it('should return 404 if short URL does not exist', () => {
      return request(app.getHttpServer())
        .post('/api/decode')
        .send({ shortUrl: 'http://short.est/invalid' })
        .expect(404);
    });
  });

  describe('/api/statistic/:path (GET)', () => {
    it('should return statistics for a valid path', () => {
      return request(app.getHttpServer())
        .get(`/api/statistic/${shortPath}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('originalUrl');
          expect(res.body).toHaveProperty('shortPath');
          expect(res.body).toHaveProperty('createdAt');
          expect(res.body).toHaveProperty('visitCount');
          expect(res.body).toHaveProperty('lastVisited');
          expect(res.body.originalUrl).toBe('https://indicina.co');
        });
    });

    it('should return 404 for an invalid path', () => {
      return request(app.getHttpServer())
        .get('/api/statistic/invalid')
        .expect(404);
    });
  });

  describe('/api/list (GET)', () => {
    it('should return a list of all URLs', () => {
      return request(app.getHttpServer())
        .get('/api/list')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
        });
    });
  });
}); 