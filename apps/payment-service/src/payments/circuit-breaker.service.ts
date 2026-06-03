import { Injectable, ServiceUnavailableException } from '@nestjs/common';

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

@Injectable()
export class CircuitBreakerService {
  private state: CircuitState = 'CLOSED';
  private failureCount = 0;
  private nextAttemptAt = 0;

  private readonly failureThreshold = Number(
    process.env.PAYMENT_CIRCUIT_BREAKER_FAILURE_THRESHOLD ?? 3,
  );

  private readonly resetTimeoutMs = Number(
    process.env.PAYMENT_CIRCUIT_BREAKER_RESET_TIMEOUT_MS ?? 10_000,
  );

  async execute<T>(action: () => Promise<T>) {
    this.ensureRequestAllowed();

    try {
      const result = await action();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  getSnapshot() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      nextAttemptAt: this.nextAttemptAt,
    };
  }

  private ensureRequestAllowed() {
    if (this.state !== 'OPEN') {
      return;
    }

    if (Date.now() >= this.nextAttemptAt) {
      this.state = 'HALF_OPEN';
      return;
    }

    throw new ServiceUnavailableException(
      'Ödeme devresi açık. Lütfen kısa süre sonra tekrar deneyin',
    );
  }

  private onSuccess() {
    this.failureCount = 0;
    this.nextAttemptAt = 0;
    this.state = 'CLOSED';
  }

  private onFailure() {
    this.failureCount += 1;

    if (
      this.state === 'HALF_OPEN' ||
      this.failureCount >= this.failureThreshold
    ) {
      this.state = 'OPEN';
      this.nextAttemptAt = Date.now() + this.resetTimeoutMs;
    }
  }
}
