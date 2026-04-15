import type { User } from "@/domain/entities/user/User";
import type { IUserRepository } from "@/domain/repository/IUserRepository";
import { UserFirebaseMapper } from "@/infraestructure/firebase/mappers/UserFirebaseMapper";
import type { IUserDAO } from "@/infraestructure/repository/IUserDAO";

export class UserAdapter implements IUserRepository {
    constructor(private readonly repository: IUserDAO) {}

    async findById(id: string): Promise<User | null> {
        const dto = await this.repository.findById(id);
        if (!dto) return null;
        return UserFirebaseMapper.toDomain(dto);
    }

    async findAll(): Promise<User[]> {
        const dtos = await this.repository.findAll();
        return dtos.map(UserFirebaseMapper.toDomain);
    }

    async findByEmail(email: string): Promise<User | null> {
        const dto = await this.repository.findByEmail(email);
        if (!dto) return null;
        return UserFirebaseMapper.toDomain(dto);
    }

    async findByUsername(username: string): Promise<User | null> {
        const dto = await this.repository.findByUsername(username);
        if (!dto) return null;
        return UserFirebaseMapper.toDomain(dto);
    }

    async create(user: User): Promise<User> {
        const dto = UserFirebaseMapper.toDto(user);
        const created = await this.repository.create(dto);
        return UserFirebaseMapper.toDomain(created);
    }

    async update(id: string, user: User): Promise<User> {
        const dto = UserFirebaseMapper.toDto(user);
        const updated = await this.repository.update(id, dto);
        return UserFirebaseMapper.toDomain(updated);
    }

    async delete(id: string): Promise<void> {
        await this.repository.delete(id);
    }
}
