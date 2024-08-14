import { Injectable } from '@nestjs/common';
import { Supabase } from 'src/auth/supabase/supabase';
import { BadRequest } from 'http-errors';

import { throwError } from 'src/helpers/throwError';
import { AuthSignInDto, AuthSignUpDto } from 'src/auth/dto/auth.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService, private readonly supabase: Supabase,) { }

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
}
