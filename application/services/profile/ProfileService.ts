import type {
  IProfileRepository,
  ProfileStats,
  UserEvent,
  UserSite,
  UserEventInteraction,
  UserBadge,
} from "@/domain/repository/profile/IProfileRepository";

export class ProfileService {
  constructor(private readonly profileRepository: IProfileRepository) {}

  async getStats(uid: string): Promise<ProfileStats> {
    return this.profileRepository.getStats(uid);
  }

  async getUserEvents(uid: string, limit?: number): Promise<UserEvent[]> {
    return this.profileRepository.getUserEvents(uid, limit);
  }

  async getUserSites(uid: string, limit?: number): Promise<UserSite[]> {
    return this.profileRepository.getUserSites(uid, limit);
  }

  async getUserEventInteractions(uid: string, limit?: number): Promise<UserEventInteraction[]> {
    return this.profileRepository.getUserEventInteractions(uid, limit);
  }

  async getUserBadges(uid: string, limit?: number): Promise<UserBadge[]> {
    return this.profileRepository.getUserBadges(uid, limit);
  }
}
