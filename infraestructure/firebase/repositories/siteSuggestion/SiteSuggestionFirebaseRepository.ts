import { FieldValue, type Firestore, type Timestamp } from "firebase-admin/firestore";
import { FirebaseBaseRepository } from "../FirebaseBaseRepository";
import type { ISiteSuggestionRepository } from "@/domain/repository/siteSuggestion/ISiteSuggestionRepository";
import type { SiteSuggestion, SiteSuggestionItem } from "@/domain/entities/siteSuggestion/SiteSuggestion";
import { normalizeText, type RecentSubmission } from "@/domain/entities/spamGuard/spamGuard";

const ms = (t: unknown) => (t as Timestamp | undefined)?.toMillis();

// ponytail: sin adapter/mapper; solo Admin SDK (las reglas niegan todo acceso de cliente).
export class SiteSuggestionFirebaseRepository extends FirebaseBaseRepository implements ISiteSuggestionRepository {
  protected readonly collectionName = "siteSuggestions";

  constructor(db: Firestore) {
    super(db);
  }

  async pendingByAuthor(uid: string) {
    // Dos igualdades: sin índice compuesto.
    const snap = await this.collection.where("authorUid", "==", uid).where("status", "==", "pending").get();
    return snap.docs.map((d) => ({ siteId: d.get("siteId") as string, field: d.get("field") as string }));
  }

  async recentByAuthor(uid: string): Promise<RecentSubmission[]> {
    // Una sola igualdad: sin índice compuesto. Ventana y orden en memoria.
    // ponytail: lee todo el historial del usuario (solo 2 campos); con topes de 20/día es poco. Añadir ventana si crece.
    const snap = await this.collection.where("authorUid", "==", uid).select("createdAt", "description").get();
    return snap.docs.flatMap((d) => {
      const at = ms(d.get("createdAt"));
      return at ? [{ at, text: normalizeText((d.get("description") as string) ?? "") }] : [];
    });
  }

  async create(suggestion: SiteSuggestion): Promise<string> {
    const ref = await this.collection.add({ ...suggestion, createdAt: FieldValue.serverTimestamp() });
    return ref.id;
  }

  async listBySite(siteId: string): Promise<SiteSuggestionItem[]> {
    const snap = await this.collection.where("siteId", "==", siteId).get();
    return snap.docs.map((d) => ({
      id: d.id,
      siteId,
      siteName: d.get("siteName") as string,
      authorName: d.get("authorName") as string,
      field: d.get("field"),
      description: d.get("description") as string,
      ...(d.get("source") ? { source: d.get("source") as string } : {}),
      status: d.get("status"),
      createdAt: ms(d.get("createdAt")) ?? 0,
      ...(ms(d.get("resolvedAt")) ? { resolvedAt: ms(d.get("resolvedAt")) } : {}),
      ...(d.get("resolutionNote") ? { resolutionNote: d.get("resolutionNote") as string } : {}),
    }));
  }

  async getSiteIdAndStatus(id: string) {
    const snap = await this.collection.doc(id).get();
    return snap.exists ? { siteId: snap.get("siteId") as string, status: snap.get("status") as string } : null;
  }

  async resolve(id: string, r: { status: "applied" | "rejected"; resolvedBy: string; note?: string }) {
    const ref = this.collection.doc(id);
    return this.db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (snap.get("status") !== "pending") return "not_pending" as const;
      tx.update(ref, {
        status: r.status,
        resolvedAt: FieldValue.serverTimestamp(),
        resolvedBy: r.resolvedBy,
        ...(r.note ? { resolutionNote: r.note } : {}),
      });
      return "ok" as const;
    });
  }
}
