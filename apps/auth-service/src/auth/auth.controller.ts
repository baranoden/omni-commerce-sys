import {
  Controller,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { MessagePattern, Payload, RpcException } from '@nestjs/microservices';
import { AuthService } from './auth.service';

interface RegisterPayload {
  email: string;
  password: string;
}

interface LoginPayload {
  email: string;
  password: string;
}

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @MessagePattern('auth.register')
  async register(@Payload() payload: RegisterPayload) {
    try {
      return await this.authService.register(payload.email, payload.password);
    } catch (error) {
      throw this.toRpcException(error);
    }
  }

  @MessagePattern('auth.login')
  async login(@Payload() payload: LoginPayload) {
    try {
      return await this.authService.login(payload.email, payload.password);
    } catch (error) {
      throw this.toRpcException(error);
    }
  }

  @MessagePattern('auth.profile')
  async getProfile(@Payload() payload: { userId: number }) {
    try {
      return await this.authService.getProfile(payload.userId);
    } catch (error) {
      throw this.toRpcException(error);
    }
  }

  private toRpcException(error: unknown) {
    if (error instanceof HttpException) {
      const response = error.getResponse();
      const message =
        typeof response === 'string'
          ? response
          : typeof response === 'object' && response !== null && 'message' in response
            ? response.message
            : error.message;

      return new RpcException({
        statusCode: error.getStatus(),
        message,
      });
    }

    return new RpcException({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Auth servisinde beklenmeyen bir hata oluştu',
    });
  }
}
