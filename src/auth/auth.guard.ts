import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from './jwt.service';
import { SessionService } from './session.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly sessionService: SessionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    
    // Try to get token from Authorization header first
    const authHeader = request.headers.authorization;
    let token: string | undefined;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (request.cookies?.accessToken) {
      // Fallback to cookie if no Authorization header
      token = request.cookies.accessToken;
    }

    if (!token) {
      throw new UnauthorizedException('Access token not found');
    }

    try {
      // Verify JWT token
      const payload = this.jwtService.verifyAccessToken(token);
      
      // Verify session if sessionId exists in cookies
      if (request.cookies?.sessionId) {
        const session = await this.sessionService.getSession(request.cookies.sessionId);
        if (!session || session.userId !== payload.userId) {
          throw new UnauthorizedException('Invalid session');
        }
      }

      // Add user info to request
      request.user = payload;
      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
