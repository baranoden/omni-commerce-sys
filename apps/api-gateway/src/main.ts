import { ValidationPipe } from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import { Logger, LoggerErrorInterceptor } from 'nestjs-pino';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import {
  initializeOpenTelemetry,
  shutdownOpenTelemetry,
} from './observability/tracing';

async function bootstrap() {
  await initializeOpenTelemetry();

  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  app.useLogger(app.get(Logger));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.useGlobalInterceptors(
    new LoggerErrorInterceptor(),
    new ResponseInterceptor(app.get(Reflector)),
  );
  app.useGlobalFilters(new HttpExceptionFilter());

  const shutdownSignals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];

  for (const signal of shutdownSignals) {
    process.once(signal, () => {
      void shutdownOpenTelemetry();
    });
  }

  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap();
