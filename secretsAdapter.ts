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

/**
 * Whether the offline mock AI chat should be used instead of OpenRouter.
 *
 * @returns `true` when `USE_MOCK_AI` is set to `true` or `1`.
 */
export function useMockAi(): boolean {
  const flag = Deno.env.get("USE_MOCK_AI");
  return flag === "true" || flag === "1";
}
