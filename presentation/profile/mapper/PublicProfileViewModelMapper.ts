import type { User } from "@/domain/entities/user/User";
import type { PublicProfileViewModel } from "../view-models/PublicProfileViewModel";

export class PublicProfileViewModelMapper {
  static toViewModel(user: User): PublicProfileViewModel {
    return {
      uid: user.uid,
      username: user.displayName,
      firstName: user.firstName,
      lastName: user.lastName,
      bio: user.bio,
      photoURL: user.photoURL,
      participation: user.participation,
      plan: user.plan,
      creatorVerified: user.creatorVerified,
      memberSince: user.createdAt.toISOString(),
      isPublic: user.isPublic,
      website: user.website,
      socialLinks: user.socialLinks,
      isUsernameCustomized: user.isUsernameCustomized,
      bannerUrl: user.bannerUrl,
    };
  }
}
