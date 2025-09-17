import { Module } from '@nestjs/common';

import { TaskLogsService } from './task-logs.service';
import { TaskLogsController } from './task-logs.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { SupabaseModule } from 'src/auth/supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  controllers: [TaskLogsController],
  providers: [TaskLogsService, PrismaService],
})
export class TaskLogsModule {}
