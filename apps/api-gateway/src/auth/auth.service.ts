import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AuthService {
  constructor(
    @Inject('AUTH_SERVICE')
    private readonly authClient: ClientProxy,
  ) {}

  register(email: string, password: string) {
    return this.send('auth.register', { email, password });
  }

  login(email: string, password: string) {
    return this.send('auth.login', { email, password });
  }

  getProfile(userId: number) {
    return this.send('auth.profile', { userId });
  }

  private async send<TResult, TPayload>(
    pattern: string,
    payload: TPayload,
  ): Promise<TResult> {
    try {
      return await firstValueFrom(
        this.authClient.send<TResult, TPayload>(pattern, payload),
      );
    } catch (error) {
      throw this.mapRpcError(error);
    }
  }

  private mapRpcError(error: unknown) {
    if (typeof error === 'object' && error !== null) {
      const rpcError = error as {
        statusCode?: number;
        message?: string | string[];
      };

      const message = Array.isArray(rpcError.message)
        ? (rpcError.message[0] ?? 'Auth servisi hatası oluştu')
        : (rpcError.message ?? 'Auth servisi hatası oluştu');

      return new HttpException(
        message,
        rpcError.statusCode ?? HttpStatus.BAD_GATEWAY,
      );
    }

    return new HttpException(
      'Auth servisine ulaşılamıyor',
      HttpStatus.BAD_GATEWAY,
    );
  }
}
