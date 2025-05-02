import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UrlModule } from './url/url.module';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://localhost:27017/url-shortener'),
    UrlModule,
  ],
})
export class AppModule {}
