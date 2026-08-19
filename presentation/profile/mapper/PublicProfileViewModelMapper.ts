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
      professionalType: user.professionalType,
      isProfessional: user.accountType === "professional",
      emailVerified: user.emailVerified,
      memberSince: user.createdAt.toISOString(),
      isPublic: user.isPublic,
      brandName: user.brandName,
      website: user.website,
      mapsLink: user.mapsLink,
      socialLink: user.socialLink,
      socialLinks: user.socialLinks,
      isUsernameCustomized: user.isUsernameCustomized,
      professionalDetails: user.professionalDetails,
      bannerUrl: user.bannerUrl,
    };
  }
}
