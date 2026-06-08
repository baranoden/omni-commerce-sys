import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';
import { getKafkaBrokers, getKafkaClientId } from './messaging/kafka.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.TCP,
    options: {
      host: process.env.PRODUCTS_SERVICE_HOST ?? '127.0.0.1',
      port: Number(process.env.PRODUCTS_SERVICE_TCP_PORT ?? 4006),
    },
  });

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId: getKafkaClientId('products-service-consumer'),
        brokers: getKafkaBrokers(),
      },
      consumer: {
        groupId:
          process.env.PRODUCTS_SERVICE_KAFKA_GROUP_ID ??
          'omni-commerce-products-service-consumer',
      },
    },
  });

  await app.startAllMicroservices();
  await app.init();
}

void bootstrap();
