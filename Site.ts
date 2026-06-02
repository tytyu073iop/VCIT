export class Site {
    constructor() {
        this.#isready = false;
        this.#site = "";
    }

    #isready: boolean;
    #site: string;

    isReady() {
        return this.#isready;
    }

    getContent() {
        // TODO: fight copying
        return this.#site;
    }

    setContent(content: string): void {
        this.#isready = true;
        this.#site = content;
    }
}