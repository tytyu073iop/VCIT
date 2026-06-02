import { Site } from "./Site.ts"

export interface SiteRepository {
    add(site: Site): string;
    getMutating(id: string): Site | undefined;
}