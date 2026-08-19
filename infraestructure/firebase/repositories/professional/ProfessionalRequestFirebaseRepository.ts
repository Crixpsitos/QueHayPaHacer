import { Timestamp, type Firestore } from "firebase-admin/firestore";
import type { IProfessionalRequestFirebaseRepository } from "./IProfessionalRequestFirebaseRepository";
import type { ProfessionalRequest } from "@/domain/entities/professional/ProfessionalRequest";
import type { FirebaseProfessionalRequestDto } from "@/infraestructure/firebase/dto/professional/FirebaseProfessionalRequestDto";

export class ProfessionalRequestFirebaseRepository
  implements IProfessionalRequestFirebaseRepository
{
  private readonly collectionName = "professionalRequests";

  constructor(private readonly db: Firestore) {}

  private get collection() {
    return this.db.collection(this.collectionName);
  }

  async create(request: Omit<ProfessionalRequest, "id">): Promise<FirebaseProfessionalRequestDto> {
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

    return {
      id: docRef.id,
      uid: request.uid,
      status: request.status,
      submittedAt: Timestamp.fromDate(request.submittedAt),
      reviewedAt: request.reviewedAt ? Timestamp.fromDate(request.reviewedAt) : null,
      rejectionReason: request.rejectionReason,
      professionalType: request.professionalType,
      brandName: request.brandName,
      description: request.description,
      phone: request.phone,
      website: request.website,
      previousRequestId: request.previousRequestId,
      reapplyReason: request.reapplyReason,
      details: request.details,
    };
  }

  async findById(id: string): Promise<FirebaseProfessionalRequestDto | null> {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...(doc.data() as Omit<FirebaseProfessionalRequestDto, "id">) };
  }

  async findLatestByUid(uid: string): Promise<FirebaseProfessionalRequestDto | null> {
    const snapshot = await this.collection
      .where("uid", "==", uid)
      .orderBy("submittedAt", "desc")
      .limit(1)
      .get();

    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    return { id: doc.id, ...(doc.data() as Omit<FirebaseProfessionalRequestDto, "id">) };
  }
}
