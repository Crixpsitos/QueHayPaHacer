import { UserPreferences } from "@/domain/entities/UserPreferences/UserPreferences";
import { FirebaseUserPreferencesDto } from "../../dto/UserPreferences/FirebaseUserPreferencesDto";

export interface IUserPreferencesMapper {
    toDomain(dto: FirebaseUserPreferencesDto): UserPreferences;
    toDto(domain: UserPreferences): FirebaseUserPreferencesDto;
}