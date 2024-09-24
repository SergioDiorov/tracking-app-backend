import {
  Body,
  Controller,
  FileTypeValidator,
  Get,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  Post,
  Query,
  Request,
  UploadedFile,
  UseInterceptors
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { OrganizationsService } from 'src/organizations/organizations.service';
import {
  AddUserToOrganizationDto,
  CreateOrganizationDto,
  GetOrganizationMembersDto
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

    return this.organizationsService.createOrganization({ dto, userId: req.user.sub, avatar: file });
  }

  // Get organization all members
  @Get('members/:organizationId')
  getOrganizationMembers(
    @Param('organizationId') organizationId: string,
    @Query() dto: GetOrganizationMembersDto
  ): Promise<any> {
    const limit = dto.limit ? Number(dto.limit) : 10;
    const page = dto.page ? Number(dto.page) : 1;

    return this.organizationsService.getOrganizationMembers({ organizationId, limit, page });
  }

  // Add user to oganization
  @Post(':organizationId/add')
  addUserToOrganization(
    @Param('organizationId') organizationId: string,
    @Request() req: any,
    @Body() dto: AddUserToOrganizationDto,
  ): Promise<any> {
    return this.organizationsService.addUserToOrganization({ organizationId, ownerId: req.user.sub, dto });
  }
}
