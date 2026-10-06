import { AiChatInterface } from "./AiChatInterface.ts";
import { promptPreview } from "./log.ts";
import { mockSite } from "./texts.ts";

/**
 * Offline stand-in for {@link AiChat} that returns a canned page instead of
 * calling OpenRouter, so the app can be exercised without an API key.
 */
export class MockAiChat implements AiChatInterface {
  /** Always resolves; the mock never fails and never touches the network. */
  renderSite = (prompt: string): Promise<string> => {
    const model = "mock";
    const preview = promptPreview(prompt);
    const startedAt = performance.now();

    console.log({ event: "render_start", model, prompt: preview });

    const content = mockSite(prompt);

    console.log({
      event: "render_done",
      model,
      prompt: preview,
      durationMs: Math.round(performance.now() - startedAt),
      contentLength: content.length,
    });

    return Promise.resolve(content);
  };
}
