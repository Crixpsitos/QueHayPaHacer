import { Timestamp } from "firebase-admin/firestore";
import type { User } from "@/domain/entities/user/User";
import type { FirebaseUserDto } from "@/infraestructure/firebase/dto/FirebaseUserDto";

export class UserFirebaseMapper {
    static toDomain(dto: FirebaseUserDto): User {
        return {
            uid: dto.uid,
            email: dto.email,
            displayName: dto.displayName.trim(),
            firstName: dto.firstName.trim(),
            lastName: dto.lastName.trim(),
            phoneNumber: dto.phoneNumber,
            acceptedTerms: dto.acceptedTerms,
            accountType: dto.accountType,
            acceptedTermsAt: dto.acceptedTermsAt.toDate(),
            createdAt: dto.createdAt.toDate(),
            updatedAt: dto.updatedAt.toDate(),
        };
    }

    static toDto(domain: User): FirebaseUserDto {
        return {
            uid: domain.uid,
            email: domain.email,
            displayName: domain.displayName,
            firstName: domain.firstName,
            lastName: domain.lastName,
            phoneNumber: domain.phoneNumber,
            acceptedTerms: domain.acceptedTerms,
            accountType: domain.accountType,
            acceptedTermsAt: Timestamp.fromDate(domain.acceptedTermsAt),
            createdAt: Timestamp.fromDate(domain.createdAt),
            updatedAt: Timestamp.fromDate(domain.updatedAt),
        };
    }
}
