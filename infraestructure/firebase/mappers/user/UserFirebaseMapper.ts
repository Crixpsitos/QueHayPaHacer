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
      accountType: dto.accountType ?? "personal",
      professionalType: dto.professionalType ?? null,
      professionalStatus: dto.professionalStatus ?? "none",
      ...(dto.professionalDetails !== undefined && { professionalDetails: dto.professionalDetails }),
      ...(dto.brandName !== undefined && { brandName: dto.brandName }),
      ...(dto.website !== undefined && { website: dto.website }),
      ...(dto.mapsLink !== undefined && { mapsLink: dto.mapsLink }),
      ...(dto.socialLink !== undefined && { socialLink: dto.socialLink }),
      isPublic: dto.isPublic ?? true,
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
      accountType: domain.accountType,
      professionalType: domain.professionalType,
      professionalStatus: domain.professionalStatus,
      ...(domain.professionalDetails !== undefined && { professionalDetails: domain.professionalDetails }),
      ...(domain.brandName !== undefined && { brandName: domain.brandName }),
      ...(domain.website !== undefined && { website: domain.website }),
      ...(domain.mapsLink !== undefined && { mapsLink: domain.mapsLink }),
      ...(domain.socialLink !== undefined && { socialLink: domain.socialLink }),
      isPublic: domain.isPublic,
      acceptedTermsAt: Timestamp.fromDate(domain.acceptedTermsAt),
      createdAt: Timestamp.fromDate(domain.createdAt),
      updatedAt: Timestamp.fromDate(domain.updatedAt),
    };
  }
}
