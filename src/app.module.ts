import { Module, ValidationPipe } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { APP_PIPE, APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';

import { SupabaseGuard } from 'src/auth/supabase/supabase.guard';
import { PrismaService } from 'src/prisma/prisma.service';
import { SupabaseModule } from 'src/auth/supabase/supabase.module';
import { AuthModule } from 'src/auth/auth.module';
import { UsersModule } from 'src/users/users.module';
import { OrganizationsModule } from './organizations/organizations.module';

@Module({
  imports: [ConfigModule.forRoot(), PassportModule, SupabaseModule, AuthModule, UsersModule, OrganizationsModule],
  providers: [
    {
      provide: APP_PIPE,
      useClass: ValidationPipe,
    },
    {
      provide: APP_GUARD,
      useClass: SupabaseGuard,
    },
    PrismaService
  ],
})
export class AppModule { }
