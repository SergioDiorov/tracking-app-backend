import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller()
export class AuthController {
  // eslint-disable-next-line prettier/prettier
  constructor(private readonly authService: AuthService) { }

  @Post('signUp')
  signUp(
    @Body()
    body: {
      data: { email: string; password: string; confirmPassword: string };
    },
  ) {
    const { email, password, confirmPassword } = body.data;
    return this.authService.signUp({ email, password, confirmPassword });
  }

  @Post('signIn')
  signIn(@Body() body: { data: { email: string; password: string } }) {
    const { email, password } = body.data;
    return this.authService.signIn({ email, password });
  }
}
