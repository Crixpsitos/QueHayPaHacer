import type { Badge } from "@/domain/entities/user/Badge";
import type { FirebaseBadgeDto } from "@/infraestructure/firebase/dto/user/FirebaseBadgeDto";

/** Documento crudo de Firestore → entidad de dominio `Badge`. */
export class BadgeFirebaseMapper {
  toDomain(dto: FirebaseBadgeDto): Badge {
    return {
      id: dto.id,
      name: dto.name,
      description: dto.description,
      icon: dto.icon,
      color: dto.color,
      category: dto.category,
      criteria: dto.criteria,
      createdAt: dto.createdAt?.toDate?.() ?? new Date(),
      active: dto.active,
    };
  }
}
