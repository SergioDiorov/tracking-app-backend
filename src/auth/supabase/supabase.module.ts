import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { SupabaseStrategy } from '../../auth/supabase/supabase.strategy';
import { SupabaseGuard } from '../../auth/supabase/supabase.guard';
import { Supabase } from '../../auth/supabase/supabase';

@Module({
  imports: [ConfigModule],
  providers: [Supabase, SupabaseStrategy, SupabaseGuard],
  exports: [Supabase, SupabaseStrategy, SupabaseGuard],
})
export class SupabaseModule { }
