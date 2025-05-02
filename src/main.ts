import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for frontend integration
  app.enableCors({
    origin: 'http://localhost:3002', // Next.js default port
    methods: ['GET', 'POST'],
    credentials: true,
  });

  await app.listen(8000);
  console.log(`Application is running on: http://localhost:8000`);
}
bootstrap();
