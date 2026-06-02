import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';

@Controller()
export class IntegrationEventsController {
  private readonly logger = new Logger(IntegrationEventsController.name);

  @EventPattern('auth.user.registered')
  handleUserRegistered(@Payload() payload: Record<string, unknown>) {
    this.logger.log(
      `Kafka event received: auth.user.registered ${JSON.stringify(payload)}`,
    );
  }

  @EventPattern('auth.user.logged_in')
  handleUserLoggedIn(@Payload() payload: Record<string, unknown>) {
    this.logger.log(
      `Kafka event received: auth.user.logged_in ${JSON.stringify(payload)}`,
    );
  }

  @EventPattern('catalog.product.created')
  handleProductCreated(@Payload() payload: Record<string, unknown>) {
    this.logger.log(
      `Kafka event received: catalog.product.created ${JSON.stringify(payload)}`,
    );
  }

  @EventPattern('catalog.product.updated')
  handleProductUpdated(@Payload() payload: Record<string, unknown>) {
    this.logger.log(
      `Kafka event received: catalog.product.updated ${JSON.stringify(payload)}`,
    );
  }

  @EventPattern('catalog.product.deleted')
  handleProductDeleted(@Payload() payload: Record<string, unknown>) {
    this.logger.log(
      `Kafka event received: catalog.product.deleted ${JSON.stringify(payload)}`,
    );
  }
}
