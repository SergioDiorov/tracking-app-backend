import { Controller, Get, Param } from '@nestjs/common';

import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Get(':userId')
  getUserProfile(@Param('userId') userId: string): Promise<any> {
    return this.usersService.getUserProfile(userId);
  }
}
