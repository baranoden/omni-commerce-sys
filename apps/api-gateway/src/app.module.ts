import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ObservabilityModule } from './observability/observability.module';
import { UserThrottlerGuard } from './common/guards/user-throttler.guard';
import { OrdersModule } from './orders/orders.module';
import { IntegrationEventsController } from './integration-events.controller';

@Module({
  imports: [
    ObservabilityModule,
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 10_000,
        limit: 15,
      },
    ]),
    AuthModule,
    OrdersModule,
  ],
  controllers: [AppController, IntegrationEventsController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: UserThrottlerGuard,
    },
  ],
})
export class AppModule {}
