import express from "express";
import * as texts from "./texts.ts";
import { SiteLifeCycle } from "./SiteLifeCycle.ts";
import { SiteRepositoryImpl } from "./SiteRepositoryImpl.ts";
import { createAiChat } from "./aiChatFactory.ts";
import { errorFields, pathSiteId, promptPreview } from "./log.ts";
import { hasOpenRouterApiKey, useMockAi } from "./secretsAdapter.ts";
import { pollingPage } from "./pollingPage.ts";
import { trace, context } from "@opentelemetry/api";

/** The Express application that serves the site rendering endpoints. */
export const app = express();

/** Manages the creation and readiness lifecycle of generated sites. */
export const siteLifeCycle = new SiteLifeCycle(new SiteRepositoryImpl());

app.use((req, res, next) => {
  const startedAt = performance.now();
  res.on("finish", () => {
    const siteId = pathSiteId(req.path);
    console.log({
      event: "request",
      method: req.method,
      path: req.path,
      status: res.statusCode,
      durationMs: Math.round(performance.now() - startedAt),
      ...(siteId !== undefined ? { siteId } : {}),
    });
  });
  next();
});

app.get("/", (_req, res) => {
  res.contentType("text/html");
  res.send(texts.instruction());
});

/**
 * Wrapper around the AI chat used to render prompt-driven HTML: OpenRouter in
 * normal runs, the offline mock when `USE_MOCK_AI` is set.
 */
export const aiChat = createAiChat();

/**
 * Begins creating a site for a prompt and returns its id immediately. The
 * render happens asynchronously; when it completes the site content is stored.
 *
 * @param prompt - The user prompt to render into an HTML page.
 * @param renderSiteF - Injectable render function (defaults to
 *   {@link aiChat.renderSite}) for testing.
 * @returns The id of the newly created site.
 * @throws If the render cannot be started at all, e.g. when the OpenRouter API
 *   key is missing. Thrown synchronously by the render function so the caller
 *   can reject the request before sending a polling page for a render that can
 *   never succeed.
 */
function startRenderSite(
  prompt: string,
  renderSiteF: (prompt: string) => Promise<string> = aiChat.renderSite,
): string {
  // Start the render before registering the site: a render that cannot even be
  // started must not leave a permanently unready site behind.
  const tracer = trace.getTracer("vcit");
  const span = tracer.startSpan("site.request_to_ready");
  const id = siteLifeCycle.beginSiteCreation();
  const preview = promptPreview(prompt);
  span.setAttributes({
    "site.id": id,
    "prompt.length": prompt.length,
    "prompt.preview": preview,
  });
  const rendering = renderSiteF(prompt);

  rendering
    .then((content) => {
      try {
        siteLifeCycle.setSiteContent(id, content);
        span.setAttributes({
          "site.content.length": content.length,
        });
        console.log({
          event: "site_ready",
          siteId: id,
          prompt: preview,
          contentLength: content.length,
        });
        span.end();
      } catch (error) {
        span.recordException(error as Error);
        span.end();
        console.error({
          event: "store_failed",
          siteId: id,
          prompt: preview,
          ...errorFields(error),
        });
      }
    })
    .catch((error: unknown) => {
      span.recordException(error as Error);
      span.end();
      console.error({
        event: "render_failed",
        siteId: id,
        prompt: preview,
        ...errorFields(error),
      });
    });

  return id;
}

app.get("/:prompt", (req, res) => {
  const prompt = req.params.prompt;

  try {
    const id = startRenderSite(prompt);
    res.send(pollingPage(id));
  } catch (error) {
    console.error({
      event: "render_start_failed",
      prompt: promptPreview(prompt),
      ...errorFields(error),
    });
    res.status(500).type("text/plain").send(texts.renderStartError());
  }
});

app.get("/isready/:id", (req, res) => {
  const state = siteLifeCycle.isSiteReady(req.params.id);
  if (state !== undefined) {
    res.json({ ready: state });
  } else {
    res.status(404).json({ error: texts.noSiteError() });
  }
});

app.get("/site/:id", (req, res) => {
  const site = siteLifeCycle.getSite(req.params.id);
  if (site == null) {
    console.warn({ event: "site_miss", siteId: req.params.id });
    res.send(texts.noSiteError());
    return;
  }

  res.send(site.getContent());
});

app.listen(8000);
console.log({
  event: "startup",
  aiMode: useMockAi() ? "mock" : "real",
  openrouterApiKeySet: hasOpenRouterApiKey(),
  model: texts.openrouterModel(),
  otelSdkDisabled: Deno.env.get("OTEL_SDK_DISABLED") === "true",
  otelLogsExporter: Deno.env.get("OTEL_LOGS_EXPORTER") ?? null,
  otelLogsEndpoint: Deno.env.get("OTEL_EXPORTER_OTLP_LOGS_ENDPOINT") ?? null,
  otelTracesEndpoint: Deno.env.get("OTEL_EXPORTER_OTLP_TRACES_ENDPOINT") ??
    null,
});
