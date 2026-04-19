import * as v from "valibot";
import { UserAccountType } from "@/domain/entities/user/UserAccountType";

export const CreateUserSchema = v.object({
    uid: v.pipe(v.string(), v.nonEmpty("uid is required")),
    email: v.pipe(v.string(), v.email("Invalid email format")),
    displayName: v.pipe(v.string(), v.nonEmpty("displayName is required")),
    firstName: v.pipe(v.string(), v.nonEmpty("firstName is required")),
    lastName: v.pipe(v.string(), v.nonEmpty("lastName is required")),
    phoneNumber: v.pipe(v.string(), v.nonEmpty("phoneNumber is required")),
    acceptedTerms: v.literal(true, "User must accept terms"),
    accountType: v.enum(UserAccountType, "Invalid account type"),
});

export const UpdateUserSchema = v.partial(
    v.object({
        displayName: v.pipe(v.string(), v.nonEmpty("displayName cannot be empty")),
        firstName: v.pipe(v.string(), v.nonEmpty("firstName cannot be empty")),
        lastName: v.pipe(v.string(), v.nonEmpty("lastName cannot be empty")),
        phoneNumber: v.pipe(v.string(), v.nonEmpty("phoneNumber cannot be empty")),
        accountType: v.enum(UserAccountType, "Invalid account type"),
    })
);

export type CreateUserDto = v.InferOutput<typeof CreateUserSchema>;
export type UpdateUserDto = v.InferOutput<typeof UpdateUserSchema>;
