"use server"

import { createClientContainer } from "@/infraestructure/di/container"
import { authConfig } from "@/infraestructure/firebase/config/admin/firebase"
import { refreshCookiesWithIdToken } from "next-firebase-auth-edge/next/cookies"
import { cookies, headers } from "next/headers"
import { redirect, unstable_rethrow } from "next/navigation"

interface LoginActionResult {
    error?: string;
}

const AUTH_ERROR_MESSAGES: Record<string, string> = {
    "auth/invalid-email": "El correo no es valido.",
    "auth/user-not-found": "No existe una cuenta con ese correo.",
    "auth/wrong-password": "Contrasena incorrecta.",
    "auth/invalid-credential": "Correo o contrasena incorrectos.",
    "auth/too-many-requests": "Demasiados intentos. Intenta de nuevo en unos minutos.",
};

export async function loginAction(
    email: string,
    password: string,
): Promise<LoginActionResult | void> {
    try {
        const { authService } = createClientContainer()

        const credentials = await authService.login(email, password)

        const idToken = await credentials.user.getIdToken()

        await refreshCookiesWithIdToken(
            idToken,
            await headers(),
            await cookies(),
            authConfig,
        )

        redirect("/")
    } catch (error) {
        unstable_rethrow(error)

        console.error("Error al iniciar sesion", error)

        const code =
            typeof error === "object" && error !== null && "code" in error
                ? String(error.code)
                : ""

        return {
            error:
                AUTH_ERROR_MESSAGES[code] ??
                "No fue posible iniciar sesion en este momento. Intenta nuevamente.",
        }
    }
}