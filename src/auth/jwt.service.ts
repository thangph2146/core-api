import { Injectable } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

export interface IJwtPayload {
  userId: number;
  email: string;
  roleId?: number | null;
  permissions: string[];
  iat?: number;
  exp?: number;
}

export interface ITokens {
  accessToken: string;
  refreshToken: string;
}

type UserPayload = {
  id: number;
  email: string;
  roleId?: number | null;
  permissions: string[];
};

@Injectable()
export class JwtService {
  private readonly JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
  private readonly JWT_REFRESH_SECRET =
    process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key';
  private readonly JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
  private readonly JWT_REFRESH_EXPIRES_IN =
    process.env.JWT_REFRESH_EXPIRES_IN || '7d';

  /**
   * Generates just an access token.
   */
  generateAccessToken(user: UserPayload): string {
    const payload: IJwtPayload = {
      userId: user.id,
      email: user.email,
      roleId: user.roleId,
      permissions: user.permissions || [],
    };
    return jwt.sign(payload, this.JWT_SECRET, {
      expiresIn: this.JWT_EXPIRES_IN,
    } as jwt.SignOptions);
  }

  /**
   * Generate both access and refresh tokens. The refresh token is a JWT in this setup.
   */
  generateTokens(user: UserPayload): ITokens {
    const payload: IJwtPayload = {
      userId: user.id,
      email: user.email,
      roleId: user.roleId,
      permissions: user.permissions || [],
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
   * Verify access token.
   */
  verifyAccessToken(token: string): IJwtPayload {
    try {
      return jwt.verify(token, this.JWT_SECRET) as IJwtPayload;
    } catch (error) {
      throw new Error('Invalid access token');
    }
  }

  /**
   * Verify refresh token.
   */
  verifyRefreshToken(token: string): IJwtPayload {
    try {
      return jwt.verify(token, this.JWT_REFRESH_SECRET) as IJwtPayload;
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  /**
   * Creates a new access token from a valid refresh token.
   */
  createAccessTokenFromRefreshToken(refreshToken: string): string {
    const payload = this.verifyRefreshToken(refreshToken);

    // Create new payload without iat and exp
    const newPayload: Omit<IJwtPayload, 'iat' | 'exp'> = {
      userId: payload.userId,
      email: payload.email,
      roleId: payload.roleId,
      permissions: payload.permissions || [],
    };

    return jwt.sign(newPayload, this.JWT_SECRET, {
      expiresIn: this.JWT_EXPIRES_IN,
    } as jwt.SignOptions);
  }
}
