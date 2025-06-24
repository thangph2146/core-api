import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { randomBytes } from 'crypto';
import { UserSession } from '@prisma/client';

@Injectable()
export class SessionService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new session. The session ID serves as the refresh token.
   */
  async createSession(
    userId: number,
    expiresInHours = 24 * 7,
  ): Promise<UserSession> {
    const sessionId = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expiresInHours);

    return this.prisma.userSession.create({
      data: {
        id: sessionId,
        userId,
        expiresAt,
      },
    });
  }

  /**
   * Get a session by its ID (which is the refresh token).
   */
  async getSession(sessionId: string): Promise<UserSession | null> {
    const session = await this.prisma.userSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return null;
    }

    // If session is expired, delete it and return null
    if (session.expiresAt < new Date()) {
      await this.deleteSession(sessionId);
      return null;
    }

    return session;
  }

  /**
   * Delete a session by its ID.
   */
  async deleteSession(sessionId: string): Promise<boolean> {
    try {
      await this.prisma.userSession.delete({
        where: { id: sessionId },
      });
      return true;
    } catch (error) {
      // Fails silently if the session doesn't exist
      return false;
    }
  }

  /**
   * Delete all sessions for a specific user.
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
   * Clean up expired sessions from the database.
   */
  async cleanupExpiredSessions(): Promise<number> {
    const { count } = await this.prisma.userSession.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    return count;
  }
}
