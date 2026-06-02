import { randomUUID } from 'crypto';
import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { context, trace } from '@opentelemetry/api';
import {
  makeCounterProvider,
  makeHistogramProvider,
  PrometheusModule,
} from '@willsoto/nestjs-prometheus';
import { LoggerModule } from 'nestjs-pino';
import pino from 'pino';
import { HttpMetricsInterceptor } from './interceptors/http-metrics.interceptor';

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.LOG_LEVEL ?? 'info',
        genReqId: (request) =>
          request.headers['x-request-id']?.toString() ?? randomUUID(),
        timestamp: pino.stdTimeFunctions.isoTime,
        messageKey: 'message',
        base: {
          service: process.env.OTEL_SERVICE_NAME ?? 'omni-commerce-sys',
          environment: process.env.NODE_ENV ?? 'development',
        },
        formatters: {
          level: (label) => ({
            level: label,
          }),
        },
        serializers: {
          req: (request) => ({
            id: request.id,
            method: request.method,
            url: request.url,
            query: request.query,
            params: request.params,
            remoteAddress: request.remoteAddress,
            remotePort: request.remotePort,
          }),
          res: (response) => ({
            statusCode: response.statusCode,
          }),
          err: pino.stdSerializers.err,
        },
        customProps: () => {
          const activeSpan = trace.getSpan(context.active());
          const spanContext = activeSpan?.spanContext();

          return {
            traceId: spanContext?.traceId,
            spanId: spanContext?.spanId,
          };
        },
        customReceivedMessage: () => 'request received',
        customSuccessMessage: () => 'request completed',
        customErrorMessage: () => 'request failed',
        redact: {
          paths: [
            'req.headers.authorization',
            'req.headers.cookie',
            'req.body.password',
            'req.body.access_token',
            'req.body.refresh_token',
          ],
          censor: '[Redacted]',
        },
      },
    }),
    PrometheusModule.register({
      path: '/metrics',
      defaultMetrics: {
        enabled: true,
      },
      defaultLabels: {
        service: process.env.OTEL_SERVICE_NAME ?? 'omni-commerce-sys',
        environment: process.env.NODE_ENV ?? 'development',
      },
    }),
  ],
  providers: [
    makeCounterProvider({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code'],
    }),
    makeHistogramProvider({
      name: 'http_request_duration_seconds',
      help: 'HTTP request duration in seconds',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2, 5],
    }),
    {
      provide: APP_INTERCEPTOR,
      useClass: HttpMetricsInterceptor,
    },
  ],
})
export class ObservabilityModule {}
