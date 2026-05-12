import { IBaseRepository } from "../IBaseRepository";
import type { Campaign } from "../../entities/campaign/Campaign";

export interface ICampaignRepository extends IBaseRepository<Campaign> {
  getActiveCampaigns(): Promise<Campaign[]>;
}
