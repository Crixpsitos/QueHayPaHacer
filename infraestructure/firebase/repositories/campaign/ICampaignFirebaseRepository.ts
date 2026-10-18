import type { FirebaseCampaignDto } from "@/infraestructure/firebase/dto/FirebaseCampaignDto";

export interface ICampaignFirebaseRepository {
  getActiveCampaigns(): Promise<FirebaseCampaignDto[]>;
  getCampaignById(id: string): Promise<FirebaseCampaignDto | null>;
  getAllCampaigns(): Promise<FirebaseCampaignDto[]>;
  /** Suma vistas/clics al total y al día `day` (YYYY-MM-DD). Campaña inexistente: no hace nada. */
  recordStats(id: string, views: number, clicks: number, day: string): Promise<void>;
}
