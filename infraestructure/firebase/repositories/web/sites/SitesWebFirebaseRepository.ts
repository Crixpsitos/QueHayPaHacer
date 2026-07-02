import { doc, type Firestore, onSnapshot } from "firebase/firestore"
import type { FirebaseSiteDto } from "@/infraestructure/firebase/dto/sites/FirebaseSiteDto"

export class SitesWebFirebaseRepository {
  constructor(private readonly db: Firestore) {}

  /** Escucha en tiempo real el doc del sitio (para reflejar el status del optimizer CF). */
  findByIdOnSnapshot(
    id: string,
    callback: (data: FirebaseSiteDto | null) => void,
  ): () => void {
    const docRef = doc(this.db, "sites", id)
    return onSnapshot(
      docRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          callback(null)
          return
        }
        callback({ id: snapshot.id, ...snapshot.data() } as FirebaseSiteDto)
      },
      (error) => {
        console.error("[SitesWebRepo] snapshot error:", error)
        callback(null)
      },
    )
  }
}
