import * as v from "valibot";

export const CreateUserSchema = v.object({
    uid: v.pipe(v.string(), v.nonEmpty("uid is required")),
    email: v.pipe(v.string(), v.email("Invalid email format")),
    emailVerified: v.optional(v.boolean(), false),
    displayName: v.pipe(v.string(), v.nonEmpty("displayName is required")),
    firstName: v.pipe(v.string(), v.nonEmpty("firstName is required")),
    lastName: v.string(),
    bio: v.optional(v.string()),
    phoneNumber: v.string(),
    photoURL: v.optional(v.string()),
    imagePath: v.optional(v.string()),
    acceptedTerms: v.literal(true, "User must accept terms"),
    accountType: v.optional(v.picklist(["personal", "professional"] as const)),
    isPublic: v.optional(v.boolean(), true),
});

export const UpdateUserSchema = v.partial(
    v.object({
        displayName: v.pipe(v.string(), v.nonEmpty("displayName cannot be empty")),
        firstName: v.pipe(v.string(), v.nonEmpty("firstName cannot be empty")),
        lastName: v.pipe(v.string(), v.nonEmpty("lastName cannot be empty")),
        bio: v.string(),
        phoneNumber: v.string(),
        photoURL: v.string(),
        imagePath: v.string(),
        emailVerified: v.boolean(),
        isPublic: v.boolean(),
        brandName: v.string(),
        website: v.string(),
        mapsLink: v.string(),
        socialLink: v.string(),
    })
);

export type CreateUserDto = v.InferOutput<typeof CreateUserSchema>;
export type UpdateUserDto = v.InferOutput<typeof UpdateUserSchema>;
