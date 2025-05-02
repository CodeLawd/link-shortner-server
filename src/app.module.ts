import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UrlModule } from './url/url.module';

const MONGO_URI =
  process.env.MONGO_URI || 'mongodb://localhost:27017/url-shortener';

@Module({
  imports: [MongooseModule.forRoot(MONGO_URI), UrlModule],
})
export class AppModule {}
