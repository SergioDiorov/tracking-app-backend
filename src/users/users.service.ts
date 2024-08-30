import { Injectable } from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';
import { Supabase } from 'src/auth/supabase/supabase';
import { ProfilePatchDataDto } from 'src/users/dto/users.dto';

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

  public async updateProfile({ userId, updateProfileDto }: { userId: string, updateProfileDto: ProfilePatchDataDto }): Promise<any> {
    try {
      // Find existing profile
      const profile = await this.prisma.profile.findUnique({
        where: { userId: userId },
      });

      if (!profile) {
        throw new Error('Profile not found');
      }

      // Update the profile with the new data
      const updatedProfile = await this.prisma.profile.update({
        where: { userId: userId },
        data: {
          ...updateProfileDto,
        },
      });

      return { data: { profile: updatedProfile } };
    } catch (error) {
      throw new Error(`Error fetching user profile: ${error.message}`);
    }
  }

  public async uploadFile({ file, userId }: { file: Express.Multer.File, userId: string }): Promise<any> {
    try {
      const supabaseClient = this.supabase.getClient();

      const profile = await this.prisma.profile.findUnique({
        where: { userId },
      });

      // Remove avatar from storage before update, if exsists
      if (profile.avatar) {
        const regex = /avatars\/([^/?]+)/;
        const match = profile.avatar.match(regex);

        const { error: deleteError } = await supabaseClient
          .storage
          .from('avatars')
          .remove([match[1]]);

        if (deleteError) {
          throw new Error(`Error removing old avatar: ${deleteError.message}`);
        }
      }

      // Upload the new file
      const { data, error } = await supabaseClient.storage
        .from('avatars')
        .upload(`avatar_${Date.now()}.png`, file.buffer, {
          contentType: file.mimetype,
          upsert: false
        });

      if (error) {
        throw new Error(error.message);
      }

      // Get the signed URL for the new avatar
      const { data: urlAvatarData, error: imageError } = await supabaseClient
        .storage
        .from('avatars')
        .createSignedUrl(data.path, 60 * 60 * 24 * 365 * 5)

      if (imageError) {
        throw new Error(imageError.message);
      }

      // Update the profile with the new avatar URL
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

  public async deleteAvatarFile(userId: string): Promise<any> {
    try {
      const supabaseClient = this.supabase.getClient();
      const profile = await this.prisma.profile.findUnique({
        where: { userId },
      });

      if (profile.avatar) {
        const regex = /avatars\/([^/?]+)/;
        const match = profile.avatar.match(regex);

        await this.prisma.profile.update({
          where: { userId },
          data: { avatar: null },
        });

        await supabaseClient
          .storage
          .from('avatars')
          .remove([match[1]])
      }

      return {
        message: 'Avatar deleted successfully!',
      };
    } catch (error) {
      throw new Error(`Failed to upload file: ${error.message}`);
    }
  }
}
