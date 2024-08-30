import { Body, Controller, Post } from '@nestjs/common';

import { AuthService } from 'src/auth/auth.service';
import { AuthSignInDto, AuthSignUpDto } from 'src/auth/dto/auth.dto';
import { AuthResponse } from 'src/auth/dto/auth-response.dto';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('signUp')
  signUp(@Body() dto: AuthSignUpDto): Promise<AuthResponse> {
    return this.authService.signUp(dto);
  }

  @Post('signIn')
  signIn(@Body() dto: AuthSignInDto): Promise<AuthResponse> {
    return this.authService.signIn(dto);
  }
}
