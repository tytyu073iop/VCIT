import { Site } from "./Site.ts";
import { SiteRepository } from "./SiteRepositoryInterface.ts";

export class SiteLifeCycle {
    constructor(repo: SiteRepository) {
        this.repo = repo;
    }

    repo: SiteRepository;

    beginSiteCreation(): string {
        return this.repo.add(new Site());
    }

    setSiteContent(id: string, content: string): void {
        const site = this.repo.getMutating(id);
        if (site == null) {
            throw new Error("site does not exist");
        }

        site.setContent(content);
    }

    isSiteReady(id: string): boolean {
        const site = this.repo.getMutating(id);
        if (site == null) {
            throw new Error("site does not exist");
        }

        return site.isReady();
    }

    getSite(id: string): Site | undefined {
        return this.repo.getMutating(id);
    }
}