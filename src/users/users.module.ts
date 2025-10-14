import { Module } from '@nestjs/common';

import { UsersController } from '../users/users.controller';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../prisma/prisma.service';
import { SupabaseModule } from '../auth/supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  controllers: [UsersController],
  providers: [UsersService, PrismaService],
})
export class UsersModule { }
