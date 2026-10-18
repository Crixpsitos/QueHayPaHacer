"use server"

import { createServerContainer } from "@/infraestructure/di/container"
import { authConfig, getFirebaseAdminAuth } from "@/infraestructure/firebase/config/admin/firebase"
import { refreshCookiesWithIdToken } from "next-firebase-auth-edge/next/cookies"
import { cookies, headers } from "next/headers"
import { LEGAL_VERSION } from "@/app/lib/legal/version"

interface GoogleAuthActionResult {
    error?: string;
    success?: boolean;
    needsTerms?: boolean;
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
    acceptedTerms?: boolean,
): Promise<GoogleAuthActionResult | void> {
    try {
        const { userService } = createServerContainer()

        // googleUser llega del cliente: el uid debe ser el del token verificado.
        const { uid } = await getFirebaseAdminAuth().verifyIdToken(idToken)
        if (uid !== googleUser.uid) return { error: "No autorizado." }

        const existing = await userService.getUserById(googleUser.uid)
        // Cuenta nueva sin aceptación expresa: no se crea usuario ni sesión.
        if (!existing && acceptedTerms !== true) return { needsTerms: true }

        if (!existing) {
            const nameParts = googleUser.displayName.trim().split(" ")
            const firstName = nameParts[0] || googleUser.email.split("@")[0]
            const lastName = nameParts.slice(1).join(" ")

            const displayName = `${firstName} ${lastName}`

            // Crear usuario con teléfono vacío
            const createdUser = await userService.createUser({
                uid: googleUser.uid,
                email: googleUser.email,
                emailVerified: false,
                displayName,
                firstName,
                lastName,
                phoneNumber: "",
                photoURL: googleUser.photoURL,
                acceptedTerms: true,
                acceptedTermsVersion: LEGAL_VERSION,
                creatorVerified: false,
                isPublic: false,
            })

            try {
                await getFirebaseAdminAuth().updateUser(googleUser.uid, {
                    displayName: createdUser.displayName,
                })
            } catch (error) {
                await userService.deleteUser(googleUser.uid)
                throw error
            }
        }

        await refreshCookiesWithIdToken(
            idToken,
            await headers(),
            await cookies(),
            authConfig,
        )

        return { success: true }
    } catch (error) {
        console.error("Error al autenticar con Google", error)
        return { error: "No fue posible iniciar sesion con Google. Intenta nuevamente." }
    }
}
