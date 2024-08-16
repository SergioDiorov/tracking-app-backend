import { Controller, FileTypeValidator, Get, MaxFileSizeValidator, Param, ParseFilePipe, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

import { UsersService } from 'src/users/users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Get(':userId')
  getUserProfile(@Param('userId') userId: string): Promise<any> {
    return this.usersService.getUserProfile(userId);
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
}
