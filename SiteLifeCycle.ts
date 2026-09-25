import { Site } from "./Site.ts";
import { SiteRepository } from "./SiteRepositoryInterface.ts";

/**
 * Coordinates the lifecycle of generated sites: creation, content storage, and
 * readiness queries, backed by a {@link SiteRepository}.
 */
export class SiteLifeCycle {
  /** @param repo - Where sites are stored. */
  constructor(repo: SiteRepository) {
    this.repo = repo;
  }

  /** The backing store for sites. */
  repo: SiteRepository;

  /**
   * Starts creating a new site and returns its generated id.
   *
   * @returns The id of the newly created site.
   */
  beginSiteCreation(): string {
    return this.repo.add(new Site());
  }

  /**
   * Stores rendered content on an existing site, marking it ready.
   *
   * @param id - The site id.
   * @param content - The rendered HTML content.
   * @throws If the site does not exist.
   */
  setSiteContent(id: string, content: string): void {
    const site = this.repo.getMutating(id);
    if (site == null) {
      throw new Error("site does not exist");
    }

    site.setContent(content);
  }

  /**
   * Returns whether a site is ready, or `undefined` if it does not exist.
   *
   * @param id - The site id.
   */
  isSiteReady(id: string): boolean | undefined {
    const site = this.repo.getMutating(id);
    if (site == null) {
      return undefined;
    }

    return site.isReady();
  }

  /**
   * Returns the site for an id, or `undefined` if it does not exist.
   *
   * @param id - The site id.
   */
  getSite(id: string): Site | undefined {
    return this.repo.getMutating(id);
  }
}
