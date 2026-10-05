/**
 * Anything that can turn a prompt into a complete, self-contained HTML page.
 *
 * Declared as a mutable property rather than a method so implementations may
 * bind `this` (see {@link AiChat}) and so tests can swap the function.
 */
export interface AiChatInterface {
  /**
   * Renders the given prompt into HTML.
   *
   * Implementations that can fail before sending any request (e.g. a missing
   * API key) must throw synchronously rather than reject, so callers can refuse
   * the request instead of waiting for a render that can never succeed.
   *
   * @param prompt - The user request to render.
   */
  renderSite: (prompt: string) => Promise<string>;
}
