import { Test, TestingModule } from '@nestjs/testing';
import { UrlService } from './url.service';

describe('UrlService', () => {
  let service: UrlService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UrlService],
    }).compile();

    service = module.get<UrlService>(UrlService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('encodeUrl', () => {
    it('should encode a URL and return a short URL', () => {
      const originalUrl = 'https://indicina.co';
      const shortUrl = service.encodeUrl(originalUrl);
      
      expect(shortUrl).toMatch(/^http:\/\/short\.est\/[A-Za-z0-9_-]{6}$/);
    });
  });

  describe('decodeUrl', () => {
    it('should decode a short URL and return the original URL', () => {
      const originalUrl = 'https://indicina.co';
      const shortUrl = service.encodeUrl(originalUrl);
      const decodedUrl = service.decodeUrl(shortUrl);
      
      expect(decodedUrl).toBe(originalUrl);
    });
    
    it('should handle invalid short URLs', () => {
      const decodedUrl = service.decodeUrl('invalid-url');
      expect(decodedUrl).toBeNull();
    });
  });

  describe('getStatistics', () => {
    it('should return statistics for a shortened URL', () => {
      const originalUrl = 'https://indicina.co';
      const shortUrl = service.encodeUrl(originalUrl);
      const shortPath = shortUrl.split('/').pop();
      
      const stats = service.getStatistics(shortPath);
      
      expect(stats).toBeDefined();
      expect(stats.originalUrl).toBe(originalUrl);
      expect(stats.visitCount).toBe(0);
      expect(stats.lastVisited).toBeNull();
    });
    
    it('should return null for non-existent URLs', () => {
      const stats = service.getStatistics('non-existent');
      expect(stats).toBeNull();
    });
  });

  describe('visitUrl', () => {
    it('should increment visit count when visiting a URL', () => {
      const originalUrl = 'https://indicina.co';
      const shortUrl = service.encodeUrl(originalUrl);
      const shortPath = shortUrl.split('/').pop();
      
      service.visitUrl(shortPath);
      const stats = service.getStatistics(shortPath);
      
      expect(stats.visitCount).toBe(1);
      expect(stats.lastVisited).not.toBeNull();
    });
  });
}); 