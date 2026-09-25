import { Site } from "./Site.ts";

/** Storage abstraction for sites. */
export interface SiteRepository {
  /**
   * Stores a site and returns the id it was stored under.
   *
   * @param site - The site to store.
   */
  add(site: Site): string;

  /**
   * Returns a site by id, or `undefined` if it does not exist.
   *
   * @param id - The site id.
   */
  getMutating(id: string): Site | undefined;
}
