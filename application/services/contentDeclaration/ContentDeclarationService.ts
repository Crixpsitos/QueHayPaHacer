import type { IContentDeclarationRepository } from "@/domain/repository/contentDeclaration/IContentDeclarationRepository";
import type { DeclarationTargetType } from "@/domain/entities/contentDeclaration/ContentDeclaration";
import { LEGAL_VERSION } from "@/app/lib/legal/version";

export class ContentDeclarationService {
  constructor(private readonly repository: IContentDeclarationRepository) {}

  /** `uid` debe venir de la sesión del servidor, nunca del cliente. Lanza si no se pudo guardar. */
  record(uid: string, targetType: DeclarationTargetType, targetId: string): Promise<void> {
    return this.repository.save({ uid, targetType, targetId, termsVersion: LEGAL_VERSION });
  }
}
