import { Module } from '@nestjs/common';

import { UsersController } from 'src/users/users.controller';
import { UsersService } from 'src/users/users.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { SupabaseModule } from 'src/auth/supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  controllers: [UsersController],
  providers: [UsersService, PrismaService],
})
export class UsersModule { }
