"use server"

import { authConfig } from "@/infraestructure/firebase/config/admin/firebase"
import { removeServerCookies } from "next-firebase-auth-edge/next/cookies"
import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"

export async function logoutAction(): Promise<void> {
    await removeServerCookies(await cookies(), { cookieName: authConfig.cookieName })
    revalidatePath("/", "layout")
}
