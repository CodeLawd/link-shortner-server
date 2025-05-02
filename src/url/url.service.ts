import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Url, UrlDocument } from './url.schema';

export interface UrlEntry {
  originalUrl: string;
  shortPath: string;
  createdAt: string;
  visitCount: number;
  lastVisited: string;
  expiresAt: string;
}

@Injectable()
export class UrlService {
  private readonly baseUrl = 'http://short.est/';
  private counter = 1000; // Start with a non-zero value
  private readonly DEFAULT_EXPIRATION_DAYS = 30; // Default expiration in days

  // Base62 character set: 0-9, a-z, A-Z (62 characters)
  private readonly base62Chars =
    '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

  constructor(@InjectModel(Url.name) private urlModel: Model<UrlDocument>) {
    // Set up a cleanup job to remove expired URLs
    setInterval(() => {
      void this.cleanupExpiredUrls();
    }, 3600000); // Run every hour
  }

  // Clean up expired URLs
  private async cleanupExpiredUrls(): Promise<void> {
    const now = new Date().toISOString();

    // MongoDB will handle TTL indexes for expiration, but we'll still do a manual cleanup
    await this.urlModel.deleteMany({
      expiresAt: { $lt: now, $ne: null },
    });
  }

  // Calculate expiration date
  private calculateExpirationDate(
    daysToExpire = this.DEFAULT_EXPIRATION_DAYS,
  ): string {
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + daysToExpire);
    return expirationDate.toISOString();
  }

  // Convert decimal to base62 encoding
  private toBase62(num: number): string {
    let encoded = '';

    // Handle the case when num is 0
    if (num === 0) {
      return this.base62Chars[0];
    }

    while (num > 0) {
      encoded = this.base62Chars[num % 62] + encoded;
      num = Math.floor(num / 62);
    }

    return encoded;
  }

  async encodeUrl(url: string, expirationDays?: number): Promise<string> {
    try {
      // Check if URL already exists in our database (prevents duplicates)
      const existingEntry = await this.urlModel.findOne({
        originalUrl: url,
        $or: [
          { expiresAt: null },
          { expiresAt: { $gt: new Date().toISOString() } },
        ],
      });

      if (existingEntry) {
        // URL already exists, return existing short URL
        return this.baseUrl + existingEntry.shortPath;
      }

      // Generate a unique short path
      let shortPath = '';
      let isUnique = false;

      // Loop until we find a unique shortPath
      while (!isUnique) {
        // Use an incrementing counter for shorter IDs
        const uniqueId = Date.now() + this.counter++;

        // Convert to base62 for shorter string
        shortPath = this.toBase62(uniqueId);

        // Check if this shortPath is already in use
        const existingUrl = await this.urlModel.findOne({ shortPath });
        isUnique = !existingUrl;
      }

      // Set expiration date
      const expiresAt = this.calculateExpirationDate(expirationDays);

      // Store the URL entry in MongoDB
      const newUrl = new this.urlModel({
        originalUrl: url,
        shortPath,
        createdAt: new Date().toISOString(),
        visitCount: 0,
        lastVisited: null,
        expiresAt,
      });

      await newUrl.save();

      return this.baseUrl + shortPath;
    } catch (error) {
      console.log(error);
      // Return a fallback string instead of null
      return this.baseUrl + 'error';
    }
  }

  async decodeUrl(shortUrl: string): Promise<string | null> {
    // Extract the short path from the URL
    const shortPath = this.extractShortPath(shortUrl);

    if (!shortPath) {
      return null;
    }

    // Find URL in database and update in one operation
    const now = new Date().toISOString();
    const urlEntry = await this.urlModel.findOneAndUpdate(
      {
        shortPath,
        $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
      },
      {
        $inc: { visitCount: 1 },
        $set: { lastVisited: now },
      },
      { new: true }, // Return the updated document
    );

    if (!urlEntry) {
      return null;
    }

    return urlEntry.originalUrl;
  }

  async getStatistics(shortPath: string): Promise<UrlEntry | null> {
    // Find URL in database
    const urlEntry = await this.urlModel.findOne({
      shortPath,
      $or: [
        { expiresAt: null },
        { expiresAt: { $gt: new Date().toISOString() } },
      ],
    });

    if (!urlEntry) {
      return null;
    }

    return {
      originalUrl: urlEntry.originalUrl,
      shortPath: urlEntry.shortPath,
      createdAt: urlEntry.createdAt,
      visitCount: urlEntry.visitCount,
      lastVisited: urlEntry.lastVisited,
      expiresAt: urlEntry.expiresAt,
    };
  }

  async listAllUrls(): Promise<UrlEntry[]> {
    // Get all non-expired URLs
    const urlEntries = await this.urlModel.find({
      $or: [
        { expiresAt: null },
        { expiresAt: { $gt: new Date().toISOString() } },
      ],
    });

    return urlEntries.map((entry) => ({
      originalUrl: entry.originalUrl,
      shortPath: entry.shortPath,
      createdAt: entry.createdAt,
      visitCount: entry.visitCount,
      lastVisited: entry.lastVisited,
      expiresAt: entry.expiresAt,
    }));
  }

  async visitUrl(shortPath: string): Promise<string | null> {
    // Find URL in database and update in one operation
    const now = new Date().toISOString();
    const urlEntry = await this.urlModel.findOneAndUpdate(
      {
        shortPath,
        $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
      },
      {
        $inc: { visitCount: 1 },
        $set: { lastVisited: now },
      },
      { new: true }, // Return the updated document
    );

    if (!urlEntry) {
      return null;
    }

    return urlEntry.originalUrl;
  }

  async searchUrls(query: string): Promise<UrlEntry[]> {
    if (!query || query.length < 3) {
      return [];
    }

    const normalizedQuery = query.toLowerCase();

    // Search in MongoDB using regex
    const urlEntries = await this.urlModel.find({
      originalUrl: { $regex: normalizedQuery, $options: 'i' },
      $or: [
        { expiresAt: null },
        { expiresAt: { $gt: new Date().toISOString() } },
      ],
    });

    return urlEntries.map((entry) => ({
      originalUrl: entry.originalUrl,
      shortPath: entry.shortPath,
      createdAt: entry.createdAt,
      visitCount: entry.visitCount,
      lastVisited: entry.lastVisited,
      expiresAt: entry.expiresAt,
    }));
  }

  private extractShortPath(shortUrl: string): string | null {
    if (!shortUrl) {
      return null;
    }

    try {
      // Handle both full URL and just the path
      if (shortUrl.startsWith(this.baseUrl)) {
        return shortUrl.slice(this.baseUrl.length);
      }

      // If it's just the path part
      if (shortUrl.includes('/')) {
        const parts = shortUrl.split('/');
        return parts[parts.length - 1];
      }

      // If it's just the code
      return shortUrl;
    } catch (error) {
      console.log(error);
      return null;
    }
  }
}
