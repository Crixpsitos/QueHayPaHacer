import type { SiteSuggestion } from "@/domain/entities/siteSuggestion/SiteSuggestion";

export interface ISiteSuggestionRepository {
  /** Sugerencias pendientes del usuario (sitio + campo). */
  pendingByAuthor(uid: string): Promise<{ siteId: string; field: string }[]>;
  /** Crea con `createdAt` de servidor. Devuelve su id. */
  create(suggestion: SiteSuggestion): Promise<string>;
}
