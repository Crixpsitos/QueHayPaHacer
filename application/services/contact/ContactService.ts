import type { IContactRepository } from "@/domain/repository/contact/IContactRepository";
import type { Contact } from "@/domain/entities/contact/Contact";

export interface CreateContactInput {
  email: string;
  phoneNumber: string;
  message: string;
  uid?: string | null;
}

export class ContactService {
  constructor(private readonly repository: IContactRepository) {}

  async submit(input: CreateContactInput): Promise<Contact> {
    const { email, phoneNumber, message, uid = null } = input;

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPhone = phoneNumber.trim();

    if (!normalizedEmail || !normalizedPhone || !message.trim()) {
      throw new Error("Todos los campos son obligatorios.");
    }

    return this.repository.create({
      email: normalizedEmail,
      phoneNumber: normalizedPhone,
      message: message.trim(),
      uid,
    });
  }
}
