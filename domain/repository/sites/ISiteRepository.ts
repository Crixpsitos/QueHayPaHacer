import type { Site } from "@/domain/entities/sites/Site"

export interface ISiteRepository {
  findById(id: string): Promise<Site | null>
  findByAuthorId(authorId: string): Promise<Site[]>
  create(site: Partial<Site>): Promise<Site>
  update(site: Partial<Site> & { id: string }): Promise<void>
}
