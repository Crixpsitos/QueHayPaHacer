import type { ContentDeclaration } from "@/domain/entities/contentDeclaration/ContentDeclaration";

export interface IContentDeclarationRepository {
  /** Guarda (merge) con `declaredAt` de servidor; si ya había una, la pasa a `previousDeclaredAt`. */
  save(declaration: ContentDeclaration): Promise<void>;
}
