import { Injectable } from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';
import { Supabase } from 'src/auth/supabase/supabase';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService, private readonly supabase: Supabase,) { }

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

  public async uploadFile(file: Express.Multer.File): Promise<any> {
    try {
      const supabaseClient = this.supabase.getClient();
      const { data, error } = await supabaseClient.storage
        .from('avatars')
        .upload(`avatar_${Date.now()}.png`, file.buffer, {
          contentType: file.mimetype,
        });

      if (error) {
        throw new Error(error.message);
      }
      console.log(data);

      // const { publicURL, error: publicUrlError } = supabase.storage
      //   .from('avatars')
      //   .getPublicUrl(`avatar_${file.originalname}`);

      // if (publicUrlError) {
      //   throw new Error(publicUrlError.message);
      // }

      return {
        message: 'File uploaded successfully!',
        data,
      };
    } catch (error) {
      throw new Error(`Failed to upload file: ${error.message}`);
    }
  }
}
