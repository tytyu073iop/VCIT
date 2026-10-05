import express from "express";
import * as texts from "./texts.ts";
import { SiteLifeCycle } from "./SiteLifeCycle.ts";
import { SiteRepositoryImpl } from "./SiteRepositoryImpl.ts";
import { AiChat } from "./renderSite.ts";
import { pollingPage } from "./pollingPage.ts";

/** The Express application that serves the site rendering endpoints. */
export const app = express();

/** Manages the creation and readiness lifecycle of generated sites. */
export const siteLifeCycle = new SiteLifeCycle(new SiteRepositoryImpl());

app.get("/", (_req, res) => {
  res.contentType("text/html");
  res.send(texts.instruction());
});

/** Wrapper around the OpenRouter SDK used to render prompt-driven HTML. */
export const aiChat = new AiChat();

/**
 * Formats a caught value as a single log line.
 *
 * `console.error` prints an `Error`'s whole stack, which buries the message
 * that actually says what went wrong.
 *
 * @param error - The caught value, of unknown type.
 */
function describeError(error: unknown): string {
  return error instanceof Error ? `${error.name}: ${error.message}` : String(
    error,
  );
}

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
  const rendering = renderSiteF(prompt);
  const id = siteLifeCycle.beginSiteCreation();

  rendering
    .then((res) => {
      console.log(`${id} is ready`);
      siteLifeCycle.setSiteContent(id, res);
    })
    .catch((error: unknown) => {
      console.error(`${id} render failed: ${describeError(error)}`);
    });

  return id;
}

app.get("/:prompt", (req, res) => {
  const prompt = req.params.prompt;

  try {
    const id = startRenderSite(prompt);
    res.send(pollingPage(id));
  } catch (error) {
    console.error(`could not start rendering: ${describeError(error)}`);
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
    res.send(texts.noSiteError());
    return;
  }

  res.send(site.getContent());
});

app.listen(8000);
console.log(`Server is running on http://localhost:8000`);
