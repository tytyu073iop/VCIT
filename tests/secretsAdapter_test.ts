import { assertEquals, assertThrows } from "@std/assert";
import { afterEach, it } from "@std/testing/bdd";
import { requireOpenRouterApiKey, useMockAi } from "../secretsAdapter.ts";

const originalKey = Deno.env.get("OPENROUTER_API_KEY");
const originalMockFlag = Deno.env.get("USE_MOCK_AI");

afterEach(() => {
  if (originalKey === undefined) {
    Deno.env.delete("OPENROUTER_API_KEY");
  } else {
    Deno.env.set("OPENROUTER_API_KEY", originalKey);
  }
  if (originalMockFlag === undefined) {
    Deno.env.delete("USE_MOCK_AI");
  } else {
    Deno.env.set("USE_MOCK_AI", originalMockFlag);
  }
});

it("returns the API key when set", () => {
  Deno.env.set("OPENROUTER_API_KEY", "test-key");
  assertEquals(requireOpenRouterApiKey(), "test-key");
});

it("throws when API key is not set", () => {
  Deno.env.delete("OPENROUTER_API_KEY");
  assertThrows(
    () => requireOpenRouterApiKey(),
    Error,
    "OPENROUTER_API_KEY is not set",
  );
});

it("useMockAi is false when the flag is unset", () => {
  Deno.env.delete("USE_MOCK_AI");
  assertEquals(useMockAi(), false);
});

it("useMockAi is true when the flag is true", () => {
  Deno.env.set("USE_MOCK_AI", "true");
  assertEquals(useMockAi(), true);
});

it("useMockAi is false for any other flag value", () => {
  Deno.env.set("USE_MOCK_AI", "yes");
  assertEquals(useMockAi(), false);
});
