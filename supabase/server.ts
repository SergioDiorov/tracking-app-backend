/* eslint-disable prettier/prettier */
import { createClient } from '@supabase/supabase-js';
import { ConfigModule } from '@nestjs/config';

ConfigModule.forRoot();

export const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);