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
 * Whether the OpenRouter API key env var holds a non-empty value. For startup
 * diagnostics only — never log the key itself.
 *
 * @returns `true` when `OPENROUTER_API_KEY` is set to a non-empty string.
 */
export function hasOpenRouterApiKey(): boolean {
  return Boolean(Deno.env.get("OPENROUTER_API_KEY"));
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
