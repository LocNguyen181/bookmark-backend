import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as express from 'express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.use(express.static(join(__dirname, '..', 'public')));

  // Fallback cho React Router
  app.getHttpAdapter().get('*', (req, res) => {
    res.sendFile(join(__dirname, '..', 'public', 'index.html'));
  });

  app.enableCors({
    origin: "https://jpburl.onrender.com",
    methods: "GET,POST,PUT,DELETE",
  });
  await app.listen(process.env.PORT || 3000);
}
bootstrap();
