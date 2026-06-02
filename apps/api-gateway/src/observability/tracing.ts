import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';

let sdk: NodeSDK | null = null;

export async function initializeOpenTelemetry() {
  if (sdk) {
    return sdk;
  }

  const serviceName = process.env.OTEL_SERVICE_NAME ?? 'omni-commerce-sys';
  const exporter = new OTLPTraceExporter({
    url:
      process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT ??
      'http://localhost:4318/v1/traces',
    headers: process.env.OTEL_EXPORTER_OTLP_HEADERS
      ? parseHeaders(process.env.OTEL_EXPORTER_OTLP_HEADERS)
      : undefined,
  });

  sdk = new NodeSDK({
    resource: resourceFromAttributes({
      [SemanticResourceAttributes.SERVICE_NAME]: serviceName,
      [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]:
        process.env.NODE_ENV ?? 'development',
    }),
    spanProcessors: [new BatchSpanProcessor(exporter)],
    instrumentations: [
      getNodeAutoInstrumentations({
        '@opentelemetry/instrumentation-fs': {
          enabled: false,
        },
      }),
    ],
  });

  await sdk.start();

  return sdk;
}

export async function shutdownOpenTelemetry() {
  if (!sdk) {
    return;
  }

  await sdk.shutdown();
  sdk = null;
}

function parseHeaders(headerString: string) {
  return headerString.split(',').reduce<Record<string, string>>((headers, pair) => {
    const [rawKey, ...rawValue] = pair.split('=');
    const key = rawKey?.trim();
    const value = rawValue.join('=').trim();

    if (key && value) {
      headers[key] = value;
    }

    return headers;
  }, {});
}
