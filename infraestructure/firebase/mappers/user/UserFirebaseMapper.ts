import { Timestamp } from "firebase-admin/firestore";
import type { User } from "@/domain/entities/user/User";
import type { FirebaseUserDto } from "@/infraestructure/firebase/dto/FirebaseUserDto";
import { IUserMapper } from "./IUserMapper";

export class UserFirebaseMapper implements IUserMapper {
  toDomain(dto: FirebaseUserDto): User {
    return {
      uid: dto.uid,
      email: dto.email,
      emailVerified: dto.emailVerified ?? false,
      displayName: dto.displayName.trim(),
      firstName: dto.firstName.trim(),
      lastName: dto.lastName.trim(),
      ...(dto.bio !== undefined && { bio: dto.bio }),
      phoneNumber: dto.phoneNumber,
      ...(dto.photoURL !== undefined && { photoURL: dto.photoURL }),
      ...(dto.imagePath !== undefined && { imagePath: dto.imagePath }),
      acceptedTerms: dto.acceptedTerms,
      participation: dto.participation ?? "consumer",
      creatorVerified: dto.creatorVerified ?? false,
      plan: dto.plan ?? "basic",
      ...(dto.website !== undefined && { website: dto.website }),
      ...(dto.socialLinks !== undefined && { socialLinks: dto.socialLinks }),
      ...(dto.isUsernameCustomized !== undefined && { isUsernameCustomized: dto.isUsernameCustomized }),
      isPublic: dto.participation === "creator" && (dto.isPublic ?? true),
      ...(dto.bannerUrl !== undefined && { bannerUrl: dto.bannerUrl }),
      ...(dto.bannerPath !== undefined && { bannerPath: dto.bannerPath }),
      acceptedTermsAt: dto.acceptedTermsAt.toDate(),
      createdAt: dto.createdAt.toDate(),
      updatedAt: dto.updatedAt.toDate(),
    };
  }

  toDto(domain: User): FirebaseUserDto {
    return {
      uid: domain.uid,
      email: domain.email,
      emailVerified: domain.emailVerified,
      displayName: domain.displayName,
      firstName: domain.firstName,
      lastName: domain.lastName,
      ...(domain.bio !== undefined && { bio: domain.bio }),
      phoneNumber: domain.phoneNumber,
      ...(domain.photoURL !== undefined && { photoURL: domain.photoURL }),
      ...(domain.imagePath !== undefined && { imagePath: domain.imagePath }),
      acceptedTerms: domain.acceptedTerms,
      participation: domain.participation,
      creatorVerified: domain.creatorVerified,
      plan: domain.plan,
      ...(domain.website !== undefined && { website: domain.website }),
      ...(domain.socialLinks !== undefined && { socialLinks: domain.socialLinks }),
      ...(domain.isUsernameCustomized !== undefined && { isUsernameCustomized: domain.isUsernameCustomized }),
      isPublic: domain.isPublic,
      ...(domain.bannerUrl !== undefined && { bannerUrl: domain.bannerUrl }),
      ...(domain.bannerPath !== undefined && { bannerPath: domain.bannerPath }),
      acceptedTermsAt: Timestamp.fromDate(domain.acceptedTermsAt),
      createdAt: Timestamp.fromDate(domain.createdAt),
      updatedAt: Timestamp.fromDate(domain.updatedAt),
    };
  }
}
