import type { FieldValue, Timestamp } from "firebase-admin/firestore";

export interface FirebaseContactDto {
  id: string;
  email: string;
  phoneNumber: string;
  message: string;
  uid: string | null;
  /** Añadido en 2026-08. Ausente en documentos históricos. */
  contactReason?: string | null;
  createdAt: Timestamp | FieldValue;
}
