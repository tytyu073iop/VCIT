import { AiChatInterface } from "./AiChatInterface.ts";
import { MockAiChat } from "./MockAiChat.ts";
import { AiChat } from "./renderSite.ts";
import { useMockAi } from "./secretsAdapter.ts";

/**
 * Builds the AI chat implementation the app should use, picked by the
 * `USE_MOCK_AI` environment variable so the flow can be exercised offline.
 *
 * @param mock - Overrides the environment lookup (used by tests).
 * @returns {@link MockAiChat} when mocking is on, otherwise {@link AiChat}.
 */
export function createAiChat(mock: boolean = useMockAi()): AiChatInterface {
  return mock ? new MockAiChat() : new AiChat();
}
