import { Module } from '@nestjs/common';

import { OrganizationsService } from '../organizations/organizations.service';
import { OrganizationsController } from '../organizations/organizations.controller';
import { PrismaService } from '../prisma/prisma.service';
import { SupabaseModule } from '../auth/supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  controllers: [OrganizationsController],
  providers: [OrganizationsService, PrismaService],
})
export class OrganizationsModule {}
