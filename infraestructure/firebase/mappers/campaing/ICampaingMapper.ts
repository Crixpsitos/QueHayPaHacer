import type { FirebaseCampaignDto } from "../../dto/FirebaseCampaignDto";
import type { Campaign } from "@/domain/entities/campaign/Campaign";

export interface ICampaignMapper {
  toDomain(dto: FirebaseCampaignDto): Campaign;
  toDto(domain: Campaign): FirebaseCampaignDto;
}