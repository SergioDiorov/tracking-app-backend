import { Module, ValidationPipe } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';

import { AuthModule } from 'src/auth/auth.module';
import { UsersModule } from 'src/users/users.module';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  imports: [AuthModule, UsersModule],
  providers: [
    {
      provide: APP_PIPE,
      useClass: ValidationPipe,
    },
    PrismaService
  ],
})
export class AppModule { }
