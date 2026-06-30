import type {
  IProfileRepository,
  ProfileStats,
  UserEvent,
  UserSite,
  UserEventInteraction,
  UserBadge,
} from "@/domain/repository/profile/IProfileRepository";
import type { ProfileFirebaseRepository } from "@/infraestructure/firebase/repositories/profile/ProfileFirebaseRepository";

export class ProfileAdapter implements IProfileRepository {
  constructor(
    private readonly repository: ProfileFirebaseRepository,
  ) {}

  async getStats(uid: string): Promise<ProfileStats> {
    return this.repository.getStats(uid);
  }

  async getUserEvents(uid: string): Promise<UserEvent[]> {
    return this.repository.getUserEvents(uid);
  }

  async getUserSites(uid: string): Promise<UserSite[]> {
    return this.repository.getUserSites(uid);
  }

  async getUserEventInteractions(uid: string): Promise<UserEventInteraction[]> {
    return this.repository.getUserEventInteractions(uid);
  }

  async getUserBadges(uid: string): Promise<UserBadge[]> {
    return this.repository.getUserBadges(uid);
  }
}
