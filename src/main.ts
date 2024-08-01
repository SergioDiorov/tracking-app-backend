import { NestFactory } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';

const PORT = 3001;

async function bootstrap() {
  const app = await NestFactory.create(AuthModule);
  await app.listen(PORT);
  console.log(`Connected to PORT: ${PORT}`);
}
bootstrap();
