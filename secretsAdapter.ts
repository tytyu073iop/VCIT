/**
 * Reads the OpenRouter API key from the environment, throwing if it is absent.
 *
 * @returns The OpenRouter API key.
 * @throws If `OPENROUTER_API_KEY` is not set.
 */
export function requireOpenRouterApiKey(): string {
  const apiKey = Deno.env.get("OPENROUTER_API_KEY");
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not set");
  }
  return apiKey;
}
