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

  @EventPattern('catalog.stock.decremented')
  handleStockDecremented(@Payload() payload: Record<string, unknown>) {
    this.logger.log(
      `Kafka event received: catalog.stock.decremented ${JSON.stringify(payload)}`,
    );
  }

  @EventPattern('catalog.stock.incremented')
  handleStockIncremented(@Payload() payload: Record<string, unknown>) {
    this.logger.log(
      `Kafka event received: catalog.stock.incremented ${JSON.stringify(payload)}`,
    );
  }

  @EventPattern('stock.reserved')
  handleStockReserved(@Payload() payload: Record<string, unknown>) {
    this.logger.log(
      `Kafka event received: stock.reserved ${JSON.stringify(payload)}`,
    );
  }

  @EventPattern('stock.decreased')
  handleStockDecreased(@Payload() payload: Record<string, unknown>) {
    this.logger.log(
      `Kafka event received: stock.decreased ${JSON.stringify(payload)}`,
    );
  }

  @EventPattern('stock.released')
  handleStockReleased(@Payload() payload: Record<string, unknown>) {
    this.logger.warn(
      `Kafka event received: stock.released ${JSON.stringify(payload)}`,
    );
  }

  @EventPattern('stock.failed')
  handleStockFailed(@Payload() payload: Record<string, unknown>) {
    this.logger.warn(
      `Kafka event received: stock.failed ${JSON.stringify(payload)}`,
    );
  }

  @EventPattern('order.created')
  handleOrderCreated(@Payload() payload: Record<string, unknown>) {
    this.logger.log(
      `Kafka event received: order.created ${JSON.stringify(payload)}`,
    );
  }

  @EventPattern('order.failed')
  handleOrderFailed(@Payload() payload: Record<string, unknown>) {
    this.logger.warn(
      `Kafka event received: order.failed ${JSON.stringify(payload)}`,
    );
  }

  @EventPattern('order.completed')
  handleOrderCompleted(@Payload() payload: Record<string, unknown>) {
    this.logger.log(
      `Kafka event received: order.completed ${JSON.stringify(payload)}`,
    );
  }

  @EventPattern('order.compensated')
  handleOrderCompensated(@Payload() payload: Record<string, unknown>) {
    this.logger.warn(
      `Kafka event received: order.compensated ${JSON.stringify(payload)}`,
    );
  }

  @EventPattern('payment.completed')
  handlePaymentCompleted(@Payload() payload: Record<string, unknown>) {
    this.logger.log(
      `Kafka event received: payment.completed ${JSON.stringify(payload)}`,
    );
  }

  @EventPattern('payment.failed')
  handlePaymentFailed(@Payload() payload: Record<string, unknown>) {
    this.logger.warn(
      `Kafka event received: payment.failed ${JSON.stringify(payload)}`,
    );
  }

  @EventPattern('payment.circuit.opened')
  handlePaymentCircuitOpened(@Payload() payload: Record<string, unknown>) {
    this.logger.warn(
      `Kafka event received: payment.circuit.opened ${JSON.stringify(payload)}`,
    );
  }
}
