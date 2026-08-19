import type { ProfileStats } from "@/domain/repository/profile/IProfileRepository";
import type {
  FirestoreDoc,
  ProfileInteractionsRaw,
} from "@/infraestructure/firebase/dto/profile/FirebaseProfileDto";

/**
 * Puerto de infraestructura: las lecturas devuelven docs crudos de Firestore.
 * La proyección a read-models vive en `ProfileAdapter` (vía `ProfileFirebaseMapper`).
 * `getStats` es un agregado de contadores: no hay nada que mapear, pasa directo.
 */
export interface IProfileFirebaseRepository {
  getStats(uid: string): Promise<ProfileStats>;
  getUserEvents(uid: string): Promise<FirestoreDoc[]>;
  getUserSites(uid: string): Promise<FirestoreDoc[]>;
  getUserEventInteractions(uid: string): Promise<ProfileInteractionsRaw>;
  getUserBadges(uid: string): Promise<FirestoreDoc[]>;
}
