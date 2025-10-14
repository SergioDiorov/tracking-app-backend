import { NestFactory } from '@nestjs/core';

import { AppModule } from '../src/app.module';

const PORT = process.env.PORT;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: process.env.FRONTEND_ORIGIN_URL,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  await app.listen(PORT);
  console.log(`Connected to PORT: ${PORT}`);
}
bootstrap();
