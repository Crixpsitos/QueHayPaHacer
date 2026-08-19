import type { Contact } from "@/domain/entities/contact/Contact";

export interface IContactRepository {
  create(contact: Omit<Contact, "id" | "createdAt">): Promise<Contact>;
}
