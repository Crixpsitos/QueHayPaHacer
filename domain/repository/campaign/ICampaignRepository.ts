import { IBaseRepository } from "../IBaseRepository";
import type { Campaign } from "../../entities/campaign/Campaign";

export interface ICampaignRepository extends IBaseRepository<Campaign> {
  getActiveCampaigns(): Promise<Campaign[]>;
  recordStats(id: string, views: number, clicks: number, day: string): Promise<void>;
}
