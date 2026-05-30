import { assertEquals } from "@std/assert";
import * as texts from "./texts.ts";
import request from "supertest";
import { app } from "./main.tsx";

Deno.test("returns instruction on just /", async () => {
  const res = await request(app).get("/")
    .expect("Content-Type", /^text\/html/);
  assertEquals(res.text, texts.instruction());
});
