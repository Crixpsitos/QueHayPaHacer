import { createServerContainer } from "@/infraestructure/di/container";
import { authConfig, getFirebaseAdminAuth } from "@/infraestructure/firebase/config/admin/firebase";
import { getTokens, Tokens } from "next-firebase-auth-edge";
import { filterStandardClaims } from "next-firebase-auth-edge/auth/claims";
import { cacheLife, cacheTag } from "next/cache";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";


const toAuthUser = ({ decodedToken }: Tokens) => {
  const {
    uid,
    email,
    picture: photoURL,
    email_verified: emailVerified,
    phone_number: phoneNumber,
    name: displayName,
    source_sign_in_provider: signInProvider,
  } = decodedToken;

  return {
    uid,
    email: email ?? null,
    displayName: displayName ?? null,
    photoURL: photoURL ?? null,
    phoneNumber: phoneNumber ?? null,
    emailVerified: emailVerified ?? false,
    providerId: signInProvider,
    customClaims: filterStandardClaims(decodedToken),
  };
};

const fetchUserProfile = async (uid: string) => {
  "use cache";
  cacheLife("hours");
  cacheTag(`user-profile-${uid}`);

  const { userService } = createServerContainer();
  return userService.getUserById(uid);
};

export async function GET() {
  const tokens = await getTokens(await cookies(), authConfig);

  if (!tokens) {
    return NextResponse.json({ user: null }, { status: 200 });
  }

  const auth = getFirebaseAdminAuth();

  const baseUser = toAuthUser(tokens);

  const [dbUser, customToken] = await Promise.all([
    fetchUserProfile(baseUser.uid),
    auth.createCustomToken(baseUser.uid), 
  ]);

  const user = {
    ...baseUser,
    photoURL: dbUser?.photoURL ?? baseUser.photoURL,
    profile: dbUser
      ? {
          firstName: dbUser.firstName,
          lastName: dbUser.lastName,
          username: dbUser.displayName,
          phoneNumber: dbUser.phoneNumber,
          accountType: dbUser.accountType ?? null,
          professionalType: dbUser.professionalType ?? null,
          professionalStatus: dbUser.professionalStatus ?? null,
          bio: dbUser.bio ?? null,
          photoURL: dbUser.photoURL ?? null,
          imagePath: dbUser.imagePath ?? null,
          isPublic: dbUser.isPublic,
          brandName: dbUser.brandName,
          website: dbUser.website,
          mapsLink: dbUser.mapsLink,
          socialLink: dbUser.socialLink,
          socialLinks: dbUser.socialLinks,
          isUsernameCustomized: dbUser.isUsernameCustomized,
          professionalDescription: dbUser.professionalDescription,
          professionalDetails: dbUser.professionalDetails,
          bannerUrl: dbUser.bannerUrl ?? null,
          bannerPath: dbUser.bannerPath ?? null,
        }
      : null,
  };

  return NextResponse.json({ user, customToken }, { status: 200 });
}
