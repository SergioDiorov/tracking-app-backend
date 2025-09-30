import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Supabase } from 'src/auth/supabase/supabase';
import { throwError } from 'src/helpers/throwError';
import {
  AddUserToOrganizationDto,
  CreateOrganizationDto,
  CreateOrganizationTaskDto,
  UpdateOrganizationTaskDto,
} from 'src/organizations/dto/organizations.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma, WorkStatus } from '@prisma/client';
import { formatOrganizationAnalytics } from 'src/helpers/formatOrganizationAnalytics';

@Injectable()
export class OrganizationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly supabase: Supabase,
  ) { }

  public async createOrganization({
    dto,
    userId,
    avatar,
  }: {
    dto: CreateOrganizationDto;
    userId: string;
    avatar?: Express.Multer.File;
  }): Promise<any> {
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
        throw new BadRequestException(
          'User is already a member of organization',
        );
      }

      let urlAvatarData = null;

      if (avatar) {
        // Upload the avatar
        const { data: avatarData, error: avatarError } =
          await supabaseClient.storage
            .from('organizations-avatars')
            .upload(`organization_avatar_${Date.now()}.png`, avatar.buffer, {
              contentType: avatar.mimetype,
              upsert: false,
            });

        if (avatarError) {
          throw new Error(avatarError.message);
        }

        // Get the signed URL for the new avatar
        const { data: newAvatarSignedURL, error: imageError } =
          await supabaseClient.storage
            .from('organizations-avatars')
            .createSignedUrl(avatarData.path, 60 * 60 * 24 * 365 * 5);

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
        },
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
            id: member.organizationId,
          },
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
    userId = null,
    sortBy = 'joined',
    sortOrder = 'desc',
  }: {
    organizationId: string;
    limit: number;
    page: number;
    search?: string;
    userId?: string;
    sortBy?: string;
    sortOrder?: string;
  }): Promise<any> {
    try {
      // Search if organization exists
      const organization = await this.prisma.organization.findFirst({
        where: {
          id: organizationId,
        },
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
        ...(userId && { user: userId }),
        ...(search && {
          userProfile: {
            is: {
              OR: search
                .split(' ')
                .filter(Boolean)
                .flatMap((item) => [
                  {
                    firstName: {
                      contains: item,
                      mode: Prisma.QueryMode.insensitive,
                    },
                  },
                  {
                    lastName: {
                      contains: item,
                      mode: Prisma.QueryMode.insensitive,
                    },
                  },
                ]),
            },
          },
        }),
      };

      const profileSortFields = ['firstName', 'age', 'country'];

      const orderBy = profileSortFields.includes(sortBy) ? {
        userProfile: {
          [sortBy]: sortOrder,
        },
      } : { [sortBy]: sortOrder, }

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
                userId: true,
              },
            },
          },
          take: limit,
          skip: skip,
          orderBy,
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

  public async getAllOrganizationMembersForExport({
    organizationId,
  }: {
    organizationId: string;
  }): Promise<any> {
    try {
      const organization = await this.prisma.organization.findFirst({
        where: {
          id: organizationId,
        },
      });

      if (!organization) {
        throw new NotFoundException('Organization not found');
      }

      const members = await this.prisma.organizationMember.findMany({
        where: {
          organizationId: organizationId,
        },
        include: {
          userProfile: {
            select: {
              firstName: true,
              lastName: true,
              age: true,
              country: true,
              avatar: true,
              userId: true,
            },
          },
        },
        orderBy: {
          joined: 'desc',
        },
      });

      const formattedMembers = members.map((member) => ({
        firstName: member.userProfile?.firstName,
        lastName: member.userProfile?.lastName,
        age: member.userProfile?.age,
        country: member.userProfile?.country,
        joined: member.joined,
        email: member.email,
        position: member.position,
        workSchedule: member.workSchedule,
        workHours: member.workHours,
        salary: member.salary,
        type: member.type,
        workExperienceMonth: member.workExperienceMonth,
        role: member.role,
      }));

      return { data: { members: formattedMembers } };
    } catch (error) {
      throwError({
        error,
        customMessage: error.message,
      });
    }
  }

  public async getOrganizationMembersById({
    organizationId,
    userId,
  }: {
    organizationId: string;
    userId: string;
  }): Promise<any> {
    try {
      // Search if organization exists
      const organization = await this.prisma.organization.findFirst({
        where: {
          id: organizationId,
        },
      });

      if (!organization) {
        throw new NotFoundException('Organization not found');
      }

      // Search organization member
      const member = await this.prisma.organizationMember.findFirst({
        where: { organizationId: organizationId, user: userId },
      });

      return {
        data: { member },
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
    dto,
  }: {
    organizationId: string;
    ownerId: string;
    dto: AddUserToOrganizationDto;
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
        throw new BadRequestException(
          'User is already a member of organization',
        );
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
      if (
        (!member ||
          member.organizationId !== organizationId ||
          member.role !== 'Admin') &&
        organization.ownerId !== user
      ) {
        throw new ForbiddenException(
          'You have no access to create tasks in this organization',
        );
      }

      const assignee = await this.prisma.organizationMember.findUnique({
        where: { user: dto.assignee },
      });

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

  public async updateOrganizationTask({
    organizationId,
    taskId,
    user,
    dto,
  }: {
    organizationId: string;
    taskId: string;
    user: string;
    dto: UpdateOrganizationTaskDto;
  }): Promise<any> {
    try {
      const organization = await this.prisma.organization.findUnique({
        where: { id: organizationId },
      });

      // Check if organiaztion exists
      if (!organization) {
        throw new NotFoundException('Organization not found');
      }

      const task = await this.prisma.organizationTask.findUnique({
        where: { id: taskId },
      });

      // Check if task exists
      if (!task) {
        throw new NotFoundException('Task not found');
      }

      const member = await this.prisma.organizationMember.findUnique({
        where: { user },
      });

      // Check if user is admin or owner
      if (
        (!member ||
          member.organizationId !== organizationId ||
          member.role !== 'Admin') &&
        organization.ownerId !== user
      ) {
        throw new ForbiddenException(
          'You have no access to update tasks in this organization',
        );
      }

      // Check if assigned user is from organization
      if (dto.assignee) {
        const assignee = await this.prisma.organizationMember.findUnique({
          where: { user: dto.assignee },
        });

        if (!assignee || assignee.organizationId !== organizationId) {
          throw new BadRequestException('Invalid assignee for this organization');
        }
      }

      // update task
      const updatedTask = await this.prisma.organizationTask.update({
        where: { id: taskId },
        data: dto,
      });

      return {
        data: { task: updatedTask },
        message: 'Task updated successfully',
      };
    } catch (error) {
      throwError({
        error,
        customMessage: error.message,
      });
    }
  }

  public async deleteOrganizationTask({
    organizationId,
    taskId,
    user,
  }: {
    organizationId: string;
    taskId: string;
    user: string;
  }): Promise<any> {
    try {
      const organization = await this.prisma.organization.findUnique({
        where: { id: organizationId },
      });

      // Check if organiaztion exists
      if (!organization) {
        throw new NotFoundException('Organization not found');
      }

      const task = await this.prisma.organizationTask.findUnique({
        where: { id: taskId },
      });

      // Check if task exists
      if (!task) {
        throw new NotFoundException('Task not found');
      }

      const member = await this.prisma.organizationMember.findUnique({
        where: { user },
      });

      // Check if user is admin or owner
      if (
        (!member ||
          member.organizationId !== organizationId ||
          member.role !== 'Admin') &&
        organization.ownerId !== user
      ) {
        throw new ForbiddenException(
          'You have no access to delete tasks in this organization',
        );
      }

      // delete task
      await this.prisma.organizationTask.delete({
        where: { id: taskId },
      });

      return {
        message: 'Task deleted successfully',
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
    searchByUserId,
    filterByWorkStatus,
  }: {
    organizationId: string;
    user: string;
    limit?: number;
    page?: number;
    sortBy?: string;
    sortOrder?: string;
    searchByUserId?: string;
    filterByWorkStatus?: WorkStatus;
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
          throw new ForbiddenException(
            'You have no access to this organization tasks',
          );
        }

        if (member.role === 'Admin') {
          isAdminOrOwner = true;
        }
      }

      const taskWhereCondition: Prisma.OrganizationTaskWhereInput = {
        organizationId,
        ...(isAdminOrOwner ? {} : { assignee: user }),
        ...(searchByUserId ? { assignee: searchByUserId } : {}),
        ...(filterByWorkStatus ? { workStatus: filterByWorkStatus } : {}),
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
    // user,
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
        const totalLoggedTimeSec = await this.prisma.organizationTask.aggregate(
          {
            _sum: { loggedTimeSec: true },
            where: {
              organizationId,
              deadline: { gte: new Date(startDate), lte: new Date(endDate) },
              assignee: searchByUserId,
            },
          },
        );

        const totalLoggedTimeSecMonth =
          await this.prisma.organizationTask.aggregate({
            _sum: { loggedTimeSec: true },
            where: {
              organizationId,
              deadline: { gte: monthStart, lte: monthEnd },
              assignee: searchByUserId,
            },
          });

        return {
          totalLoggedTimeSec: totalLoggedTimeSec._sum.loggedTimeSec || 0,
          totalLoggedTimeSecMonth:
            totalLoggedTimeSecMonth._sum.loggedTimeSec || 0,
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

  public async getOrganizationEmployersAnalytics({
    organizationId,
    user,
  }: {
    organizationId: string;
    user: string;
  }): Promise<any> {
    try {
      const organization = await this.prisma.organization.findUnique({
        where: { id: organizationId },
      });

      if (!organization) {
        throw new NotFoundException('Organization not found');
      }

      let isAdminOrOwner = false;

      if (organization.ownerId === user) {
        isAdminOrOwner = true;
      } else {
        const member = await this.prisma.organizationMember.findUnique({
          where: { user },
        });

        if (!member || member.organizationId !== organizationId) {
          throw new ForbiddenException(
            'You have no access to this organization tasks',
          );
        }

        if (member.role === 'Admin') {
          isAdminOrOwner = true;
        }
      }

      // Get all organization members with: salary | age | workExperienceMonth
      const members = await this.prisma.organizationMember.findMany({
        where: { organizationId },
        select: {
          salary: true,
          workExperienceMonth: true,
          userProfile: {
            select: { age: true },
          },
        },
      });

      // Define ranges for salary, age, and experience
      const ranges = {
        salaryRanges: [
          { min: 0, max: 500, label: '0 - 500' },
          { min: 500, max: 1000, label: '500 - 1000' },
          { min: 1000, max: 1500, label: '1000 - 1500' },
          { min: 1500, max: 2000, label: '1500 - 2000' },
          { min: 2000, max: 3000, label: '2000 - 3000' },
          { min: 3000, max: Infinity, label: '3000+' },
        ],
        ageRanges: [
          { min: 18, max: 25, label: '18 - 25' },
          { min: 26, max: 35, label: '26 - 35' },
          { min: 36, max: 45, label: '36 - 45' },
          { min: 46, max: 55, label: '46 - 55' },
          { min: 56, max: 65, label: '56 - 65' },
          { min: 66, max: Infinity, label: '65+' },
        ],
        expRanges: [
          { min: 0, max: 12, label: '0 - 1 year' },
          { min: 13, max: 24, label: '1 - 2 years' },
          { min: 25, max: 60, label: '2 - 5 years' },
          { min: 61, max: 96, label: '5 - 8 years' },
          { min: 97, max: Infinity, label: '8+ years' },
        ],
      };

      // Format the salary results
      const salaryResult = formatOrganizationAnalytics(
        members,
        ranges.salaryRanges,
        (m) => m.salary ?? 0,
      );

      // Format the age results
      const ageResult = formatOrganizationAnalytics(
        members,
        ranges.ageRanges,
        (m) => (m.userProfile?.age ? parseInt(m.userProfile.age, 10) : null),
      );

      // Format the experience results
      const expResult = formatOrganizationAnalytics(
        members,
        ranges.expRanges,
        (m) => m.workExperienceMonth ?? 0,
      );

      return {
        data: {
          salary: salaryResult,
          age: ageResult,
          experience: expResult,
        },
      };
    } catch (error) {
      throwError({
        error,
        customMessage: error.message,
      });
    }
  }

  public async getOrganizationTasksAnalytics({
    organizationId,
    user,
  }: {
    organizationId: string;
    user: string;
  }): Promise<any> {
    try {
      const organization = await this.prisma.organization.findUnique({
        where: { id: organizationId },
      });

      if (!organization) {
        throw new NotFoundException('Organization not found');
      }

      let isAdminOrOwner = false;

      if (organization.ownerId === user) {
        isAdminOrOwner = true;
      } else {
        const member = await this.prisma.organizationMember.findUnique({
          where: { user },
        });

        if (!member || member.organizationId !== organizationId) {
          throw new ForbiddenException(
            'You have no access to this organization tasks',
          );
        }

        if (member.role === 'Admin') {
          isAdminOrOwner = true;
        }
      }

      // Get all organization tasks with: loggedTimeSec | priority | workStatus
      const allTasks = await this.prisma.organizationTask.findMany({
        where: { organizationId },
        select: {
          loggedTimeSec: true,
          finishedAt: true,
          createdAt: true,
          priority: true,
          workStatus: true,
        },
      });

      // Collect logged time data
      const monthlyData: { [key: string]: number } = {};
      for (const task of allTasks) {
        if (task.loggedTimeSec) {
          const date = task.finishedAt ?? task.createdAt;
          const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1)
            .toString()
            .padStart(2, '0')}`;

          if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = 0;
          }
          monthlyData[monthKey] += task.loggedTimeSec;
        }
      }

      const loggedTime = Object.entries(monthlyData).map(
        ([month, totalSec]) => ({
          month,
          hours: Math.round(totalSec / 3600),
        }),
      );

      // Collect priority data
      const priorityCounts: Record<string, number> = {};
      for (const task of allTasks) {
        const key = task.priority;
        if (!priorityCounts[key]) {
          priorityCounts[key] = 0;
        }
        priorityCounts[key] += 1;
      }

      // Collect work status data
      const workStatusCounts: Record<string, number> = {};
      for (const task of allTasks) {
        const key = task.workStatus;
        if (!workStatusCounts[key]) {
          workStatusCounts[key] = 0;
        }
        workStatusCounts[key] += 1;
      }

      return {
        data: {
          loggedTime,
          tasksByPriority: priorityCounts,
          tasksByWorkStatus: workStatusCounts,
        },
      };
    } catch (error) {
      throwError({
        error,
        customMessage: error.message,
      });
    }
  }
}
