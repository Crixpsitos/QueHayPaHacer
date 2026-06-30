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

  async getUserEvents(uid: string): Promise<UserEvent[]> {
    return this.profileRepository.getUserEvents(uid);
  }

  async getUserSites(uid: string): Promise<UserSite[]> {
    return this.profileRepository.getUserSites(uid);
  }

  async getUserEventInteractions(uid: string): Promise<UserEventInteraction[]> {
    return this.profileRepository.getUserEventInteractions(uid);
  }

  async getUserBadges(uid: string): Promise<UserBadge[]> {
    return this.profileRepository.getUserBadges(uid);
  }
}
