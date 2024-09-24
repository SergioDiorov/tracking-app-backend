import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Supabase } from 'src/auth/supabase/supabase';
import { throwError } from 'src/helpers/throwError';
import { AddUserToOrganizationDto, CreateOrganizationDto } from 'src/organizations/dto/organizations.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class OrganizationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly supabase: Supabase,
  ) { }

  public async createOrganization({ dto, userId, avatar }: { dto: CreateOrganizationDto, userId: string, avatar?: Express.Multer.File }): Promise<any> {
    try {
      const supabaseClient = this.supabase.getClient();

      // Check if profile exists with userId
      const profile = await this.prisma.profile.findUnique({
        where: { userId: userId },
      });

      if (!profile) {
        throw new BadRequestException('Profile does not exist for this user');
      }

      // Check if user is owner of organization
      const existingOrganization = await this.prisma.organization.findUnique({
        where: { ownerId: userId },
      });

      if (existingOrganization) {
        throw new BadRequestException('User already owns an organization');
      }

      // Check if user is already a member of organization
      const existingMember = await this.prisma.organizationMember.findUnique({
        where: { user: userId },
      });

      if (existingMember) {
        throw new BadRequestException('User is already a member of organization');
      }

      let urlAvatarData = null;

      if (avatar) {
        // Upload the avatar
        const { data: avatarData, error: avatarError } = await supabaseClient.storage
          .from('organizations_avatars')
          .upload(`organization_avatar_${Date.now()}.png`, avatar.buffer, {
            contentType: avatar.mimetype,
            upsert: false
          });

        if (avatarError) {
          throw new Error(avatarError.message);
        }

        // Get the signed URL for the new avatar
        const { data: newAvatarSignedURL, error: imageError } = await supabaseClient
          .storage
          .from('organizations_avatars')
          .createSignedUrl(avatarData.path, 60 * 60 * 24 * 365 * 5)

        if (imageError) {
          throw new Error(imageError.message);
        }
        urlAvatarData = newAvatarSignedURL.signedUrl || null;
      }

      const newOrganization = await this.prisma.organization.create({
        data: {
          ...dto,
          ownerId: userId,
          avatar: urlAvatarData,
        },
      });

      return {
        data: { organization: newOrganization },
        message: 'Organization created successfully!',
      };
    } catch (error) {
      throwError({
        error,
        customMessage: `Failed to create organization: ${error.message}`,
      });
    }
  }

  public async getUserOrganization(userId: string): Promise<any> {
    try {
      // Search if user is owner of organization
      const ownerOrganization = await this.prisma.organization.findFirst({
        where: {
          ownerId: userId,
        }
      });

      if (ownerOrganization) {
        return { data: { organization: ownerOrganization } };
      }

      // Search if user is member of organization
      const member = await this.prisma.organizationMember.findUnique({
        where: { user: userId },
      });

      if (member) {
        const organization = await this.prisma.organization.findFirst({
          where: {
            id: member.organizationId
          }
        });

        return { data: { organization } };
      }

      throw new NotFoundException('Organization not found');

    } catch (error) {
      throwError({
        error,
        customMessage: error.message,
      });
    }
  }


  public async getOrganizationMembers({
    organizationId,
    limit = 10,
    page = 1
  }: {
    organizationId: string;
    limit: number;
    page: number;
  }): Promise<any> {
    try {
      // Search if organization exists
      const organization = await this.prisma.organization.findFirst({
        where: {
          id: organizationId,
        }
      });

      if (!organization) {
        throw new NotFoundException('Organization not found');
      }

      // Calculate pagination parameters
      const skip = (page - 1) * limit;

      // Search organization members
      const members = await this.prisma.organizationMember.findMany({
        where: { organizationId: organizationId },
        include: {
          userProfile: {
            select: {
              firstName: true,
              lastName: true,
              age: true,
              country: true,
              avatar: true,
            }
          }
        },
        take: limit,
        skip: skip,
      });

      // Get total count of members for pagination info
      const totalCount = await this.prisma.organizationMember.count({
        where: { organizationId: organizationId },
      });

      const totalPages = Math.ceil(totalCount / limit);

      return {
        data: { members },
        pagination: {
          totalItems: totalCount,
          totalPages,
          currentPage: page,
          pageSize: limit,
        },
      };

    } catch (error) {
      throwError({
        error,
        customMessage: error.message,
      });
    }
  }

  public async addUserToOrganization({
    organizationId,
    ownerId,
    dto
  }: {
    organizationId: string,
    ownerId: string,
    dto: AddUserToOrganizationDto
  }): Promise<any> {
    try {
      // Check if organization exists with organizationId
      const organization = await this.prisma.organization.findUnique({
        where: { id: organizationId },
      });

      if (!organization) {
        throw new NotFoundException('Organization not found');
      }

      // Check if the user is the owner of the organization
      if (organization.ownerId !== ownerId) {
        throw new BadRequestException('User is not owner of this organization');
      }

      // Check if profile exists with userId
      const profile = await this.prisma.profile.findUnique({
        where: { email: dto.email },
      });

      if (!profile) {
        throw new BadRequestException('Profile does not exist for this email');
      }

      const userId = profile.userId;

      // Check if user is already a member of organization
      const existingMember = await this.prisma.organizationMember.findUnique({
        where: { user: userId },
      });

      if (existingMember) {
        throw new BadRequestException('User is already a member of organization');
      }

      const member = await this.prisma.organizationMember.create({
        data: {
          user: userId,
          organizationId: organizationId,
          ...dto,
        },
      });

      // Update organization membersIds
      await this.prisma.organization.update({
        where: { id: organizationId },
        data: {
          membersIds: {
            push: userId,
          },
        },
      });

      return {
        data: { member },
        message: 'User added to organization successfully',
      };
    } catch (error) {
      throwError({
        error,
        customMessage: error.message,
      });
    }
  }

}
