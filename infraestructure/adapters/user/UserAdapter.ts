import type { User } from "@/domain/entities/user/User";
import type { IUserRepository } from "@/domain/repository/user/IUserRepository";
import type { IUserMapper } from "@/infraestructure/firebase/mappers/user/IUserMapper";
import type { IUserFirebaseRepository } from "@/infraestructure/firebase/repositories/user/IUserFirebaseRepository";

export class UserAdapter implements IUserRepository {
    constructor(private readonly repository: IUserFirebaseRepository, private readonly mapper: IUserMapper) {}

    async findById(id: string): Promise<User | null> {
        const dto = await this.repository.findById(id);
        if (!dto) return null;
        return this.mapper.toDomain(dto);
    }

    async findAll(): Promise<User[]> {
        const dtos = await this.repository.findAll();
        return dtos.map((dto) => this.mapper.toDomain(dto));
    }

    async findByEmail(email: string): Promise<User | null> {
        const dto = await this.repository.findByEmail(email);
        if (!dto) return null;
        return this.mapper.toDomain(dto);
    }

    async findByUsername(username: string): Promise<User | null> {
        const dto = await this.repository.findByUsername(username);
        if (!dto) return null;
        return this.mapper.toDomain(dto);
    }

    async create(user: User): Promise<User> {
        const dto = this.mapper.toDto(user);
        const created = await this.repository.create(dto);
        return this.mapper.toDomain(created);
    }

    async update(id: string, user: User): Promise<User> {
        const dto = this.mapper.toDto(user);
        const updated = await this.repository.update(id, dto);
        return this.mapper.toDomain(updated);
    }

    async delete(id: string): Promise<void> {
        await this.repository.delete(id);
    }
}
