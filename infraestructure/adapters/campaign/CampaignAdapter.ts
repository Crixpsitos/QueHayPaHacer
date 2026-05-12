import type { Campaign } from "@/domain/entities/campaign/Campaign";
import type { ICampaignRepository } from "@/domain/repository/campaign/ICampaignRepository";
import { CampaignFirebaseMapper } from "@/infraestructure/firebase/mappers/CampaignFirebaseMapper";
import type { ICampaignFirebaseRepository } from "@/infraestructure/firebase/repositories/campaign/ICampaignFirebaseRepository";

export class CampaignAdapter implements ICampaignRepository {
  constructor(private readonly repository: ICampaignFirebaseRepository) {}

  async findById(id: string): Promise<Campaign | null> {
    const dto = await this.repository.getCampaignById(id);
    if (!dto) return null;
    return CampaignFirebaseMapper.toDomain(dto);
  }

  async findAll(): Promise<Campaign[]> {
    const dtos = await this.repository.getAllCampaigns();
    return dtos.map((dto) => CampaignFirebaseMapper.toDomain(dto));
  }

  async getActiveCampaigns(): Promise<Campaign[]> {
    const dtos = await this.repository.getActiveCampaigns();
    return dtos.map((dto) => CampaignFirebaseMapper.toDomain(dto));
  }

  async create(campaign: Campaign): Promise<Campaign> {
    throw new Error("Not implemented");
  }

  async update(id: string, campaign: Campaign): Promise<Campaign> {
    throw new Error("Not implemented");
  }

  async delete(id: string): Promise<void> {
    throw new Error("Not implemented");
  }
}
