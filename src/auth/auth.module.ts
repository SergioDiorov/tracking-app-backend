import { Module } from '@nestjs/common';

import { AuthController } from '../auth/auth.controller';
import { AuthService } from '../auth/auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { SupabaseModule } from '../auth/supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  controllers: [AuthController],
  providers: [AuthService, PrismaService],
})
export class AuthModule { }
