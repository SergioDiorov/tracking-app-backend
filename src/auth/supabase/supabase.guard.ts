import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class SupabaseGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const publicRoutes = ['/signUp', '/signIn'];
    if (publicRoutes.includes(request.url)) {
      return true;
    }
    return super.canActivate(context) as boolean;
  }
}