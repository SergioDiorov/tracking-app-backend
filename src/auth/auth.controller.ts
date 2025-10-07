import { Body, Controller, Post, Request } from '@nestjs/common';

import { AuthService } from 'src/auth/auth.service';
import { AuthResetPasswordDto, AuthSignInDto, AuthSignUpDto } from 'src/auth/dto/auth.dto';
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

  @Post('reset-password')
  resetPassword(
    @Body() dto: AuthResetPasswordDto,
    @Request() req: any
  ): Promise<any> {
    return this.authService.resetPassword({ dto, email: req.user.email });
  }

  @Post('refresh')
  refresh(@Body('refresh_token') refreshToken: string) {
    return this.authService.refreshTokens(refreshToken);
  }
}
