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
    participation: v.optional(v.picklist(["consumer", "creator"] as const)),
    creatorVerified: v.optional(v.boolean(), false),
    plan: v.optional(v.picklist(["basic", "premium"] as const)),
    isPublic: v.optional(v.boolean(), false),
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
        creatorVerified: v.boolean(),
        isPublic: v.boolean(),
        website: v.string(),
        socialLinks: v.array(v.object({ platform: v.string(), url: v.string() })),
        isUsernameCustomized: v.boolean(),
        bannerUrl: v.nullable(v.string()),
        bannerPath: v.nullable(v.string()),
    })
);

export type CreateUserDto = v.InferOutput<typeof CreateUserSchema>;
export type UpdateUserDto = v.InferOutput<typeof UpdateUserSchema>;
