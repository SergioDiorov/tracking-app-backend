import { Module } from '@nestjs/common';

import { OrganizationsService } from './organizations.service';
import { OrganizationsController } from './organizations.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { SupabaseModule } from 'src/auth/supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  controllers: [OrganizationsController],
  providers: [OrganizationsService, PrismaService],
})
export class OrganizationsModule { }
