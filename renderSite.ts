import { OpenRouter } from "@openrouter/sdk";
import { requireOpenRouterApiKey } from "./secretsAdapter.ts";
import { openrouterModel, renderSitePrompt } from "./texts.ts";

/**
 * A function that builds an {@link OpenRouter} client from an API key. Exposed
 * as a type so tests can inject a fake router factory.
 */
export type RouterFactory = (apiKey: string) => OpenRouter;

/**
 * Thin wrapper around `@openrouter/sdk` that turns a prompt into a complete,
 * self-contained HTML page.
 */
export class AiChat {
  /** Reused OpenRouter client, if already constructed. */
  openrouter?: OpenRouter;

  /** Builds the OpenRouter client when `openrouter` is not set. */
  routerFactory: RouterFactory = (apiKey) => new OpenRouter({ apiKey });

  /**
   * Asks the model to generate an HTML page for the given prompt.
   *
   * Deliberately not `async`: a missing API key must throw synchronously, so the
   * caller can reject the request before it has already answered with a polling
   * page for a render that can never succeed. Anything that goes wrong after
   * the router is built is reported by rejecting the returned promise.
   *
   * @param prompt - The user request to render.
   * @returns A promise for the generated HTML content.
   * @throws If the OpenRouter API key is not set.
   */
  renderSite = (prompt: string): Promise<string> => {
    const router = this.openrouter ??
      this.routerFactory(requireOpenRouterApiKey());

    return this.request(router, prompt);
  };

  /** Sends the chat request and returns the model's HTML output. */
  private request = async (
    router: OpenRouter,
    prompt: string,
  ): Promise<string> => {
    console.log("request sent");
    const response = await router.chat.send({
      chatRequest: {
        model: openrouterModel(),
        messages: [
          {
            role: "user",
            content: renderSitePrompt(prompt),
          },
        ],
        stream: false,
      },
    });
    console.log("request done");
    return response.choices[0].message.content;
  };
}
