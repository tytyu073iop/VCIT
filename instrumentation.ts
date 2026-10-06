/*instrumentation.ts*/
import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-proto';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { ConsoleSpanExporter } from '@opentelemetry/sdk-trace-node';
import {
  ConsoleMetricExporter,
  PeriodicExportingMetricReader,
} from '@opentelemetry/sdk-metrics';
import { resourceFromAttributes } from '@opentelemetry/resources';

function traceExporter() {
  if (Deno.env.get('OTEL_TRACES_EXPORTER') === 'console') {
    return new ConsoleSpanExporter();
  }
  return new OTLPTraceExporter();
}

function metricExporter() {
  if (Deno.env.get('OTEL_METRICS_EXPORTER') === 'otlp') {
    return new OTLPMetricExporter();
  }
  return new ConsoleMetricExporter();
}

const sdk = new NodeSDK({
  resource: resourceFromAttributes({
    'service.name': Deno.env.get('OTEL_SERVICE_NAME') ?? 'vcit',
  }),
  traceExporter: traceExporter(),
  metricReader: new PeriodicExportingMetricReader({
    exporter: metricExporter(),
  }),
  instrumentations: [getNodeAutoInstrumentations()],
});

sdk.start();
