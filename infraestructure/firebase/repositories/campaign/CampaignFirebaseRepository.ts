import type { Firestore } from "firebase-admin/firestore";
import type { FirebaseCampaignDto } from "@/infraestructure/firebase/dto/FirebaseCampaignDto";
import { CampaignStatus } from "@/domain/entities/campaign/CampaignStatus";
import { FirebaseBaseRepository } from "@/infraestructure/firebase/repositories/FirebaseBaseRepository";
import type { ICampaignFirebaseRepository } from "@/infraestructure/firebase/repositories/campaign/ICampaignFirebaseRepository";

export class CampaignFirebaseRepository extends FirebaseBaseRepository implements ICampaignFirebaseRepository {
  protected readonly collectionName = "campaigns";

  constructor(db: Firestore) {
    super(db);
  }

  async getActiveCampaigns(): Promise<FirebaseCampaignDto[]> {
    const now = new Date();

    // Obtener solo campañas activas (sin filtro de fechas en Firestore para evitar índices compuestos)
    const snapshot = await this.collection
      .where("status", "==", CampaignStatus.ACTIVE)
      .get();
    
    // Filtrar por rango de fechas en cliente
    const activeCampaigns = snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() } as FirebaseCampaignDto))
      .filter((campaign) => {
        const startAt = campaign.schedule?.startAt ? campaign.schedule.startAt.toDate() : null;
        const endAt = campaign.schedule?.endAt ? campaign.schedule.endAt.toDate() : null;
        
        // Incluir si está dentro del rango de fechas
        if (startAt && endAt) {
          return startAt <= now && now <= endAt;
        }
        return false;
      })
      // Ordenar por prioridad en cliente
      .sort((a, b) => (b.priority || 0) - (a.priority || 0));
    
    return activeCampaigns;
  }

  async getCampaignById(id: string): Promise<FirebaseCampaignDto | null> {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() } as FirebaseCampaignDto;
  }

  async getAllCampaigns(): Promise<FirebaseCampaignDto[]> {
    const snapshot = await this.collection.orderBy("priority", "desc").get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as FirebaseCampaignDto));
  }
}
