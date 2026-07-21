import type { Timestamp } from "firebase-admin/firestore";
import type { ProfessionalRequest } from "@/domain/entities/professional/ProfessionalRequest";

/** Documento crudo de `professionalRequests/{id}` en Firestore. */
export interface FirebaseProfessionalRequestDto {
  id: string;
  uid: string;
  status: ProfessionalRequest["status"];
  submittedAt: Timestamp;
  reviewedAt: Timestamp | null;
  rejectionReason: string | null;
  professionalType: ProfessionalRequest["professionalType"];
  brandName: string;
  description: string;
  phone: string;
  website: string | null;
  previousRequestId: string | null;
  reapplyReason: string | null;
  details: ProfessionalRequest["details"];
}
