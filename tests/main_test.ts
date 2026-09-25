import { assertEquals, assertThrows } from "@std/assert";
import { afterEach, it } from "@std/testing/bdd";
import * as texts from "../texts.ts";
import request from "supertest";
import { aiChat, app, siteLifeCycle } from "../main.ts";
import { SiteRepository } from "../SiteRepositoryInterface.ts";
import { Site } from "../Site.ts";
import { OpenRouter } from "@openrouter/sdk";

const originalRepo = siteLifeCycle.repo;
const originalIsSiteReady = siteLifeCycle.isSiteReady;
const originalRenderSite = aiChat.renderSite;
const originalOpenrouter = aiChat.openrouter;

afterEach(() => {
  siteLifeCycle.repo = originalRepo;
  siteLifeCycle.isSiteReady = originalIsSiteReady;
  aiChat.renderSite = originalRenderSite;
  aiChat.openrouter = originalOpenrouter;
});

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
  aiChat.renderSite = (prompt: string) => {
    req.push(prompt);
    return Promise.resolve("test site");
  };

  await request(app).get(`/${prompt}`)
    .expect("Content-Type", /^text\/html/);
  assertEquals(req.length, 1);
  assertEquals(req[0], prompt);
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
  aiChat.openrouter = {
    chat: {
      send: () => ({
        choices: [{ message: { content: "generated html" } }],
      }),
    },
  } as unknown as OpenRouter;

  const result = await aiChat.renderSite("test prompt");
  assertEquals(result, "generated html");
});
