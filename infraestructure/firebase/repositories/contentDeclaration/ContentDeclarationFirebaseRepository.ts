import { FieldValue, type Firestore } from "firebase-admin/firestore";
import { FirebaseBaseRepository } from "../FirebaseBaseRepository";
import type { IContentDeclarationRepository } from "@/domain/repository/contentDeclaration/IContentDeclarationRepository";
import type { ContentDeclaration } from "@/domain/entities/contentDeclaration/ContentDeclaration";
import { declarationDocId } from "@/app/lib/legal/declaration";

// ponytail: sin adapter/mapper; solo Admin SDK (las reglas niegan acceso de cliente).
export class ContentDeclarationFirebaseRepository
  extends FirebaseBaseRepository
  implements IContentDeclarationRepository
{
  protected readonly collectionName = "contentDeclarations";

  constructor(db: Firestore) {
    super(db);
  }

  async save(d: ContentDeclaration): Promise<void> {
    const ref = this.collection.doc(declarationDocId(d.targetType, d.targetId));
    const previous = (await ref.get()).get("declaredAt");
    await ref.set(
      {
        ...d,
        declaredAt: FieldValue.serverTimestamp(),
        ...(previous ? { previousDeclaredAt: previous } : {}),
      },
      { merge: true },
    );
  }
}
