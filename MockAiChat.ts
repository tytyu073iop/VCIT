import { AiChatInterface } from "./AiChatInterface.ts";
import { mockSite } from "./texts.ts";

/**
 * Offline stand-in for {@link AiChat} that returns a canned page instead of
 * calling OpenRouter, so the app can be exercised without an API key.
 */
export class MockAiChat implements AiChatInterface {
  /** Always resolves; the mock never fails and never touches the network. */
  renderSite = (prompt: string): Promise<string> =>
    Promise.resolve(mockSite(prompt));
}
