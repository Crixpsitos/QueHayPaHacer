import type { FirebaseUserDto } from "@/infraestructure/firebase/dto/FirebaseUserDto";

export interface IUserDAO {
    findById(id: string): Promise<FirebaseUserDto | null>;
    findAll(): Promise<FirebaseUserDto[]>;
    findByEmail(email: string): Promise<FirebaseUserDto | null>;
    findByUsername(username: string): Promise<FirebaseUserDto | null>;
    create(dto: FirebaseUserDto): Promise<FirebaseUserDto>;
    update(id: string, dto: Partial<FirebaseUserDto>): Promise<FirebaseUserDto>;
    delete(id: string): Promise<void>;
}
