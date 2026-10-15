import { FieldValue, type Firestore } from "firebase-admin/firestore";
import { FirebaseBaseRepository } from "../FirebaseBaseRepository";
import type { ISiteClaimRepository } from "@/domain/repository/siteClaim/ISiteClaimRepository";
import type { SiteClaim } from "@/domain/entities/siteClaim/SiteClaim";

// ponytail: sin adapter/mapper; solo Admin SDK (las reglas niegan todo acceso de cliente).
export class SiteClaimFirebaseRepository extends FirebaseBaseRepository implements ISiteClaimRepository {
  protected readonly collectionName = "siteClaims";

  constructor(db: Firestore) {
    super(db);
  }

  async pendingSiteIdsByClaimant(uid: string): Promise<string[]> {
    // Dos igualdades: sin índice compuesto.
    const snap = await this.collection.where("claimantUid", "==", uid).where("status", "==", "pending").get();
    return snap.docs.map((d) => d.get("siteId") as string);
  }

  async create(claim: SiteClaim): Promise<string> {
    const { contactPhone, ...rest } = claim;
    const ref = await this.collection.add({
      ...rest,
      ...(contactPhone ? { contactPhone } : {}),
      createdAt: FieldValue.serverTimestamp(),
    });
    return ref.id;
  }
}
