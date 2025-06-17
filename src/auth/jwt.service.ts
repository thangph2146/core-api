import { Injectable } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { IUser } from './dto/auth.dto';

export interface IJwtPayload {
  userId: number;
  email: string;
  roleId?: number;
  iat?: number;
  exp?: number;
}

export interface ITokens {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class JwtService {
  private readonly JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
  private readonly JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key';
  private readonly JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
  private readonly JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

  /**
   * Generate access and refresh tokens
   */
  generateTokens(user: IUser): ITokens {
    const payload: IJwtPayload = {
      userId: user.id,
      email: user.email,
      roleId: user.roleId,
    };

    const accessToken = jwt.sign(payload, this.JWT_SECRET, {
      expiresIn: this.JWT_EXPIRES_IN,
    } as jwt.SignOptions);

    const refreshToken = jwt.sign(payload, this.JWT_REFRESH_SECRET, {
      expiresIn: this.JWT_REFRESH_EXPIRES_IN,
    } as jwt.SignOptions);

    return { accessToken, refreshToken };
  }

  /**
   * Verify access token
   */
  verifyAccessToken(token: string): IJwtPayload {
    try {
      return jwt.verify(token, this.JWT_SECRET) as IJwtPayload;
    } catch (error) {
      throw new Error('Invalid access token');
    }
  }

  /**
   * Verify refresh token
   */
  verifyRefreshToken(token: string): IJwtPayload {
    try {
      return jwt.verify(token, this.JWT_REFRESH_SECRET) as IJwtPayload;
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  /**
   * Generate new access token from refresh token
   */
  refreshAccessToken(refreshToken: string): string {
    const payload = this.verifyRefreshToken(refreshToken);
    
    // Create new payload without iat and exp
    const newPayload: IJwtPayload = {
      userId: payload.userId,
      email: payload.email,
      roleId: payload.roleId,
    };

    return jwt.sign(newPayload, this.JWT_SECRET, {
      expiresIn: this.JWT_EXPIRES_IN,
    } as jwt.SignOptions);
  }
}
