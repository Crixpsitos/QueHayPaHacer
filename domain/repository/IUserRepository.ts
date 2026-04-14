import { IBaseRepository } from "./IBaseRepository";
import type { User } from "../entities/user/User";

export interface IUserRepository extends IBaseRepository<User> {
    findByEmail(email: string): Promise<User | null>;
    findByUsername(username: string): Promise<User | null>;
}
