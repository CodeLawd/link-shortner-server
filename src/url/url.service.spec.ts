import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UrlService } from './url.service';
import { Url, UrlDocument } from './url.schema';

describe('UrlService', () => {
  let service: UrlService;
  let urlModel: Model<UrlDocument>;
  
  const now = new Date().toISOString();
  const expiredDate = new Date();
  expiredDate.setDate(expiredDate.getDate() + 30); // Default expiration
  const expiresAt = expiredDate.toISOString();

  const mockUrlModel = {
    findOne: jest.fn(),
    findOneAndUpdate: jest.fn(),
    updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
    find: jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([]),
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UrlService,
        {
          provide: getModelToken(Url.name),
          useValue: {
            ...mockUrlModel,
            new: jest.fn().mockImplementation((doc) => ({
              ...doc,
              save: jest.fn().mockResolvedValue(doc),
            })),
            constructor: jest.fn().mockImplementation((doc) => ({
              ...doc,
              save: jest.fn().mockResolvedValue(doc),
            })),
          },
        },
      ],
    }).compile();

    service = module.get<UrlService>(UrlService);
    urlModel = module.get<Model<UrlDocument>>(getModelToken(Url.name));
    
    // Reset all mock implementations
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('encodeUrl', () => {
    it('should encode a URL and return a short URL', async () => {
      const originalUrl = 'https://indicina.co';
      const shortPath = 'abc123';
      
      // Mock that URL doesn't already exist
      mockUrlModel.findOne.mockResolvedValueOnce(null);
      
      // Mock that generated short path is not taken
      mockUrlModel.findOne.mockResolvedValueOnce(null);
      
      // Mock the toBase62 method to return a consistent shortPath for testing
      jest.spyOn(service as any, 'toBase62').mockReturnValue(shortPath);

      // Mock constructor and save method
      const saveMock = jest.fn().mockResolvedValue({
        originalUrl,
        shortPath,
        createdAt: now,
        visitCount: 0,
        lastVisited: null,
        expiresAt,
      });
      
      // Mock the constructor calls
      (urlModel as any).constructor.mockImplementation(() => ({
        save: saveMock,
      }));

      const shortUrl = await service.encodeUrl(originalUrl);
      
      expect(shortUrl).toBe(`http://short.est/${shortPath}`);
    });
  });

  describe('decodeUrl', () => {
    it('should decode a short URL and return the original URL', async () => {
      const originalUrl = 'https://indicina.co';
      const shortPath = 'abc123';
      const shortUrl = `http://short.est/${shortPath}`;
      
      mockUrlModel.findOne.mockResolvedValueOnce({
        originalUrl,
        shortPath,
        expiresAt,
      });
      
      const decodedUrl = await service.decodeUrl(shortUrl);
      
      expect(decodedUrl).toBe(originalUrl);
      expect(mockUrlModel.findOne).toHaveBeenCalledWith({
        shortPath,
        $or: [
          { expiresAt: null },
          { expiresAt: { $gt: expect.any(String) } },
        ],
      });
    });
    
    it('should handle invalid short URLs', async () => {
      mockUrlModel.findOne.mockResolvedValueOnce(null);
      
      const decodedUrl = await service.decodeUrl('invalid-url');
      expect(decodedUrl).toBeNull();
    });
  });

  describe('getStatistics', () => {
    it('should return statistics for a shortened URL', async () => {
      const originalUrl = 'https://indicina.co';
      const shortPath = 'abc123';
      const urlEntry = {
        originalUrl,
        shortPath,
        createdAt: now,
        visitCount: 0,
        lastVisited: null,
        expiresAt,
      };
      
      mockUrlModel.findOne.mockResolvedValueOnce(urlEntry);
      
      const stats = await service.getStatistics(shortPath);
      
      expect(stats).toEqual(urlEntry);
      expect(mockUrlModel.findOne).toHaveBeenCalledWith({
        shortPath,
        $or: [
          { expiresAt: null },
          { expiresAt: { $gt: expect.any(String) } },
        ],
      });
    });
    
    it('should return null for non-existent URLs', async () => {
      mockUrlModel.findOne.mockResolvedValueOnce(null);
      
      const stats = await service.getStatistics('non-existent');
      expect(stats).toBeNull();
    });
  });

  describe('visitUrl', () => {
    it('should increment visit count when visiting a URL', async () => {
      const shortPath = 'abc123';
      const originalUrl = 'https://indicina.co';
      
      const updatedEntry = {
        originalUrl,
        shortPath,
        visitCount: 1,
        lastVisited: expect.any(String),
        expiresAt,
      };
      
      // Mock the findOneAndUpdate operation
      mockUrlModel.findOneAndUpdate.mockResolvedValueOnce(updatedEntry);
      
      const result = await service.visitUrl(shortPath);
      
      expect(result).toBe(originalUrl);
      expect(mockUrlModel.findOneAndUpdate).toHaveBeenCalledWith(
        {
          shortPath,
          $or: [
            { expiresAt: null },
            { expiresAt: { $gt: expect.any(String) } },
          ],
        },
        {
          $inc: { visitCount: 1 },
          $set: { lastVisited: expect.any(String) },
        },
        { new: true }
      );
    });
  });
}); 