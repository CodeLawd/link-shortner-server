import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';
import { UrlController } from './url.controller';
import { UrlService } from './url.service';

describe('UrlController', () => {
  let controller: UrlController;
  let service: UrlService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UrlController],
      providers: [UrlService],
    }).compile();

    controller = module.get<UrlController>(UrlController);
    service = module.get<UrlService>(UrlService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('encodeUrl', () => {
    it('should encode a URL successfully', () => {
      const body = { url: 'https://indicina.co' };
      const result = controller.encodeUrl(body);
      
      expect(result).toBeDefined();
      expect(result.shortUrl).toMatch(/^http:\/\/short\.est\/[A-Za-z0-9_-]{6}$/);
    });
    
    it('should throw an error if URL is not provided', () => {
      expect(() => controller.encodeUrl({ url: '' })).toThrow(HttpException);
    });
  });

  describe('decodeUrl', () => {
    it('should decode a short URL successfully', () => {
      // First encode a URL
      const originalUrl = 'https://indicina.co';
      const shortUrl = service.encodeUrl(originalUrl);
      
      // Then decode it
      const result = controller.decodeUrl({ shortUrl });
      
      expect(result).toBeDefined();
      expect(result.url).toBe(originalUrl);
    });
    
    it('should throw an error if short URL is not provided', () => {
      expect(() => controller.decodeUrl({ shortUrl: '' })).toThrow(HttpException);
    });
    
    it('should throw an error if short URL does not exist', () => {
      expect(() => controller.decodeUrl({ shortUrl: 'http://short.est/invalid' })).toThrow(HttpException);
    });
  });

  describe('getStatistics', () => {
    it('should return statistics for a valid path', () => {
      // First create a URL
      const originalUrl = 'https://indicina.co';
      const shortUrl = service.encodeUrl(originalUrl);
      const shortPath = shortUrl.split('/').pop();
      
      // Get statistics
      const stats = controller.getStatistics(shortPath);
      
      expect(stats).toBeDefined();
      expect(stats.originalUrl).toBe(originalUrl);
    });
    
    it('should throw an error for an invalid path', () => {
      expect(() => controller.getStatistics('invalid-path')).toThrow(HttpException);
    });
  });
}); 