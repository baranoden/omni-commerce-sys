import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.TCP,
      options: {
        host: process.env.AUTH_SERVICE_HOST ?? '127.0.0.1',
        port: Number(process.env.AUTH_SERVICE_TCP_PORT ?? 4002),
      },
    },
  );

  await app.listen();
}

void bootstrap();
