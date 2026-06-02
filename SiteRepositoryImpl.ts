import { Site } from "./Site.ts";
import { SiteRepository } from "./SiteRepositoryInterface.ts";

export class SiteRepositoryImpl implements SiteRepository {
    constructor() {
        this.#map = new Map();
    }

    add(site: Site): string {
      const id = crypto.randomUUID();
      this.#map.set(id, site);
      return id;
    }
    getMutating(id: string): Site | undefined {
      return this.#map.get(id);
    }

    #map: Map<string, Site>;
}