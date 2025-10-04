import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as express from 'express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.use(express.static(join(__dirname, '..', 'public')));

  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(join(__dirname, '..', 'public', 'index.html'));
  });

  app.enableCors({
    origin: ["https://jpburl.onrender.com", "http://localhost:5173"],
    methods: "GET,POST,PUT,DELETE",
  });
  await app.listen(process.env.PORT || 3000, "0.0.0.0");
}
bootstrap();
