import type { FirebaseSiteDto } from "../../dto/sites/FirebaseSiteDto"

export interface ISitesFirebaseRepository {
  findById(siteId: string): Promise<FirebaseSiteDto | null>
  findByAuthorId(authorId: string): Promise<FirebaseSiteDto[]>
  create(site: Omit<FirebaseSiteDto, "id" | "createdAt" | "updatedAt">): Promise<FirebaseSiteDto>
  update(site: FirebaseSiteDto): Promise<void>
  delete(siteId: string): Promise<void>
}
