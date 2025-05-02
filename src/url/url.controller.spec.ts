import { Test, TestingModule } from '@nestjs/testing';
import { HttpException } from '@nestjs/common';
import { UrlController } from './url.controller';
import { UrlService } from './url.service';

describe('UrlController', () => {
  let controller: UrlController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UrlController],
      providers: [UrlService],
    }).compile();

    controller = module.get<UrlController>(UrlController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('encodeUrl', () => {
    it('should encode a URL successfully', async () => {
      const body = { url: 'https://indicina.co' };
      const result = await controller.encodeUrl(body);

      expect(result).toBeDefined();
      expect(result.shortUrl).toMatch(
        /^http:\/\/short\.est\/[A-Za-z0-9_-]{6}$/,
      );
    });

    it('should throw an error if URL is not provided', async () => {
      await expect(controller.encodeUrl({ url: '' })).rejects.toThrow(
        HttpException,
      );
    });
  });

  describe('decodeUrl', () => {
    it('should decode a short URL successfully', async () => {
      // First encode a URL
      const originalUrl = 'https://indicina.co';
      const encodedResult = await controller.encodeUrl({ url: originalUrl });
      const shortUrl = encodedResult.shortUrl;

      // Then decode it
      const result = await controller.decodeUrl({ shortUrl });

      expect(result).toBeDefined();
      expect(result.url).toBe(originalUrl);
    });

    it('should throw an error if short URL is not provided', async () => {
      await expect(controller.decodeUrl({ shortUrl: '' })).rejects.toThrow(
        HttpException,
      );
    });

    it('should throw an error if short URL does not exist', async () => {
      await expect(
        controller.decodeUrl({ shortUrl: 'http://short.est/invalid' }),
      ).rejects.toThrow(HttpException);
    });
  });

  describe('getStatistics', () => {
    it('should return statistics for a valid path', async () => {
      // First create a URL
      const originalUrl = 'https://indicina.co';
      const encodedResult = await controller.encodeUrl({ url: originalUrl });
      const shortUrl = encodedResult.shortUrl;
      const shortPath = shortUrl.split('/').pop();

      if (!shortPath) {
        throw new Error('Failed to extract shortPath');
      }

      // Get statistics
      const stats = await controller.getStatistics(shortPath);

      expect(stats).toBeDefined();
      expect(stats?.originalUrl).toBe(originalUrl);
    });

    it('should throw an error for an invalid path', async () => {
      await expect(controller.getStatistics('invalid-path')).rejects.toThrow(
        HttpException,
      );
    });
  });
});
