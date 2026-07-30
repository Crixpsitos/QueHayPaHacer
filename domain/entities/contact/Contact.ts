export interface Contact {
  id: string;
  email: string;
  phoneNumber: string;
  message: string;
  uid: string | null;
  createdAt: Date;
}
