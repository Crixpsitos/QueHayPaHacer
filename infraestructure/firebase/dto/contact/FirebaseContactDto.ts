import type { FieldValue, Timestamp } from "firebase-admin/firestore";

export interface FirebaseContactDto {
  id: string;
  email: string;
  phoneNumber: string;
  message: string;
  uid: string | null;
  createdAt: Timestamp | FieldValue;
}
