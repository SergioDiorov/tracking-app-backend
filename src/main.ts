import { NestFactory } from '@nestjs/core';

import { AppModule } from 'src/app.module';

const PORT = 3001;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: 'http://localhost:3000',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  await app.listen(PORT);
  console.log(`Connected to PORT: ${PORT}`);
}
bootstrap();
