import { Timestamp } from "firebase-admin/firestore";

export interface FirebaseCategoriesDto {
    id: string;
    title: string;
    description: string;
    icon: string;
    isActive: boolean;
    navigation: {
        resource: string;
        filters: Record<string, string | number | boolean>;
        sort?: {
            field: string;
            order: "asc" | "desc";
        };
    };
    createdAt: Timestamp;
    updatedAt: Timestamp;
}