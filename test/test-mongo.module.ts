import { MongooseModule } from '@nestjs/mongoose';

export const TestMongoModule = MongooseModule.forRootAsync({
  useFactory: async () => ({
    uri: 'mongodb://localhost:27017/url-shortener-test',
    // Use a separate test database
    // This will be automatically created by Mongoose if it doesn't exist
    autoIndex: true,
  }),
}); 