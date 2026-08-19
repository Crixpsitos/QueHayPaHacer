import type { SiteLocation } from "@/domain/entities/sites/value-objects/SiteLocation";
import { SiteMedia } from "./value-objects/SiteMedia";
import { Schedule } from "./value-objects/Schedule";
import { SiteAuthor } from "./value-objects/SiteAuthor";
import { SitePublicationStatus } from "./value-objects/SitePublicationStatus";
import { SiteModerationStatus } from "./value-objects/SiteModerationStatus";
import { SiteAnalytics } from "./value-objects/SiteAnalytics";
import { ImageMedia } from "./value-objects/ImageMedia";

export class Site {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly slug: string,
    public readonly description: string,
    public readonly location: SiteLocation,
    public readonly media: SiteMedia[],
    public readonly schedule: Schedule,
    public readonly author: SiteAuthor,
    public readonly publicationStatus: SitePublicationStatus,
    public readonly moderationStatus: SiteModerationStatus,
    public readonly isActive: boolean,
    public readonly analytics: SiteAnalytics,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly publishedAt: Date | null = null,
    public readonly reviewedAt: Date | null = null,
    public readonly reviewedBy: string | null = null,
    public readonly rejectedAt: Date | null = null,
    public readonly rejectionReason: string | null = null,
  ) {
    if (publicationStatus === "published") {
      if (!name.trim()) throw new Error("Nombre requerido");
      if (!slug.trim()) throw new Error("Slug requerido");
      if (!description.trim()) throw new Error("Descripción requerida");
      if(!location.address.trim()) throw new Error("Dirección requerida");

      const covers = media.filter((m) => m.type === "image" && m.isCover);

      if(covers.length !== 1) throw new Error("Debe haber exactamente una imagen de portada");
    }
  }

  get cover(): ImageMedia | null {
    return this.media.find(
      (m): m is ImageMedia => m.type === "image" && m.isCover
    ) ?? null
  }

   get markerImageUrl(): string | null {
    return this.cover?.markerUrl ?? null
  }

  /**
   * Regla de negocio: un sitio es "nuevo" si fue creado hace menos de 7 días.
   * Vive en la entidad de dominio porque depende exclusivamente del estado
   * propio (createdAt) y un umbral definido por el negocio.
   */
  get isNew(): boolean {
    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
    return Date.now() - this.createdAt.getTime() < SEVEN_DAYS_MS;
  }
}
