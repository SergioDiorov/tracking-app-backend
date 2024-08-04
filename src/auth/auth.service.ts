import { Injectable } from '@nestjs/common';
import { supabase } from 'supabase/server';
import { BadRequest } from 'http-errors';

import { throwError } from 'src/helpers/throwError';
import { AuthSignInDto, AuthSignUpDto } from 'src/auth/dto/auth.dto';

@Injectable()
export class AuthService {
  public async signUp(dto: AuthSignUpDto): Promise<any> {
    try {
      if (dto.password !== dto.confirmPassword)
        throw new BadRequest(`Confirm password doesn't match password`);

      const { data: response, error } = await supabase.auth.signUp({
        email: dto.email,
        password: dto.password,
      });

      if (error) throwError({ error });

      return {
        data: {
          user: {
            email: response.user.email,
            id: response.user.id,
          },
          access_token: response.session.access_token,
          refresh_token: response.session.refresh_token,
        },
      };
    } catch (e) {
      throw e;
    }
  }

  public async signIn(dto: AuthSignInDto): Promise<any> {
    try {
      const { data: response, error } = await supabase.auth.signInWithPassword({
        email: dto.email,
        password: dto.password,
      });

      if (error) throwError({ error });

      return {
        data: {
          user: {
            email: response.user.email,
            id: response.user.id,
          },
          access_token: response.session.access_token,
          refresh_token: response.session.refresh_token,
        },
      };
    } catch (e) {
      throw e;
    }
  }
}
