import type { Campaign } from "@/domain/entities/campaign/Campaign";
import type { ICampaignRepository } from "@/domain/repository/campaign/ICampaignRepository";

export class CampaignService {
  constructor(private readonly campaignRepository: ICampaignRepository) {}

  async getCampaignById(id: string): Promise<Campaign | null> {
    return this.campaignRepository.findById(id);
  }

  async getAllCampaigns(): Promise<Campaign[]> {
    return this.campaignRepository.findAll();
  }

  async getActiveCampaigns(): Promise<Campaign[]> {
    return this.campaignRepository.getActiveCampaigns();
  }
}
