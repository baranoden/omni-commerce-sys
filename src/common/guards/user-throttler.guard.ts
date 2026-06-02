import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  InjectThrottlerOptions,
  InjectThrottlerStorage,
  ThrottlerGuard,
} from '@nestjs/throttler';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import type {
  ThrottlerModuleOptions,
  ThrottlerStorage,
} from '@nestjs/throttler';

type AuthenticatedRequest = Request & {
  user?: {
    userId?: number | string;
  };
};

@Injectable()
export class UserThrottlerGuard extends ThrottlerGuard {
  constructor(
    @InjectThrottlerOptions() options: ThrottlerModuleOptions,
    @InjectThrottlerStorage() storageService: ThrottlerStorage,
    reflector: Reflector,
    private readonly jwtService: JwtService,
  ) {
    super(options, storageService, reflector);
  }

  protected async getTracker(req: Record<string, any>): Promise<string> {
    const request = req as AuthenticatedRequest;
    const userId = await this.resolveUserId(request);

    if (userId) {
      return `user:${userId}`;
    }

    return `ip:${this.resolveIpAddress(request)}`;
  }

  private async resolveUserId(
    request: AuthenticatedRequest,
  ): Promise<string | null> {
    if (request.user?.userId !== undefined && request.user.userId !== null) {
      return String(request.user.userId);
    }

    const token = this.extractBearerToken(request);

    if (!token) {
      return null;
    }

    try {
      const payload = await this.jwtService.verifyAsync<{ sub?: number | string }>(
        token,
      );

      if (payload.sub === undefined || payload.sub === null) {
        return null;
      }

      return String(payload.sub);
    } catch {
      return null;
    }
  }

  private extractBearerToken(request: Request): string | null {
    const authorizationHeader = request.headers.authorization;

    if (!authorizationHeader?.startsWith('Bearer ')) {
      return null;
    }

    return authorizationHeader.slice(7).trim() || null;
  }

  private resolveIpAddress(request: Request): string {
    const forwardedFor = request.headers['x-forwarded-for'];

    if (typeof forwardedFor === 'string' && forwardedFor.length > 0) {
      return forwardedFor.split(',')[0].trim();
    }

    if (Array.isArray(forwardedFor) && forwardedFor.length > 0) {
      return forwardedFor[0];
    }

    return request.ip ?? request.socket.remoteAddress ?? 'anonymous';
  }
}