import type { Site } from "@/domain/entities/sites/Site"
import type { ISiteRepository } from "@/domain/repository/sites/ISiteRepository"
import type { ISitesFirebaseRepository } from "@/infraestructure/firebase/repositories/sites/ISitesFirebaseRepository"
import { SiteFirebaseMapper } from "@/infraestructure/firebase/mappers/sites/SiteFirebaseMapper"
import type { FirebaseSiteDto } from "@/infraestructure/firebase/dto/sites/FirebaseSiteDto"
import type { SiteDetail } from "@/presentation/sites/view-models/SiteFormViewModel"

export class SitesAdapter implements ISiteRepository {
  constructor(
    private readonly repo: ISitesFirebaseRepository,
    private readonly mapper: SiteFirebaseMapper,
  ) {}

  async findById(id: string): Promise<Site | null> {
    const dto = await this.repo.findById(id)
    return dto ? this.mapper.toDomain(dto) : null
  }

  /** Raw DTO — avoids domain mapping (robust against legacy media shapes). */
  async findRawById(id: string): Promise<FirebaseSiteDto | null> {
    return this.repo.findById(id)
  }

  async findByAuthorId(authorId: string): Promise<Site[]> {
    const dtos = await this.repo.findByAuthorId(authorId)
    return dtos.map((d) => this.mapper.toDomain(d))
  }

  async create(site: Partial<Site>): Promise<Site> {
    const dto = await this.repo.create(site as never)
    return this.mapper.toDomain(dto)
  }

  async update(site: Partial<Site> & { id: string }): Promise<void> {
    await this.repo.update(site as never)
  }

  /** Extra: leer lista directamente como SiteDetail (evita ir por domain). */
  async findDetailsByAuthorId(authorId: string): Promise<SiteDetail[]> {
    const dtos = await this.repo.findByAuthorId(authorId)
    return dtos.map((d) => this.mapper.toSiteDetail(d))
  }

  /** Raw create — recibe DTO sin id/timestamps, devuelve id generado. */
  async createRaw(data: Omit<FirebaseSiteDto, "id" | "createdAt" | "updatedAt">): Promise<string> {
    const dto = await this.repo.create(data)
    return dto.id
  }

  /** Raw update — recibe DTO parcial con id. */
  async updateRaw(data: FirebaseSiteDto): Promise<void> {
    await this.repo.update(data)
  }

  async deleteRaw(id: string): Promise<void> {
    await this.repo.delete(id)
  }
}
