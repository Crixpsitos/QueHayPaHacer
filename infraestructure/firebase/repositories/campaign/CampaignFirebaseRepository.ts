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

    const snapshot = await this.collection
      .where("status", "==", CampaignStatus.ACTIVE)
      .where("schedule.startAt", "<=", now)
      .where("schedule.endAt", ">=", now)
      .orderBy("priority", "desc")
      .get();
    console.log("Fetched active campaigns from Firebase:", snapshot.size);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as FirebaseCampaignDto));
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
