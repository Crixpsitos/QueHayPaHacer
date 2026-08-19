import type { IContactRepository } from "@/domain/repository/contact/IContactRepository";
import type { Contact } from "@/domain/entities/contact/Contact";

export interface CreateContactInput {
  email: string;
  phoneNumber?: string;
  message: string;
  contactReason: string;
  uid?: string | null;
}

export class ContactService {
  constructor(private readonly repository: IContactRepository) {}

  async submit(input: CreateContactInput): Promise<Contact> {
    const { email, phoneNumber = "", message, contactReason, uid = null } = input;

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPhone = phoneNumber.trim();

    if (!normalizedEmail || !message.trim() || !contactReason.trim()) {
      throw new Error("El correo, el motivo de contacto y el mensaje son obligatorios.");
    }

    if (message.trim().length > 1000) {
      throw new Error("El mensaje no puede superar los 1000 caracteres.");
    }

    return this.repository.create({
      email: normalizedEmail,
      phoneNumber: normalizedPhone,
      message: message.trim(),
      contactReason: contactReason.trim(),
      uid,
    });
  }
}
