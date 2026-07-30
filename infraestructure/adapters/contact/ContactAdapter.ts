import type { Contact } from "@/domain/entities/contact/Contact";
import type { IContactRepository } from "@/domain/repository/contact/IContactRepository";
import type { IContactFirebaseRepository } from "@/infraestructure/firebase/repositories/contact/IContactFirebaseRepository";
import type { ContactFirebaseMapper } from "@/infraestructure/firebase/mappers/contact/ContactFirebaseMapper";

export class ContactAdapter implements IContactRepository {
  constructor(
    private readonly repo: IContactFirebaseRepository,
    private readonly mapper: ContactFirebaseMapper,
  ) {}

  async create(contact: Omit<Contact, "id" | "createdAt">): Promise<Contact> {
    const dto = await this.repo.create(contact);
    return this.mapper.toDomain(dto);
  }
}
