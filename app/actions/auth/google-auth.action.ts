"use server"

import { createServerContainer } from "@/infraestructure/di/container"
import { authConfig } from "@/infraestructure/firebase/config/admin/firebase"
import { refreshCookiesWithIdToken } from "next-firebase-auth-edge/next/cookies"
import { cookies, headers } from "next/headers"
import { redirect, unstable_rethrow } from "next/navigation"

interface GoogleAuthActionResult {
    error?: string;
}

interface GoogleUserData {
    uid: string;
    email: string;
    displayName: string;
    photoURL?: string;
}

export async function googleAuthAction(
    idToken: string,
    googleUser: GoogleUserData,
): Promise<GoogleAuthActionResult | void> {
    try {
        const { userService } = createServerContainer()

        await refreshCookiesWithIdToken(
            idToken,
            await headers(),
            await cookies(),
            authConfig,
        )

        const existing = await userService.getUserById(googleUser.uid)
        if (!existing) {
            const nameParts = googleUser.displayName.trim().split(" ")
            const firstName = nameParts[0] || googleUser.email.split("@")[0]
            const lastName = nameParts.slice(1).join(" ")

            const displayName = `${firstName} ${lastName}`

            // Crear usuario con teléfono vacío
            await userService.createUser({
                uid: googleUser.uid,
                email: googleUser.email,
                emailVerified: false,
                displayName,
                firstName,
                lastName,
                phoneNumber: "",
                photoURL: googleUser.photoURL,
                acceptedTerms: true,
                isPublic: true,
            })
        }

        // Redirigir al home
        redirect("/")
    } catch (error) {
        unstable_rethrow(error)
        console.error("Error al autenticar con Google", error)
        return { error: "No fue posible iniciar sesion con Google. Intenta nuevamente." }
    }
}
