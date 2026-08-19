import type { IBadgeFirebaseRepository } from "./IBadgeFirebaseRepository";
import type { FirebaseBadgeDto } from "@/infraestructure/firebase/dto/user/FirebaseBadgeDto";
import { Firestore } from "firebase-admin/firestore";

export class BadgeFirebaseRepository implements IBadgeFirebaseRepository {
  constructor(private db: Firestore) {}

  async getBadge(badgeId: string): Promise<FirebaseBadgeDto | null> {
    try {
      const doc = await this.db.collection("badges").doc(badgeId).get();

      if (!doc.exists) {
        return null;
      }

      const data = doc.data();
      if (!data) {
        return null;
      }
      return {
        id: doc.id,
        name: data.name,
        description: data.description,
        icon: data.icon,
        color: data.color,
        category: data.category,
        criteria: data.criteria,
        createdAt: data.createdAt,
        active: data.active,
      };
    } catch (error) {
      console.error(`Error al obtener insignia ${badgeId}:`, error);
      return null;
    }
  }

  async awardBadgeToUser(
    userId: string,
    badgeId: string,
    reason?: string
  ): Promise<void> {
    try {
      const badge = await this.getBadge(badgeId);
      if (!badge) {
        throw new Error(`Insignia ${badgeId} no encontrada`);
      }

      const userBadgeRef = this.db
        .collection("users")
        .doc(userId)
        .collection("badges")
        .doc(badgeId);

      await userBadgeRef.set({
        badgeId,
        name: badge.name,
        description: badge.description,
        icon: badge.icon,
        color: badge.color,
        category: badge.category,
        earnedAt: new Date(),
        reason: reason ?? badge.criteria.requirement,
      });
    } catch (error) {
      console.error(
        `Error al asignar insignia ${badgeId} al usuario ${userId}:`,
        error
      );
      throw error;
    }
  }

  async userHasBadge(userId: string, badgeId: string): Promise<boolean> {
    try {
      const doc = await this.db
        .collection("users")
        .doc(userId)
        .collection("badges")
        .doc(badgeId)
        .get();

      return doc.exists;
    } catch (error) {
      console.error(
        `Error al verificar insignia ${badgeId} del usuario ${userId}:`,
        error
      );
      return false;
    }
  }
}
