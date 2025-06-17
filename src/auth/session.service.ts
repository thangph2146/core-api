import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { randomBytes } from 'crypto';

export interface ISession {
  id: string;
  userId: number;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class SessionService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new session
   */
  async createSession(userId: number, expiresInHours: number = 24 * 7): Promise<ISession> {
    const sessionId = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expiresInHours);

    const session = await this.prisma.userSession.create({
      data: {
        id: sessionId,
        userId,
        expiresAt,
      },
    });

    return session;
  }

  /**
   * Get session by ID
   */
  async getSession(sessionId: string): Promise<ISession | null> {
    const session = await this.prisma.userSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return null;
    }

    // Check if session is expired
    if (session.expiresAt < new Date()) {
      await this.deleteSession(sessionId);
      return null;
    }

    return session;
  }

  /**
   * Update session expiry
   */
  async updateSession(sessionId: string, expiresInHours: number = 24 * 7): Promise<ISession | null> {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expiresInHours);

    try {
      const session = await this.prisma.userSession.update({
        where: { id: sessionId },
        data: {
          expiresAt,
          updatedAt: new Date(),
        },
      });

      return session;
    } catch (error) {
      return null;
    }
  }

  /**
   * Delete session
   */
  async deleteSession(sessionId: string): Promise<boolean> {
    try {
      await this.prisma.userSession.delete({
        where: { id: sessionId },
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Delete all sessions for a user
   */
  async deleteAllUserSessions(userId: number): Promise<boolean> {
    try {
      await this.prisma.userSession.deleteMany({
        where: { userId },
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Clean up expired sessions
   */
  async cleanupExpiredSessions(): Promise<number> {
    const result = await this.prisma.userSession.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    return result.count;
  }
}
