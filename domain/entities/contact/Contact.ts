export interface Contact {
  id: string;
  email: string;
  phoneNumber: string;
  message: string;
  uid: string | null;
  /** Añadido en 2026-08. Null en mensajes anteriores. */
  contactReason?: string | null;
  createdAt: Date;
}
