import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Counter, Histogram } from 'prom-client';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';

type Labels = {
  method: string;
  route: string;
  status_code: string;
};

@Injectable()
export class HttpMetricsInterceptor implements NestInterceptor {
  constructor(
    @InjectMetric('http_requests_total')
    private readonly requestCounter: Counter<'method' | 'route' | 'status_code'>,
    @InjectMetric('http_request_duration_seconds')
    private readonly requestDuration: Histogram<
      'method' | 'route' | 'status_code'
    >,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const startedAt = process.hrtime.bigint();
    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest<{
      method: string;
      route?: { path?: string };
      baseUrl?: string;
      originalUrl?: string;
    }>();
    const response = httpContext.getResponse<{ statusCode: number }>();

    return next.handle().pipe(
      finalize(() => {
        const durationInSeconds =
          Number(process.hrtime.bigint() - startedAt) / 1_000_000_000;

        const labels: Labels = {
          method: request.method,
          route: this.resolveRoute(request),
          status_code: String(response.statusCode),
        };

        this.requestCounter.inc(labels);
        this.requestDuration.observe(labels, durationInSeconds);
      }),
    );
  }

  private resolveRoute(request: {
    route?: { path?: string };
    baseUrl?: string;
    originalUrl?: string;
  }) {
    const routePath = request.route?.path;

    if (routePath) {
      const baseUrl = request.baseUrl ?? '';
      return `${baseUrl}${routePath}` || '/';
    }

    return request.originalUrl ?? '/unknown';
  }
}