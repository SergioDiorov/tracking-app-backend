import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Supabase } from 'src/auth/supabase/supabase';
import { throwError } from 'src/helpers/throwError';
import { AddUserToOrganizationDto, CreateOrganizationDto, CreateOrganizationTaskDto } from 'src/organizations/dto/organizations.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from '@prisma/client';

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
          .from('organizations-avatars')
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
          .from('organizations-avatars')
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
    page = 1,
    search = '',
  }: {
    organizationId: string;
    limit: number;
    page: number;
    search?: string;
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
      // const members = await this.prisma.organizationMember.findMany({
      //   where: { organizationId: organizationId },
      //   include: {
      //     userProfile: {
      //       select: {
      //         firstName: true,
      //         lastName: true,
      //         age: true,
      //         country: true,
      //         avatar: true,
      //       }
      //     }
      //   },
      //   take: limit,
      //   skip: skip,
      // });

      // Get total count of members for pagination info
      // const totalCount = await this.prisma.organizationMember.count({
      //   where: { organizationId: organizationId },
      // });

      const whereCondition = {
        organizationId: organizationId,
        ...(search && {
          userProfile: {
            is: {
              OR: [
                {
                  firstName: {
                    contains: search,
                    mode: Prisma.QueryMode.insensitive,
                  },
                },
                {
                  lastName: {
                    contains: search,
                    mode: Prisma.QueryMode.insensitive,
                  },
                },
              ],
            },
          },
        }),
      };

      const [members, totalCount] = await this.prisma.$transaction([
        this.prisma.organizationMember.findMany({
          where: whereCondition,
          include: {
            userProfile: {
              select: {
                firstName: true,
                lastName: true,
                age: true,
                country: true,
                avatar: true,
                userId: true

              },
            },
          },
          take: limit,
          skip: skip,
          orderBy: {
            joined: 'desc',
          },
        }),
        this.prisma.organizationMember.count({
          where: whereCondition,
        }),
      ]);


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

  public async createOrganizationTask({
    organizationId,
    user,
    dto,
  }: {
    organizationId: string;
    user: string;
    dto: CreateOrganizationTaskDto;
  }): Promise<any> {
    try {
      const organization = await this.prisma.organization.findUnique({
        where: { id: organizationId },
      });

      // Check if organiaztion exists
      if (!organization) {
        throw new NotFoundException('Organization not found');
      }

      const member = await this.prisma.organizationMember.findUnique({
        where: { user },
      });

      // Check if user is admin or owner
      if ((!member || member.organizationId !== organizationId || member.role !== 'Admin') && organization.ownerId !== user) {
        throw new ForbiddenException('You have no access to create tasks in this organization');
      }

      const assignee = await this.prisma.organizationMember.findUnique({
        where: { user: dto.assignee },
      });
      console.log(assignee, 'assignee');

      if (!assignee || assignee.organizationId !== organizationId) {
        throw new BadRequestException('Invalid assignee for this organization');
      }

      // create new task
      const newTask = await this.prisma.organizationTask.create({
        data: {
          title: dto.title,
          descriptopn: dto.descriptopn,
          assignee: dto.assignee,
          priority: dto.priority,
          deadline: dto.deadline,
          organizationId,
        },
      });

      return {
        data: { task: newTask },
        message: 'Task created successfully',
      };
    } catch (error) {
      throwError({
        error,
        customMessage: error.message,
      });
    }
  }

  public async getOrganizationTasks({
    organizationId,
    user,
    limit = 10,
    page = 1,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    searchByUserId
  }: {
    organizationId: string;
    user: string;
    limit?: number;
    page?: number;
    sortBy?: string;
    sortOrder?: string;
    searchByUserId?: string;
  }): Promise<any> {
    try {
      const skip = (page - 1) * limit;

      const organization = await this.prisma.organization.findUnique({
        where: { id: organizationId },
      });

      // Check if organiaztion exists
      if (!organization) {
        throw new NotFoundException('Organization not found');
      }

      let isAdminOrOwner = false;

      // Check if user if member or owner
      if (organization.ownerId === user) {
        isAdminOrOwner = true;
      } else {
        const member = await this.prisma.organizationMember.findUnique({
          where: { user },
        });

        if (!member || member.organizationId !== organizationId) {
          throw new ForbiddenException('You have no access to this organization tasks');
        }

        if (member.role === 'Admin') {
          isAdminOrOwner = true;
        }
      };

      const taskWhereCondition: Prisma.OrganizationTaskWhereInput = {
        organizationId,
        ...(isAdminOrOwner ? {} : { assignee: user }),
        ...(searchByUserId ? { assignee: searchByUserId } : {}),
      };

      // Get organization taks
      const [tasks, totalCount] = await this.prisma.$transaction([
        this.prisma.organizationTask.findMany({
          where: taskWhereCondition,
          include: {
            assignedMember: {
              select: {
                userProfile: {
                  select: {
                    firstName: true,
                    lastName: true,
                    email: true,
                    avatar: true,
                  },
                },
              },
            },
          },
          take: limit,
          skip,
          orderBy: {
            [sortBy]: sortOrder,
          },
        }),
        this.prisma.organizationTask.count({
          where: taskWhereCondition,
        }),
      ]);

      const totalPages = Math.ceil(totalCount / limit);

      return {
        data: { tasks },
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

  public async getOrganizationTasksProgress({
    organizationId,
    searchByUserId,
    user,
    startDate,
    endDate,
  }: {
    organizationId: string;
    searchByUserId: string;
    user: string;
    startDate: string;
    endDate: string;
  }): Promise<any> {
    try {
      const organization = await this.prisma.organization.findUnique({
        where: { id: organizationId },
      });

      if (!organization) {
        throw new NotFoundException('Organization not found');
      }

      // let isAdminOrOwner = false;

      // if (organization.ownerId === user) {
      //   isAdminOrOwner = true;
      // } else {
      //   const member = await this.prisma.organizationMember.findUnique({
      //     where: { user },
      //   });

      //   if (!member || member.organizationId !== organizationId) {
      //     throw new ForbiddenException('You have no access to this organization tasks');
      //   }

      //   if (member.role === 'Admin') {
      //     isAdminOrOwner = true;
      //   }
      // }

      const start = new Date(startDate);
      const y = start.getUTCFullYear();
      const m = start.getUTCMonth();

      const monthStart = new Date(Date.UTC(y, m, 1, 0, 0, 0, 0));
      const monthEnd = new Date(Date.UTC(y, m + 1, 0, 23, 59, 59, 999));

      if (searchByUserId) {
        const totalLoggedTimeSec = await this.prisma.organizationTask.aggregate({
          _sum: { loggedTimeSec: true },
          where: {
            organizationId,
            deadline: { gte: new Date(startDate), lte: new Date(endDate) },
            assignee: searchByUserId,
          },
        });

        const totalLoggedTimeSecMonth = await this.prisma.organizationTask.aggregate({
          _sum: { loggedTimeSec: true },
          where: {
            organizationId,
            deadline: { gte: monthStart, lte: monthEnd },
            assignee: searchByUserId,
          },
        });

        return {
          totalLoggedTimeSec: totalLoggedTimeSec._sum.loggedTimeSec || 0,
          totalLoggedTimeSecMonth: totalLoggedTimeSecMonth._sum.loggedTimeSec || 0,
          dates: null,
        };
      }

      const dailyStats = await this.prisma.organizationTask.groupBy({
        by: ['deadline'],
        _sum: { loggedTimeSec: true },
        where: {
          organizationId,
          deadline: { gte: new Date(startDate), lte: new Date(endDate) },
        },
      });

      const dates: Record<string, number> = {};
      let totalLoggedTimeSec = 0;
      let totalLoggedTimeSecMonth = 0;

      dailyStats.forEach((item) => {
        const dateKey = item.deadline.toISOString().split('T')[0];
        const sec = item._sum.loggedTimeSec || 0;

        dates[dateKey] = (dates[dateKey] || 0) + sec;
        totalLoggedTimeSec += sec;

        if (item.deadline >= monthStart && item.deadline <= monthEnd) {
          totalLoggedTimeSecMonth += sec;
        }
      });

      return {
        totalLoggedTimeSec,
        totalLoggedTimeSecMonth,
        totalLoggedTimePerDates: dates,
      };
    } catch (error) {
      throwError({
        error,
        customMessage: error.message,
      });
    }
  }
}
