import { Injectable } from '@nestjs/common';
import { Supabase } from '../auth/supabase/supabase';
import { BadRequest } from 'http-errors';

import { throwError } from '../helpers/throwError';
import {
  AuthResetPasswordDto,
  AuthSignInDto,
  AuthSignUpDto,
} from '../auth/dto/auth.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly supabase: Supabase,
  ) { }

  public async signUp(dto: AuthSignUpDto): Promise<any> {
    try {
      if (dto.password !== dto.confirmPassword)
        throw new BadRequest(`Confirm password doesn't match password`);

      const supabase = this.supabase.getClient();
      const { data: response, error } = await supabase.auth.signUp({
        email: dto.email,
        password: dto.password,
      });

      if (error) throwError({ error });

      await this.prisma.profile.create({
        data: {
          userId: response.user.id,
          firstName: dto.firstName,
          lastName: dto.lastName,
          age: dto.age,
          country: dto.country,
          city: dto.city,
          workPreference: dto.workPreference,
          email: dto.email,
        },
      });

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
      const supabase = this.supabase.getClient();
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

  public async resetPassword({
    dto: { oldPassword, newPassword },
    email,
  }: {
    dto: AuthResetPasswordDto;
    email: string;
  }): Promise<any> {
    try {
      const supabase = this.supabase.getClient();

      if (newPassword === oldPassword) {
        throw new BadRequest(`Old password should not match new password`);
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email,
        password: oldPassword,
      });

      if (signInError) {
        throw new BadRequest(signInError.message);
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        throw new BadRequest(updateError.message);
      }

      return { message: 'Password updated successfully' };
    } catch (e) {
      throw new BadRequest(e.message);
    }
  }

  public async refreshTokens(refreshToken: string): Promise<any> {
    try {
      const supabase = this.supabase.getClient();

      const { data, error } = await supabase.auth.refreshSession({
        refresh_token: refreshToken,
      });

      if (error) throw new BadRequest(error.message);
      if (!data?.session) throw new BadRequest('Auth session missing!');

      const { session } = data;

      return {
        data: {
          access_token: session.access_token,
          refresh_token: session.refresh_token,
          user: {
            id: session.user.id,
            email: session.user.email,
          },
        },
      };
    } catch (e) {
      throw new BadRequest(e.message);
    }
  }
}
