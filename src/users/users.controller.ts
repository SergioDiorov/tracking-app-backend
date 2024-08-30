import { Body, Controller, Delete, FileTypeValidator, Get, MaxFileSizeValidator, Param, ParseFilePipe, Patch, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

import { UsersService } from 'src/users/users.service';
import { ProfilePatchDataDto } from 'src/users/dto/users.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Get(':userId')
  getUserProfile(@Param('userId') userId: string): Promise<any> {
    return this.usersService.getUserProfile(userId);
  }

  @Patch(':userId')
  updateProfile(@Param('userId') userId: string, @Body() updateProfileDto: ProfilePatchDataDto): Promise<any> {
    return this.usersService.updateProfile({ userId, updateProfileDto });
  }

  @Post(':userId/avatar')
  @UseInterceptors(FileInterceptor('file'))
  uploadFile(
    @Param('userId') userId: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new FileTypeValidator({ fileType: '.(png|jpeg|jpg)' }),
          new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 4 }),
        ],
      }),
    ) file: Express.Multer.File) {
    return this.usersService.uploadFile({ userId, file })
  }

  @Delete(':userId/avatar')
  deleteAvatarFile(
    @Param('userId') userId: string,
  ) {
    return this.usersService.deleteAvatarFile(userId)
  }
}
