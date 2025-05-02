import { Test, TestingModule } from '@nestjs/testing';
import { HttpException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { UrlController } from './url.controller';
import { UrlService } from './url.service';
import { Url } from './url.schema';

describe('UrlController', () => {
  let controller: UrlController;
  let service: UrlService;

  const now = new Date().toISOString();
  const expiredDate = new Date();
  expiredDate.setDate(expiredDate.getDate() + 30); // Default expiration
  const expiresAt = expiredDate.toISOString();

  const mockUrlService = {
    encodeUrl: jest.fn(),
    decodeUrl: jest.fn(),
    getStatistics: jest.fn(),
    visitUrl: jest.fn(),
    listAllUrls: jest.fn(),
  };

  // Mock MongoDB model implementation
  class MockModel {}

  beforeEach(async () => {
    jest.clearAllMocks();
    
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UrlController],
      providers: [
        {
          provide: UrlService,
          useValue: mockUrlService,
        },
        {
          provide: getModelToken(Url.name),
          useValue: MockModel,
        },
      ],
    }).compile();

    controller = module.get<UrlController>(UrlController);
    service = module.get<UrlService>(UrlService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('encodeUrl', () => {
    it('should encode a URL successfully', async () => {
      const originalUrl = 'https://indicina.co';
      const shortUrl = 'http://short.est/abc123';
      
      mockUrlService.encodeUrl.mockResolvedValue(shortUrl);
      
      const result = await controller.encodeUrl({ url: originalUrl });

      expect(result).toBeDefined();
      expect(result.shortUrl).toBe(shortUrl);
      expect(mockUrlService.encodeUrl).toHaveBeenCalledWith(originalUrl, undefined);
    });

    it('should throw an error if URL is not provided', async () => {
      await expect(controller.encodeUrl({ url: '' })).rejects.toThrow(
        HttpException,
      );
      expect(mockUrlService.encodeUrl).not.toHaveBeenCalled();
    });
  });

  describe('decodeUrl', () => {
    it('should decode a short URL successfully', async () => {
      const originalUrl = 'https://indicina.co';
      const shortUrl = 'http://short.est/abc123';
      
      mockUrlService.decodeUrl.mockResolvedValue(originalUrl);
      
      const result = await controller.decodeUrl({ shortUrl });

      expect(result).toBeDefined();
      expect(result.url).toBe(originalUrl);
      expect(mockUrlService.decodeUrl).toHaveBeenCalledWith(shortUrl);
    });

    it('should throw an error if short URL is not provided', async () => {
      await expect(controller.decodeUrl({ shortUrl: '' })).rejects.toThrow(
        HttpException,
      );
      expect(mockUrlService.decodeUrl).not.toHaveBeenCalled();
    });

    it('should throw an error if short URL does not exist', async () => {
      mockUrlService.decodeUrl.mockResolvedValue(null);
      
      await expect(
        controller.decodeUrl({ shortUrl: 'http://short.est/invalid' }),
      ).rejects.toThrow(HttpException);
      
      expect(mockUrlService.decodeUrl).toHaveBeenCalledWith('http://short.est/invalid');
    });
  });

  describe('getStatistics', () => {
    it('should return statistics for a valid path', async () => {
      const shortPath = 'abc123';
      const stats = {
        originalUrl: 'https://indicina.co',
        shortPath,
        createdAt: now,
        visitCount: 0,
        lastVisited: null,
        expiresAt,
      };
      
      mockUrlService.getStatistics.mockResolvedValue(stats);

      const result = await controller.getStatistics(shortPath);

      expect(result).toEqual(stats);
      expect(mockUrlService.getStatistics).toHaveBeenCalledWith(shortPath);
    });

    it('should throw an error for an invalid path', async () => {
      mockUrlService.getStatistics.mockResolvedValue(null);
      
      await expect(controller.getStatistics('invalid-path')).rejects.toThrow(
        HttpException,
      );
      
      expect(mockUrlService.getStatistics).toHaveBeenCalledWith('invalid-path');
    });
  });
  
  describe('getUrlList', () => {
    it('should return a list of all URLs', async () => {
      const urlList = [
        {
          originalUrl: 'https://indicina.co',
          shortPath: 'abc123',
          createdAt: now,
          visitCount: 5,
          lastVisited: now,
          expiresAt,
        },
        {
          originalUrl: 'https://example.com',
          shortPath: 'def456',
          createdAt: now,
          visitCount: 2,
          lastVisited: now,
          expiresAt,
        },
      ];
      
      mockUrlService.listAllUrls.mockResolvedValue(urlList);
      
      const result = await controller.getUrlList();
      
      expect(result).toEqual(urlList);
      expect(mockUrlService.listAllUrls).toHaveBeenCalled();
    });
  });
});
