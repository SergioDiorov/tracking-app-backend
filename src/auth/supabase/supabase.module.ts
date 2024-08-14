import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { SupabaseStrategy } from 'src/auth/supabase/supabase.strategy';
import { SupabaseGuard } from 'src/auth/supabase/supabase.guard';
import { Supabase } from 'src/auth/supabase/supabase';

@Module({
  imports: [ConfigModule],
  providers: [Supabase, SupabaseStrategy, SupabaseGuard],
  exports: [Supabase, SupabaseStrategy, SupabaseGuard],
})
export class SupabaseModule { }