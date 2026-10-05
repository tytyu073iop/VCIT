import { assertEquals, assertThrows } from "@std/assert";
import { afterEach, it } from "@std/testing/bdd";
import * as texts from "../texts.ts";
import request from "supertest";
import { aiChat, app, siteLifeCycle } from "../main.ts";
import { SiteRepository } from "../SiteRepositoryInterface.ts";
import { Site } from "../Site.ts";
import { AiChat } from "../renderSite.ts";
import { OpenRouter } from "@openrouter/sdk";

const originalRepo = siteLifeCycle.repo;
const originalIsSiteReady = siteLifeCycle.isSiteReady;
const originalRenderSite = aiChat.renderSite;
const originalBeginSiteCreation = siteLifeCycle.beginSiteCreation;
const originalKey = Deno.env.get("OPENROUTER_API_KEY");

afterEach(() => {
  siteLifeCycle.repo = originalRepo;
  siteLifeCycle.isSiteReady = originalIsSiteReady;
  siteLifeCycle.beginSiteCreation = originalBeginSiteCreation;
  aiChat.renderSite = originalRenderSite;
  if (originalKey === undefined) {
    Deno.env.delete("OPENROUTER_API_KEY");
  } else {
    Deno.env.set("OPENROUTER_API_KEY", originalKey);
  }
});

/** Routes the app's render through an OpenRouter chat with an injected client. */
function useOpenRouterChat(client?: OpenRouter): void {
  const chat = new AiChat();
  chat.openrouter = client;
  aiChat.renderSite = (prompt: string) => chat.renderSite(prompt);
}

function fakeRepo(
  getMutating: (id: string) => Site | undefined,
): SiteRepository {
  return {
    add(_site: Site) {
      throw new Error("Method not implemented.");
    },
    getMutating,
  };
}

function siteWithContent(content: string): Site {
  const site = new Site();
  site.setContent(content);
  return site;
}

it("returns instruction on just /", async () => {
  const res = await request(app).get("/")
    .expect("Content-Type", /^text\/html/);
  assertEquals(res.text, texts.instruction());
});

it("check state on /isready/ false", async () => {
  const id = 1;
  siteLifeCycle.isSiteReady = () => false;

  const res = await request(app).get(`/isready/${id}`)
    .expect("Content-Type", /^application\/json/);
  assertEquals(res.text, JSON.stringify({ ready: false }));
});

it("check state on /isready/ not given", async () => {
  const id = 1;

  const res = await request(app).get(`/isready/${id}`)
    .expect(404)
    .expect("Content-Type", /^application\/json/);
  assertEquals(res.text, JSON.stringify({ error: texts.noSiteError() }));
});

it("check state on /isready/ true", async () => {
  const id = 1;
  siteLifeCycle.isSiteReady = () => true;

  const res = await request(app).get(`/isready/${id}`)
    .expect("Content-Type", /^application\/json/);
  assertEquals(res.text, JSON.stringify({ ready: true }));
});

it("check prompt rendering request /prompt", async () => {
  const prompt = "test prompt";
  const req: string[] = [];
  Deno.env.set("OPENROUTER_API_KEY", "test-key");
  aiChat.renderSite = (prompt: string) => {
    req.push(prompt);
    return Promise.resolve("test site");
  };

  await request(app).get(`/${prompt}`)
    .expect("Content-Type", /^text\/html/);
  assertEquals(req.length, 1);
  assertEquals(req[0], prompt);
});

it("returns 500 on /prompt when the api key is missing", async () => {
  Deno.env.delete("OPENROUTER_API_KEY");
  useOpenRouterChat();
  let created = false;
  siteLifeCycle.beginSiteCreation = () => {
    created = true;
    return "1";
  };

  const res = await request(app).get("/test prompt").expect(500);
  assertEquals(res.text, texts.renderStartError());
  assertEquals(created, false);
});

it("returns 500 on /prompt when the api key is empty", async () => {
  Deno.env.set("OPENROUTER_API_KEY", "");
  useOpenRouterChat();

  await request(app).get("/test prompt").expect(500);
});

it("survives a rejected render without crashing the process", async () => {
  Deno.env.set("OPENROUTER_API_KEY", "test-key");
  aiChat.renderSite = () => Promise.reject(new Error("boom"));

  const res = await request(app).get("/test prompt")
    .expect("Content-Type", /^text\/html/);
  assertEquals(res.text.includes("/isready/"), true);

  // Give the rejected promise a chance to settle; an unhandled rejection here
  // would fail the test run rather than being logged.
  await new Promise((resolve) => setTimeout(resolve, 10));
});

it("check that site is given by /id", async () => {
  const id = "1";
  const dumText = "test";
  const req: string[] = [];
  siteLifeCycle.repo = fakeRepo((id) => {
    req.push(id);
    return siteWithContent(dumText);
  });

  const s = await request(app).get(`/site/${id}`)
    .expect("Content-Type", /^text\/html/);
  assertEquals(req.length, 1);
  assertEquals(req[0], id);
  assertEquals(s.text, dumText);
});

it("check that site is not given by /id", async () => {
  const id = "1";
  siteLifeCycle.repo = fakeRepo(() => undefined);

  const s = await request(app).get(`/site/${id}`)
    .expect("Content-Type", /^text\/html/);
  assertEquals(s.text, texts.noSiteError());
});

it("Site isReady reflects content state", () => {
  const site = new Site();
  assertEquals(site.isReady(), false);

  site.setContent("test content");
  assertEquals(site.isReady(), true);
});

it("setSiteContent throws when site does not exist", () => {
  siteLifeCycle.repo = fakeRepo(() => undefined);

  assertThrows(() => siteLifeCycle.setSiteContent("1", "content"));
});

it("isSiteReady returns true for an existing ready site", () => {
  siteLifeCycle.repo = fakeRepo(() => siteWithContent("test"));

  assertEquals(siteLifeCycle.isSiteReady("1"), true);
});

it("renderSite calls openrouter and returns content", async () => {
  const chat = new AiChat();
  chat.openrouter = {
    chat: {
      send: () => ({
        choices: [{ message: { content: "generated html" } }],
      }),
    },
  } as unknown as OpenRouter;

  const result = await chat.renderSite("test prompt");
  assertEquals(result, "generated html");
});
