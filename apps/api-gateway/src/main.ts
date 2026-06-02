import { ValidationPipe } from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { Logger, LoggerErrorInterceptor } from 'nestjs-pino';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { getKafkaBrokers, getKafkaClientId } from './messaging/kafka.config';
import {
  initializeOpenTelemetry,
  shutdownOpenTelemetry,
} from './observability/tracing';

async function bootstrap() {
  await initializeOpenTelemetry();

  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId: getKafkaClientId('api-gateway'),
        brokers: getKafkaBrokers(),
      },
      consumer: {
        groupId:
          process.env.API_GATEWAY_KAFKA_GROUP_ID ??
          'omni-commerce-api-gateway-consumer',
      },
    },
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

  await app.startAllMicroservices();

  await app.listen(process.env.PORT ?? 8080);
}

void bootstrap();
