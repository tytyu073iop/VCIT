import { assertEquals, assertThrows } from "@std/assert";
import { afterEach, it } from "@std/testing/bdd";
import { requireOpenRouterApiKey } from "../secretsAdapter.ts";

const originalKey = Deno.env.get("OPENROUTER_API_KEY");

afterEach(() => {
  if (originalKey === undefined) {
    Deno.env.delete("OPENROUTER_API_KEY");
  } else {
    Deno.env.set("OPENROUTER_API_KEY", originalKey);
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
