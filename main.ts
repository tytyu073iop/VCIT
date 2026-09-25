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
 * Begins creating a site for a prompt and returns its id immediately. The
 * render happens asynchronously; when it completes the site content is stored.
 *
 * @param prompt - The user prompt to render into an HTML page.
 * @param renderSiteF - Injectable render function (defaults to
 *   {@link aiChat.renderSite}) for testing.
 * @returns The id of the newly created site.
 */
function startRenderSite(
  prompt: string,
  renderSiteF: (prompt: string) => Promise<string> = aiChat.renderSite,
): string {
  const id = siteLifeCycle.beginSiteCreation();

  renderSiteF(prompt).then((res) => {
    console.log(`${id} is ready`);
    siteLifeCycle.setSiteContent(id, res);
  });

  return id;
}

app.get("/:prompt", (req, res) => {
  const prompt = req.params.prompt;
  const id = startRenderSite(prompt);

  res.send(pollingPage(id));
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
