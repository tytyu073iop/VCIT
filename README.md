# VCIT

A Deno web app that turns any prompt into an AI-generated HTML page. Enter a
prompt in the URL, and the server asks OpenRouter to generate a complete,
self-contained HTML page for it.

## How it works

1. Visit `http://localhost:8000/<prompt>`. The server starts an async AI render
   and immediately returns a polling page.
2. The polling page repeatedly calls `/isready/:id` until the render finishes.
3. Once ready, the browser is redirected to `/site/:id`, which serves the
   generated HTML.

Sites are stored in an in-memory `Map`, so all generated pages are lost on
restart.

## Requirements

- [Deno](https://deno.com) (or Docker)
- `OPENROUTER_API_KEY` environment variable (from
  [OpenRouter](https://openrouter.ai))

## Running

```sh
export OPENROUTER_API_KEY=...
deno task dev
```

Then open `http://localhost:8000/your prompt here`.

### Running without an AI

`deno task dev` sets `USE_MOCK_AI=true`, so it serves a canned page and needs no
API key or network access. To run against OpenRouter instead:

```sh
deno task dev:real
```

### Docker

Create a `secrets.env` file (gitignored) with:

```
OPENROUTER_API_KEY=...
```

Then:

```sh
deno task compose          # docker compose up --build
deno task compose:jaeger   # same, plus the observability stack
```

The app is served on port 8000. `deno task compose` runs only the app (tracing
is switched off via `OTEL_SDK_DISABLED=true`). `deno task compose:jaeger`
(`compose.jaeger.yml`) starts the whole telemetry stack:

| Service | URL | Purpose |
| --- | --- | --- |
| Jaeger | <http://localhost:16686> | traces (`OTLP 4317/4318`) |
| Alloy | <http://localhost:12345> | OTLP intake, forwards logs to Loki |
| Prometheus | <http://localhost:9090> | scrapes the app's `:9464` metrics |
| Loki | <http://localhost:3100> | log storage (push/query API) |
| Grafana | <http://localhost:3000> | Loki + Prometheus datasources, anonymous editor, provisioned dashboards |

## Tracing

`instrumentation.ts` is loaded via `--import` (see the `dev`/`dev:real` tasks
and the Dockerfile CMD). Tracing is optional: nothing crashes if no collector
is running, and `OTEL_SDK_DISABLED=true` turns the OpenTelemetry SDK off
completely (no spans, no periodic metric dumps). When enabled, it exports
traces over OTLP/HTTP, by default to `http://localhost:4318/v1/traces`, which
is where Jaeger's all-in-one container listens. Everything is driven by the
standard OTEL env vars:

| Variable | Effect |
| --- | --- |
| `OTEL_SDK_DISABLED=true` | disable the whole OpenTelemetry SDK |
| `OTEL_SERVICE_NAME` | service name shown in Jaeger (default `vcit`) |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | OTLP base URL, `/v1/traces` is appended |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` | full traces URL, wins over the base URL |
| `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | full logs URL for OTLP logs exporter |
| `OTEL_LOGS_EXPORTER=otlp` | send logs over OTLP |
| `OTEL_TRACES_EXPORTER=console` | print spans to stdout instead of exporting |
| `OTEL_METRICS_EXPORTER=otlp` | send metrics over OTLP instead of the console |

Jaeger only ingests traces, so metrics default to the console exporter. To send
them somewhere, point `OTEL_METRICS_EXPORTER=otlp` at a collector or metrics
backend. The console logs in `main.ts` and `renderSite.ts` are forwarded to the
OTLP logs pipeline via `instrumentation.ts` (see below). For local development
with Jaeger in Docker but the app on the host:

```sh
docker compose -f compose.jaeger.yml up jaeger
deno task dev
```

Traces then show up under the `vcit` service in the Jaeger UI. Local run works
too without env vars — Jaeger on the host is picked up at
`localhost:4318`.

## Logs

`instrumentation.ts` bridges `console.*` calls to the OpenTelemetry Logs API. When
the SDK is active, it emits OTLP log records alongside stdout mirroring. Set
`OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` to send them to a collector (e.g.
`http://alloy:4318/v1/logs` in Docker). The Alloy config in this repo receives
OTLP on `0.0.0.0:4318`, echoes records to its own stdout, and pushes them to
Loki, where they land as `{exporter="OTLP", job="vcit", level="INFO"}` with the
console body (JSON: body, attributes, resource) as the log line.

In the `compose:jaeger` stack, open <http://localhost:3000> (anonymous viewer,
Loki data source is provisioned) and run e.g.:

```logql
{job="vcit"} | json
```

The same query works against the API directly:
`curl -sG 'http://localhost:3100/loki/api/v1/query_range' --data-urlencode 'query={job="vcit"}'`.


## Tests

```sh
deno task test
```

## Environment / permissions

- `OPENROUTER_API_KEY` is required and read via `Deno.env.get` in
  `secretsAdapter.ts` (not needed when `USE_MOCK_AI` is on).
- `USE_MOCK_AI=true` (or `1`) selects `MockAiChat` via `createAiChat` in
  `aiChatFactory.ts`; any other value keeps the OpenRouter chat.
- The real run needs `--allow-env` and `--allow-read` in addition to
  `--allow-net` (see the Dockerfile CMD). The `dev` task grants
  `--allow-net --allow-env`.
- `@openrouter/sdk` has an allowed postinstall script (`allowScripts` in
  `deno.json`).
- `deno.lock` is committed and copied by the Dockerfile for reproducible
  installs.
