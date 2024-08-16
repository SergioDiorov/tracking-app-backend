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

  public async uploadFile({ file, userId }: { file: Express.Multer.File, userId: string }): Promise<any> {
    try {
      const supabaseClient = this.supabase.getClient();
      const { data, error } = await supabaseClient.storage
        .from('avatars')
        .upload(`avatar_${Date.now()}.png`, file.buffer, {
          contentType: file.mimetype,
          upsert: false
        });

      if (error) {
        throw new Error(error.message);
      }

      const { data: urlAvatarData, error: imageError } = await supabaseClient
        .storage
        .from('avatars')
        .createSignedUrl(data.path, 60 * 60 * 24 * 365 * 5)

      if (imageError) {
        throw new Error(imageError.message);
      }

      await this.prisma.profile.update({
        where: { userId },
        data: { avatar: urlAvatarData.signedUrl },
      });

      return {
        data: {
          avatarUrl: urlAvatarData.signedUrl,
        },
        message: 'Avatar uploaded successfully!',
      };
    } catch (error) {
      throw new Error(`Failed to upload file: ${error.message}`);
    }
  }
}
