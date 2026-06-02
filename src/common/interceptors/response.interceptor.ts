import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { map, Observable } from 'rxjs';
import { RESPONSE_MESSAGE_METADATA } from '../decorators/response-message.decorator';

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, unknown> {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const httpContext = context.switchToHttp();
    const response = httpContext.getResponse();

    const message =
      this.reflector.getAllAndOverride<string>(RESPONSE_MESSAGE_METADATA, [
        context.getHandler(),
        context.getClass(),
      ]) ?? 'İşlem başarılı';

    return next.handle().pipe(
      map((data) => ({
        data: data ?? null,
        message,
        status: 'Başarılı',
        statusCode: response.statusCode,
      })),
    );
  }
}