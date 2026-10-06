/*instrumentation.ts*/
import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-proto';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { ConsoleSpanExporter } from '@opentelemetry/sdk-trace-node';
import {
  ConsoleMetricExporter,
  PeriodicExportingMetricReader,
} from '@opentelemetry/sdk-metrics';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { logs, SeverityNumber } from '@opentelemetry/api-logs';

function traceExporter() {
  if (Deno.env.get('OTEL_TRACES_EXPORTER') === 'console') {
    return new ConsoleSpanExporter();
  }
  return new OTLPTraceExporter();
}

function metricReader() {
  const exporterType = Deno.env.get('OTEL_METRICS_EXPORTER');
  if (exporterType === 'prometheus') {
    return new PrometheusExporter({ port: 9464 });
  }
  const exporter = exporterType === 'otlp'
    ? new OTLPMetricExporter()
    : new ConsoleMetricExporter();
  return new PeriodicExportingMetricReader({ exporter });
}

const sdk = new NodeSDK({
  resource: resourceFromAttributes({
    'service.name': Deno.env.get('OTEL_SERVICE_NAME') ?? 'vcit',
  }),
  traceExporter: traceExporter(),
  metricReader: metricReader(),
  instrumentations: [getNodeAutoInstrumentations()],
});

sdk.start();

/** Console method forwarded as a log record, with its OTLP severity. */
const consoleSeverity = {
  debug: { severityText: 'DEBUG', severityNumber: SeverityNumber.DEBUG },
  log: { severityText: 'INFO', severityNumber: SeverityNumber.INFO },
  info: { severityText: 'INFO', severityNumber: SeverityNumber.INFO },
  warn: { severityText: 'WARN', severityNumber: SeverityNumber.WARN },
  error: { severityText: 'ERROR', severityNumber: SeverityNumber.ERROR },
} as const;

type ConsoleMethod = keyof typeof consoleSeverity;

/**
 * Renders one `console` argument as log body text. Objects become JSON so
 * structured fields survive the round trip to the collector.
 *
 * @param value - A single argument passed to a console method.
 */
function formatLogArg(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value instanceof Error) return `${value.name}: ${value.message}`;
  try {
    return JSON.stringify(value) ?? String(value);
  } catch {
    return String(value);
  }
}

/**
 * Forwards every `console` call to the collector as an OTLP log record while
 * keeping the original stdout output.
 *
 * The SDK builds its own OTLP logs exporter from `OTEL_LOGS_EXPORTER` and
 * `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` (Alloy in compose) and registers it in
 * `sdk.start()`. `logs.getLogger` returns a proxy logger that comes alive once
 * that provider exists, so emits are dropped when the SDK is off
 * (`OTEL_SDK_DISABLED=true`, `OTEL_LOGS_EXPORTER=none`).
 */
function forwardConsoleToLogs(): void {
  const logger = logs.getLogger('console');
  for (const method of Object.keys(consoleSeverity) as ConsoleMethod[]) {
    const { severityText, severityNumber } = consoleSeverity[method];
    const original = console[method];
    console[method] = (...args: unknown[]) => {
      original.apply(console, args);
      logger.emit({
        body: args.map(formatLogArg).join(' '),
        severityText,
        severityNumber,
        attributes: { 'console.method': method },
      });
    };
  }
}

forwardConsoleToLogs();
