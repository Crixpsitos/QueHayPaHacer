import { createServerContainer } from "@/infraestructure/di/container";
import { authConfig } from "@/infraestructure/firebase/config/admin/firebase";
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

  const baseUser = toAuthUser(tokens);
  const dbUser = await fetchUserProfile(baseUser.uid);

  const user = {
    ...baseUser,
    profile: dbUser
      ? {
          firstName: dbUser.firstName,
          lastName: dbUser.lastName,
          username: dbUser.displayName,
          phoneNumber: dbUser.phoneNumber,
          accountType: dbUser.accountType ?? null,
        }
      : null,
  };

  return NextResponse.json({ user }, { status: 200 });
}
