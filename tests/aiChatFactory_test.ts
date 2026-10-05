import { assertEquals } from "@std/assert";
import { afterEach, it } from "@std/testing/bdd";
import { createAiChat } from "../aiChatFactory.ts";
import { MockAiChat } from "../MockAiChat.ts";
import { AiChat } from "../renderSite.ts";
import { mockSite } from "../texts.ts";

const originalFlag = Deno.env.get("USE_MOCK_AI");

afterEach(() => {
  if (originalFlag === undefined) {
    Deno.env.delete("USE_MOCK_AI");
  } else {
    Deno.env.set("USE_MOCK_AI", originalFlag);
  }
});

it("mock renders a canned page without calling openrouter", async () => {
  assertEquals(
    await new MockAiChat().renderSite("a <b> prompt"),
    mockSite("a <b> prompt"),
  );
});

it("mock escapes the prompt in its page", async () => {
  const html = await new MockAiChat().renderSite("<script>alert(1)</script>");

  assertEquals(html.includes("<script>alert(1)</script>"), false);
  assertEquals(html.includes("&lt;script&gt;"), true);
});

it("createAiChat returns the mock when USE_MOCK_AI is true", () => {
  Deno.env.set("USE_MOCK_AI", "true");

  assertEquals(createAiChat() instanceof MockAiChat, true);
});

it("createAiChat returns the mock when USE_MOCK_AI is 1", () => {
  Deno.env.set("USE_MOCK_AI", "1");

  assertEquals(createAiChat() instanceof MockAiChat, true);
});

it("createAiChat returns openrouter chat when USE_MOCK_AI is unset", () => {
  Deno.env.delete("USE_MOCK_AI");

  assertEquals(createAiChat() instanceof AiChat, true);
});

it("createAiChat returns openrouter chat when USE_MOCK_AI is not truthy", () => {
  Deno.env.set("USE_MOCK_AI", "false");

  assertEquals(createAiChat() instanceof AiChat, true);
});
