import { assertEquals } from "@std/assert";
import { afterEach, it } from "@std/testing/bdd";
import { AiChat } from "../renderSite.ts";
import { OpenRouter } from "@openrouter/sdk";
import { openrouterModel, renderSitePrompt } from "../texts.ts";

const aiChat = new AiChat();
const originalOpenrouter = aiChat.openrouter;
const originalRouterFactory = aiChat.routerFactory;
const originalKey = Deno.env.get("OPENROUTER_API_KEY");

afterEach(() => {
  aiChat.openrouter = originalOpenrouter;
  aiChat.routerFactory = originalRouterFactory;
  if (originalKey === undefined) {
    Deno.env.delete("OPENROUTER_API_KEY");
  } else {
    Deno.env.set("OPENROUTER_API_KEY", originalKey);
  }
});

it("returns generated content from openrouter", async () => {
  aiChat.openrouter = {
    chat: {
      send: () => ({
        choices: [{ message: { content: "generated html" } }],
      }),
    },
  } as unknown as OpenRouter;

  assertEquals(await aiChat.renderSite("test prompt"), "generated html");
});

it("sends model, prompt and non-streaming flag to openrouter", async () => {
  let sent: { chatRequest: unknown } | undefined;
  aiChat.openrouter = {
    chat: {
      send: (args: { chatRequest: unknown }) => {
        sent = args;
        return { choices: [{ message: { content: "html" } }] };
      },
    },
  } as unknown as OpenRouter;

  await aiChat.renderSite("make a page");

  const chatRequest = sent!.chatRequest as {
    model: string;
    messages: { role: string; content: string }[];
    stream: boolean;
  };
  assertEquals(chatRequest.model, openrouterModel());
  assertEquals(chatRequest.stream, false);
  assertEquals(chatRequest.messages, [
    { role: "user", content: renderSitePrompt("make a page") },
  ]);
});

it("constructs a new router with the api key when openrouter is unset", async () => {
  Deno.env.set("OPENROUTER_API_KEY", "test-key");
  aiChat.openrouter = undefined;
  const builtKeys: string[] = [];
  aiChat.routerFactory = (apiKey) => {
    builtKeys.push(apiKey);
    return {
      chat: {
        send: () => ({
          choices: [{ message: { content: "fallback html" } }],
        }),
      },
    } as unknown as OpenRouter;
  };

  assertEquals(await aiChat.renderSite("prompt"), "fallback html");
  assertEquals(builtKeys, ["test-key"]);
});
