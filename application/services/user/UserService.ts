import * as v from "valibot";
import type { User } from "@/domain/entities/user/User";
import type { IUserRepository } from "@/domain/repository/user/IUserRepository";
import { CreateUserSchema, UpdateUserSchema, type CreateUserDto, type UpdateUserDto } from "@/application/dto/user/UserDto";
import { generateUniqueUsernameCandidate, generateUsername } from "@/app/lib/utils/generateUsername";

import { LEGAL_VERSION } from "@/app/lib/legal/version";

const USERNAME_ATTEMPTS = 5;

export class UserService {
    constructor(private readonly userRepository: IUserRepository) {}

    async getUserById(id: string): Promise<User | null> {
        return this.userRepository.findById(id);
    }

    async getVerifiedCreators(limit = 10): Promise<User[]> {
        return this.userRepository.findVerifiedCreators(limit);
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

        const now = new Date();
        const baseUsername = generateUsername(`${input.firstName} ${input.lastName}`);

        for (let attempt = 0; attempt < USERNAME_ATTEMPTS; attempt++) {
            const displayName = attempt === 0
                ? baseUsername
                : generateUniqueUsernameCandidate(baseUsername);
            const user: User = {
                ...input,
                displayName,
                participation: input.participation ?? "consumer",
                creatorVerified: input.creatorVerified ?? false,
                plan: input.plan ?? "basic",
                acceptedTermsVersion: input.acceptedTermsVersion ?? LEGAL_VERSION,
                acceptedTermsAt: now,
                createdAt: now,
                updatedAt: now,
            };

            try {
                return await this.userRepository.create(user);
            } catch (error) {
                if (!(error instanceof Error) || error.message !== "Username already in use") {
                    throw error;
                }
            }
        }

        throw new Error("Could not generate a unique username");
    }

    async updateUser(id: string, data: UpdateUserDto): Promise<User> {
        const input = v.parse(UpdateUserSchema, data);

        const existing = await this.userRepository.findById(id);
        if (!existing) throw new Error("User not found");

        const updated: User = {
            ...existing,
            ...(input as Partial<User>),
            ...(input.displayName !== undefined && { displayName: generateUsername(input.displayName) }),
            updatedAt: new Date(),
        };

        return this.userRepository.update(id, updated);
    }

    async markAsCreator(id: string): Promise<User> {
        const existing = await this.userRepository.findById(id);
        if (!existing) throw new Error("User not found");
        if (existing.participation === "creator") return existing;

        return this.userRepository.update(id, {
            ...existing,
            participation: "creator",
            updatedAt: new Date(),
        });
    }

    async deleteUser(id: string): Promise<void> {
        const existing = await this.userRepository.findById(id);
        if (!existing) throw new Error("User not found");

        await this.userRepository.delete(id);
    }
}

