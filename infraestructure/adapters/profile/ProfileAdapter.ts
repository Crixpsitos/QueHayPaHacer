import type {
  IProfileRepository,
  ProfileStats,
  UserBadge,
  UserEvent,
  UserEventInteraction,
  UserSite,
} from "@/domain/repository/profile/IProfileRepository";
import type { IProfileFirebaseRepository } from "@/infraestructure/firebase/repositories/profile/IProfileFirebaseRepository";
import type { ProfileFirebaseMapper } from "@/infraestructure/firebase/mappers/profile/ProfileFirebaseMapper";

/** Puerto de dominio: envuelve el repo Firebase y proyecta docs crudos → read-models. */
export class ProfileAdapter implements IProfileRepository {
  constructor(
    private readonly repository: IProfileFirebaseRepository,
    private readonly mapper: ProfileFirebaseMapper,
  ) {}

  getStats(uid: string): Promise<ProfileStats> {
    return this.repository.getStats(uid);
  }

  async getUserEvents(uid: string): Promise<UserEvent[]> {
    const docs = await this.repository.getUserEvents(uid);
    return docs
      .map((doc) => this.mapper.toUserEvent(doc))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getUserSites(uid: string): Promise<UserSite[]> {
    const docs = await this.repository.getUserSites(uid);
    return docs
      .map((doc) => this.mapper.toUserSite(doc))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getUserEventInteractions(uid: string): Promise<UserEventInteraction[]> {
    const raw = await this.repository.getUserEventInteractions(uid);
    return this.mapper.toUserEventInteractions(raw);
  }

  async getUserBadges(uid: string): Promise<UserBadge[]> {
    const docs = await this.repository.getUserBadges(uid);
    return docs.map((doc) => this.mapper.toUserBadge(doc));
  }
}
