import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { getKafkaBrokers, getKafkaClientId } from '../messaging/kafka.config';

@Module({
  imports: [
    UsersModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'SUPER_SECRET_KEY',
      signOptions: {
        expiresIn: (process.env.JWT_EXPIRES_IN ?? '7d') as never,
      },
    }),
    ClientsModule.register([
      {
        name: 'AUTH_EVENTS_CLIENT',
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: getKafkaClientId('auth-service-producer'),
            brokers: getKafkaBrokers(),
          },
          consumer: {
            groupId:
              process.env.AUTH_EVENTS_KAFKA_GROUP_ID ??
              'omni-commerce-auth-service-producer',
          },
          producerOnlyMode: true,
        },
      },
    ]),
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
