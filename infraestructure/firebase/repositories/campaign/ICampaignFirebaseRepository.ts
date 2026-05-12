import type { FirebaseCampaignDto } from "@/infraestructure/firebase/dto/FirebaseCampaignDto";

export interface ICampaignFirebaseRepository {
  getActiveCampaigns(): Promise<FirebaseCampaignDto[]>;
  getCampaignById(id: string): Promise<FirebaseCampaignDto | null>;
  getAllCampaigns(): Promise<FirebaseCampaignDto[]>;
}
