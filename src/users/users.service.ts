import { Injectable } from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) { }

  public async getUserProfile(userId: string): Promise<any> {
    try {
      const profile = await this.prisma.profile.findUnique({
        where: { userId: userId },
      });

      if (!profile) {
        throw new Error('Profile not found');
      }

      return { data: { profile } };
    } catch (error) {
      throw new Error(`Error fetching user profile: ${error.message}`);
    }
  }
}
