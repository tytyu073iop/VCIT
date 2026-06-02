import { assertEquals } from "@std/assert";
import * as texts from "./texts.ts";
import request from "supertest";
import { app, siteLifeCycle, aiChat } from "./main.tsx";
import { SiteRepository } from "./SiteRepositoryInterface.ts";
import { Site } from "./Site.ts";


Deno.test("returns instruction on just /", async () => {
  const res = await request(app).get("/")
    .expect("Content-Type", /^text\/html/);
  assertEquals(res.text, texts.instruction());
});

Deno.test("check state on /isready/ false", async () => {
  const id = 1;
  const original = siteLifeCycle.isSiteReady;
  siteLifeCycle.isSiteReady = () => false;

  const res = await request(app).get(`/isready/${id}`)
  .expect("Content-Type", /^application\/json/);
  assertEquals(res.text, JSON.stringify(texts.False()));

  siteLifeCycle.isSiteReady = original;
});

Deno.test("check state on /isready/ not given", async () => {
  const id = 1;

  const res = await request(app).get(`/isready/${id}`)
  .expect("Content-Type", /^application\/json/);
  assertEquals(res.text, JSON.stringify(texts.noSiteError()));
});

Deno.test("check state on /isready/ true", async () => {
  const id = 1;
  const original = siteLifeCycle.isSiteReady;
  siteLifeCycle.isSiteReady = () => true;

  const res = await request(app).get(`/isready/${id}`)
  .expect("Content-Type", /^application\/json/);
  assertEquals(res.text, JSON.stringify(texts.True()));

  siteLifeCycle.isSiteReady = original;
});

Deno.test("check prompt rendering request /prompt", async () => {
  const prompt = "test prompt";
  const req: string[] = [];
  const original = aiChat.renderSite;
  aiChat.renderSite = (prompt: string) => {req.push(prompt); return Promise.resolve("test site")}; 

  await request(app).get(`/${prompt}`)
  .expect("Content-Type", /^text\/html/);
  assertEquals(req.length, 1);
  assertEquals(req[0], prompt);

  aiChat.renderSite = original;
});

Deno.test("check that site is given by /id", async () => {
  const id = "1";
  const dumText = "test";
  const original = siteLifeCycle.repo;
  const req: string[] = [];
  siteLifeCycle.repo = new class implements SiteRepository {
    add(_site: Site): string {
      throw new Error("Method not implemented.");
    }
    getMutating(id: string): Site | undefined {
      req.push(id);
      const s = new Site();
      s.setContent(dumText);
      return s;
    }
};

const s = await request(app).get(`/site/${id}`)
.expect("Content-Type", /^text\/html/);
assertEquals(req.length, 1);
assertEquals(req[0], id);
assertEquals(s.text, dumText);


  siteLifeCycle.repo = original;
});

Deno.test("check that site is not given by /id", async () => {
  const id = "1";
  const original = siteLifeCycle.repo;
  siteLifeCycle.repo = new class implements SiteRepository {
    add(_site: Site): string {
      throw new Error("Method not implemented.");
    }
    getMutating(_id: string): Site | undefined {
      return undefined;
    }
};

const s = await request(app).get(`/site/${id}`)
.expect("Content-Type", /^text\/html/);
assertEquals(s.text, texts.noSiteError());


  siteLifeCycle.repo = original;
});