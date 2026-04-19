import * as v from "valibot";
import type { User } from "@/domain/entities/user/User";
import type { IUserRepository } from "@/domain/repository/user/IUserRepository";
import { CreateUserSchema, UpdateUserSchema, type CreateUserDto, type UpdateUserDto } from "@/application/dto/user/UserDto";

export class UserService {
    constructor(private readonly userRepository: IUserRepository) {}

    async getUserById(id: string): Promise<User | null> {
        return this.userRepository.findById(id);
    }

    async getAllUsers(): Promise<User[]> {
        return this.userRepository.findAll();
    }

    async getUserByEmail(email: string): Promise<User | null> {
        return this.userRepository.findByEmail(email);
    }

    async getUserByUsername(username: string): Promise<User | null> {
        return this.userRepository.findByUsername(username);
    }

    async createUser(data: CreateUserDto): Promise<User> {
        const input = v.parse(CreateUserSchema, data);

        const existingByEmail = await this.userRepository.findByEmail(input.email);
        if (existingByEmail) throw new Error("Email already in use");

        const existingByUsername = await this.userRepository.findByUsername(input.displayName);
        if (existingByUsername) throw new Error("Username already in use");

        const now = new Date();
        const user: User = {
            ...input,
            acceptedTermsAt: now,
            createdAt: now,
            updatedAt: now,
        };

        return this.userRepository.create(user);
    }

    async updateUser(id: string, data: UpdateUserDto): Promise<User> {
        const input = v.parse(UpdateUserSchema, data);

        const existing = await this.userRepository.findById(id);
        if (!existing) throw new Error("User not found");

        const updated: User = {
            ...existing,
            ...input,
            updatedAt: new Date(),
        };

        return this.userRepository.update(id, updated);
    }

    async deleteUser(id: string): Promise<void> {
        const existing = await this.userRepository.findById(id);
        if (!existing) throw new Error("User not found");

        await this.userRepository.delete(id);
    }
}

