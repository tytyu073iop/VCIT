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
   * @param prompt - The user request to render.
   * @returns The generated HTML content.
   */
  renderSite = async (prompt: string): Promise<string> => {
    console.log("request sent");
    const router = this.openrouter ??
      this.routerFactory(requireOpenRouterApiKey());
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
