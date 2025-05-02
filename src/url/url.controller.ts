import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { Response } from 'express';
import { UrlService } from './url.service';

// Define a local interface that matches the structure from the service
interface UrlStatistics {
  originalUrl: string;
  shortPath: string;
  createdAt: string;
  visitCount: number;
  lastVisited: string;
  expiresAt: string;
}

@Controller()
export class UrlController {
  constructor(private readonly urlService: UrlService) {}

  @Post('api/encode')
  async encodeUrl(@Body() body: { url: string; expirationDays?: number }) {
    if (!body.url) {
      throw new HttpException('URL is required', HttpStatus.BAD_REQUEST);
    }

    try {
      const shortUrl = await this.urlService.encodeUrl(
        body.url,
        body.expirationDays,
      );
      return { shortUrl };
    } catch {
      throw new HttpException(
        'Failed to encode URL',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('api/decode')
  async decodeUrl(@Body() body: { shortUrl: string }) {
    if (!body.shortUrl) {
      throw new HttpException('Short URL is required', HttpStatus.BAD_REQUEST);
    }

    const originalUrl = await this.urlService.decodeUrl(body.shortUrl);

    if (!originalUrl) {
      throw new HttpException('Short URL not found', HttpStatus.NOT_FOUND);
    }

    return { url: originalUrl };
  }

  @Get('api/statistic/:path')
  async getStatistics(
    @Param('path') path: string,
  ): Promise<UrlStatistics | null> {
    const statistics = await this.urlService.getStatistics(path);

    if (!statistics) {
      throw new HttpException('URL not found', HttpStatus.NOT_FOUND);
    }

    return statistics;
  }

  @Get('api/list')
  async listUrls(): Promise<UrlStatistics[]> {
    return this.urlService.listAllUrls();
  }

  // @Get('api/search')
  // async searchUrls(@Query('q') query: string): Promise<UrlStatistics[]> {
  //   if (!query || query.length < 3) {
  //     throw new HttpException(
  //       'Search query must be at least 3 characters long',
  //       HttpStatus.BAD_REQUEST,
  //     );
  //   }

  //   return this.urlService.searchUrls(query);
  // }

  @Get(':path')
  async redirect(@Param('path') path: string) {
    const originalUrl = await this.urlService.visitUrl(path);

    if (!originalUrl) {
      throw new HttpException('URL not found', HttpStatus.NOT_FOUND);
    }

    return { url: originalUrl };
  }
}
