import { Site } from "./Site.ts";
import { SiteRepository } from "./SiteRepositoryInterface.ts";

/**
 * In-memory {@link SiteRepository} backed by a `Map`. Sites are lost when the
 * process restarts.
 */
export class SiteRepositoryImpl implements SiteRepository {
  constructor() {
    this.#map = new Map();
  }

  /**
   * Stores a site under a freshly generated UUID and returns that id.
   *
   * @param site - The site to store.
   * @returns The id the site was stored under.
   */
  add(site: Site): string {
    const id = crypto.randomUUID();
    this.#map.set(id, site);
    return id;
  }

  /**
   * Returns the site for an id, or `undefined` if it does not exist.
   *
   * @param id - The site id.
   */
  getMutating(id: string): Site | undefined {
    return this.#map.get(id);
  }

  #map: Map<string, Site>;
}
