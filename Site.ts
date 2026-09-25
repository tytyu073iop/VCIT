/**
 * A generated site: its rendered content plus a readiness flag.
 */
export class Site {
  constructor() {
    this.#isready = false;
    this.#site = "";
  }

  #isready: boolean;
  #site: string;

  /** Whether the site's content has been set (i.e. rendering is done). */
  isReady() {
    return this.#isready;
  }

  /** Returns the rendered HTML content. */
  getContent() {
    return this.#site.slice();
  }

  /**
   * Sets the rendered content and marks the site ready.
   *
   * @param content - The rendered HTML content.
   */
  setContent(content: string): void {
    this.#isready = true;
    this.#site = content;
  }
}
