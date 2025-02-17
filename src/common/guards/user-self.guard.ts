import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Observable } from 'rxjs';

@Injectable()
export class UserSelfGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const req = context.switchToHttp().getRequest();

    const authHeaders = req.headers.authorization;

    if (!authHeaders) {
      throw new UnauthorizedException('Unauthorized user');
    }

    const bearer = authHeaders.split(' ')[0];
    const token = authHeaders.split(' ')[1];

    if (bearer !== 'Bearer' || !token) {
      throw new UnauthorizedException('Unauthorized user');
    }

    async function verify(token: string, jwtService: JwtService) {
      let payload: any;
      let payloadAdmin: any;
      try {
        payload = await jwtService.verify(token, {
          secret: process.env.ACCESS_TOKEN_CUSTOMER_KEY,
        });
      } catch (error) {
        payloadAdmin = await jwtService.verify(token, {
          secret: process.env.ACCESS_TOKEN_ADMIN_KEY,
        });
      }
      if (payloadAdmin) {
        return true;
      }

      if (!payload) {
        throw new UnauthorizedException('Unauthorized user');
      }

      req.user = payload;
      return true;
    }

    return verify(token, this.jwtService);
  }
}
