import type { FirebaseUserDto } from "../../dto/FirebaseUserDto";
import type { User } from "@/domain/entities/user/User";

export interface IUserMapper {
  toDomain(dto: FirebaseUserDto): User;
  toDto(domain: User): FirebaseUserDto;
}
