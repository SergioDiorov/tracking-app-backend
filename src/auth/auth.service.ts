import { Injectable } from '@nestjs/common';
import { supabase } from 'supabase/server';
import { BadRequest } from 'http-errors';

@Injectable()
export class AuthService {
  async signUp(data: {
    email: string;
    password: string;
    confirmPassword: string;
  }) {
    try {
      if (data.password !== data.confirmPassword)
        throw new BadRequest(`Confirm password doesn't match password`);

      const { data: response, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
      });

      if (error) return { statusCode: error.status, message: error.message };

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

  async signIn(data: { email: string; password: string }) {
    try {
      const { data: response, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) return { statusCode: error.status, message: error.message };

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
