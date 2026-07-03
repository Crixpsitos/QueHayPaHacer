import type { Firestore } from "firebase-admin/firestore";
import type { IProfessionalRequestRepository } from "@/domain/repository/professional/IProfessionalRequestRepository";
import type { ProfessionalRequest } from "@/domain/entities/professional/ProfessionalRequest";

export class ProfessionalRequestFirebaseRepository implements IProfessionalRequestRepository {
  private readonly collectionName = "professionalRequests";

  constructor(private readonly db: Firestore) {}

  private get collection() {
    return this.db.collection(this.collectionName);
  }

  private toDomain(id: string, data: Record<string, unknown>): ProfessionalRequest {
    return {
      id,
      uid: data.uid as string,
      status: data.status as ProfessionalRequest["status"],
      submittedAt: this.toDate(data.submittedAt),
      reviewedAt: data.reviewedAt ? this.toDate(data.reviewedAt) : null,
      rejectionReason: (data.rejectionReason as string | null) ?? null,
      professionalType: data.professionalType as ProfessionalRequest["professionalType"],
      brandName: data.brandName as string,
      description: data.description as string,
      phone: data.phone as string,
      website: (data.website as string | null) ?? null,
      previousRequestId: (data.previousRequestId as string | null) ?? null,
      reapplyReason: (data.reapplyReason as string | null) ?? null,
      details: data.details as ProfessionalRequest["details"],
    };
  }

  private toDate(value: unknown): Date {
    if (value instanceof Date) return value;
    if (typeof value === "object" && value !== null && "toDate" in value) {
      return (value as { toDate: () => Date }).toDate();
    }
    return new Date();
  }

  async create(request: Omit<ProfessionalRequest, "id">): Promise<ProfessionalRequest> {
    const docRef = await this.collection.add({
      uid: request.uid,
      status: request.status,
      submittedAt: request.submittedAt,
      reviewedAt: request.reviewedAt,
      rejectionReason: request.rejectionReason,
      professionalType: request.professionalType,
      brandName: request.brandName,
      description: request.description,
      phone: request.phone,
      website: request.website,
      previousRequestId: request.previousRequestId,
      reapplyReason: request.reapplyReason,
      details: request.details,
    });

    return { ...request, id: docRef.id };
  }

  async findById(id: string): Promise<ProfessionalRequest | null> {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists) return null;
    return this.toDomain(doc.id, doc.data() as Record<string, unknown>);
  }

  async findLatestByUid(uid: string): Promise<ProfessionalRequest | null> {
    const snapshot = await this.collection
      .where("uid", "==", uid)
      .orderBy("submittedAt", "desc")
      .limit(1)
      .get();

    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    return this.toDomain(doc.id, doc.data() as Record<string, unknown>);
  }
}
