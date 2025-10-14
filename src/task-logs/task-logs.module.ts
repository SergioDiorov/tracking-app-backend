import { Module } from '@nestjs/common';

import { TaskLogsService } from '../task-logs/task-logs.service';
import { TaskLogsController } from '../task-logs/task-logs.controller';
import { PrismaService } from '../prisma/prisma.service';
import { SupabaseModule } from '../auth/supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  controllers: [TaskLogsController],
  providers: [TaskLogsService, PrismaService],
})
export class TaskLogsModule {}
