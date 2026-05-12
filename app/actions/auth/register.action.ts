"use server"

import { createClientContainer, createServerContainer } from "@/infraestructure/di/container"
import { authConfig } from "@/infraestructure/firebase/config/admin/firebase"
import { refreshCookiesWithIdToken } from "next-firebase-auth-edge/next/cookies"
import { cookies, headers } from "next/headers"
import { redirect, unstable_rethrow } from "next/navigation"

interface RegisterActionResult {
    error?: string;
}

const REGISTER_ERROR_MESSAGES: Record<string, string> = {
    "auth/email-already-in-use": "Ya existe una cuenta con ese correo.",
    "auth/invalid-email": "El correo no es valido.",
    "auth/weak-password": "La contrasena es muy debil.",
};

export async function registerAction(
    name: string,
    lastName: string,
    username: string,
    email: string,
    phoneNumber: string,
    password: string,
): Promise<RegisterActionResult | void> {
    try {
        const { authService } = createClientContainer()
        const { userService } = createServerContainer()

        const credentials = await authService.register(email, password)
        const uid = credentials.user.uid
        const idToken = await credentials.user.getIdToken()

        await userService.createUser({
            uid,
            email,
            displayName: username,
            firstName: name,
            lastName,
            phoneNumber,
            acceptedTerms: true,
        })

        await refreshCookiesWithIdToken(
            idToken,
            await headers(),
            await cookies(),
            authConfig,
        )

        redirect("/")
    } catch (error) {
        unstable_rethrow(error)

        console.error("Error al registrar usuario", error)

        const code =
            typeof error === "object" && error !== null && "code" in error
                ? String(error.code)
                : ""

        return {
            error:
                REGISTER_ERROR_MESSAGES[code] ??
                "No fue posible crear la cuenta en este momento. Intenta nuevamente.",
        }
    }
}
