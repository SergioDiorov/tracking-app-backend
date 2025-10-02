import {
  Body,
  Controller,
  Delete,
  FileTypeValidator,
  Get,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  Patch,
  Post,
  Query,
  Request,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { OrganizationsService } from 'src/organizations/organizations.service';
import {
  AddUserToOrganizationDto,
  CreateOrganizationDto,
  CreateOrganizationTaskDto,
  GetOrganizationMembersDto,
  GetOrganizationTasksAnalytics,
  GetOrganizationTasksDto,
  GetOrganizationTasksProgress,
  UpdateOrganizationTaskDto,
  UpdateUserFromOrganizationDto,
} from 'src/organizations/dto/organizations.dto';

@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) { }

  // Get user organization
  @Get(':userId')
  getUserOrganization(@Param('userId') userId: string): Promise<any> {
    return this.organizationsService.getUserOrganization(userId);
  }

  // Create organization
  @Post('')
  @UseInterceptors(FileInterceptor('file'))
  async createOrganization(
    @Body() dto: CreateOrganizationDto,
    @Request() req: any,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<any> {
    if (file) {
      const pipe = new ParseFilePipe({
        validators: [
          new FileTypeValidator({ fileType: '.(png|jpeg|jpg)' }),
          new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 4 }),
        ],
      });

      await pipe.transform(file);
    }

    return this.organizationsService.createOrganization({
      dto,
      userId: req.user.sub,
      avatar: file,
    });
  }

  // Get organization all members
  @Get('members/:organizationId')
  getOrganizationMembers(
    @Param('organizationId') organizationId: string,
    @Query() dto: GetOrganizationMembersDto,
  ): Promise<any> {
    const limit = dto.limit ? Number(dto.limit) : 10;
    const page = dto.page ? Number(dto.page) : 1;
    const search = dto.search || undefined;
    const userId = dto.userId || undefined;

    return this.organizationsService.getOrganizationMembers({
      organizationId,
      limit,
      page,
      search,
      userId,
      sortBy: dto.sortBy || 'joined',
      sortOrder: dto.sortOrder || 'desc',
    });
  }

  // Get all members for export
  @Get('members/:organizationId/export')
  getAllOrganizationMembersForExport(
    @Param('organizationId') organizationId: string,
  ): Promise<any> {
    return this.organizationsService.getAllOrganizationMembersForExport({
      organizationId,
    });
  }

  // Get member from organization
  @Get('members/:organizationId/:userId')
  getOrganizationMembersById(
    @Param('organizationId') organizationId: string,
    @Param('userId') userId: string,
  ): Promise<any> {
    return this.organizationsService.getOrganizationMembersById({
      organizationId,
      userId,
    });
  }

  // Add user to oganization
  @Post(':organizationId/add')
  addUserToOrganization(
    @Param('organizationId') organizationId: string,
    @Request() req: any,
    @Body() dto: AddUserToOrganizationDto,
  ): Promise<any> {
    return this.organizationsService.addUserToOrganization({
      organizationId,
      ownerId: req.user.sub,
      dto,
    });
  }

  // Update user from oganization
  @Patch(':organizationId/member/:userId')
  updateUserFromOrganization(
    @Param('organizationId') organizationId: string,
    @Param('userId') userId: string,
    @Request() req: any,
    @Body() dto: Partial<UpdateUserFromOrganizationDto>,
  ): Promise<any> {
    return this.organizationsService.updateUserFromOrganization({
      organizationId,
      user: req.user.sub,
      userToUpdate: userId,
      dto,
    });
  }

  // Delete user from oganization
  @Delete(':organizationId/member/:userId')
  deleteUserFromOrganization(
    @Param('organizationId') organizationId: string,
    @Param('userId') userId: string,
    @Request() req: any,
  ): Promise<any> {
    return this.organizationsService.deleteUserFromOrganization({
      organizationId,
      user: req.user.sub,
      userToDelete: userId,
    });
  }

  // Create organization task
  @Post(':organizationId/tasks/create')
  createOrganizationTask(
    @Param('organizationId') organizationId: string,
    @Request() req: any,
    @Body() dto: CreateOrganizationTaskDto,
  ): Promise<any> {
    return this.organizationsService.createOrganizationTask({
      organizationId,
      user: req.user.sub,
      dto,
    });
  }

  // Update organization task
  @Patch(':organizationId/tasks/update/:taskId')
  async updateTaskLog(
    @Param('organizationId') organizationId: string,
    @Param('taskId') taskId: string,
    @Request() req: any,
    @Body() dto: Partial<UpdateOrganizationTaskDto>,
  ): Promise<any> {
    return this.organizationsService.updateOrganizationTask({
      organizationId,
      taskId,
      user: req.user.sub,
      dto,
    });
  }

  // Delete organization task
  @Delete(':organizationId/tasks/:taskId')
  async deleteOrganizationTask(
    @Param('organizationId') organizationId: string,
    @Param('taskId') taskId: string,
    @Request() req: any,
  ): Promise<any> {
    return this.organizationsService.deleteOrganizationTask({
      organizationId,
      taskId,
      user: req.user.sub,
    });
  }


  // Get all tasks in organization
  @Get(':organizationId/tasks')
  getOrganizationTasks(
    @Param('organizationId') organizationId: string,
    @Request() req: any,
    @Query() dto: GetOrganizationTasksDto,
  ): Promise<any> {
    const limit = dto.limit ? Number(dto.limit) : 10;
    const page = dto.page ? Number(dto.page) : 1;

    return this.organizationsService.getOrganizationTasks({
      organizationId,
      limit,
      page,
      searchByUserId: dto.userId,
      user: req.user.sub,
      sortBy: dto.sortBy || 'createdAt',
      sortOrder: dto.sortOrder || 'desc',
      filterByWorkStatus: dto?.filterByWorkStatus,
    });
  }

  // Get weekly tasks progress in organization
  @Get(':organizationId/tasks/progress-weekly')
  getOrganizationTasksProgress(
    @Param('organizationId') organizationId: string,
    @Request() req: any,
    @Query() dto: GetOrganizationTasksProgress,
  ): Promise<any> {
    return this.organizationsService.getOrganizationTasksProgress({
      organizationId,
      searchByUserId: dto.userId,
      user: req.user.sub,
      startDate: dto.startDate,
      endDate: dto.endDate,
    });
  }

  // Get employers analytics in organization
  @Get(':organizationId/analytics/employers')
  getOrganizationEmployersAnalytics(
    @Param('organizationId') organizationId: string,
    @Request() req: any,
  ): Promise<any> {
    return this.organizationsService.getOrganizationEmployersAnalytics({
      organizationId,
      user: req.user.sub,
    });
  }

  // Get tasks analytics in organization
  @Get(':organizationId/analytics/tasks')
  getOrganizationTasksAnalytics(
    @Param('organizationId') organizationId: string,
    @Request() req: any,
    @Query() dto: GetOrganizationTasksAnalytics,
  ): Promise<any> {
    return this.organizationsService.getOrganizationTasksAnalytics({
      organizationId,
      user: req.user.sub,
      userToSearch: dto?.userToSearch || undefined
    });
  }
}
