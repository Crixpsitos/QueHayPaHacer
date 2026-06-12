"use server"

import { createClientContainer } from "@/infraestructure/di/container.client";
import { createServerContainer } from "@/infraestructure/di/container"
import { authConfig, getFirebaseAdminAuth } from "@/infraestructure/firebase/config/admin/firebase"
import { refreshCookiesWithIdToken } from "next-firebase-auth-edge/next/cookies"
import { cookies, headers } from "next/headers"
import { redirect, unstable_rethrow } from "next/navigation"
import { updateProfile } from "firebase/auth"

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
        const fullPhoneNumber = `+57${phoneNumber}`

        await updateProfile(credentials.user, {
            displayName: username,
        })

        try {
            await getFirebaseAdminAuth().updateUser(uid, {
                phoneNumber: fullPhoneNumber,
            })
        } catch (phoneError) {
            console.warn("No se pudo guardar el telefono en Firebase Auth:", phoneError)
        }

        try {
            await userService.createUser({
                uid,
                email,
                displayName: username,
                firstName: name,
                lastName,
                phoneNumber: fullPhoneNumber,
                acceptedTerms: true,
            })
        } catch (dbError) {
            // Si falla la creacion en DB, eliminar el usuario de Firebase Auth para no dejar datos inconsistentes
            await getFirebaseAdminAuth().deleteUser(uid)
            throw dbError
        }

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

        const message =
            typeof error === "object" && error !== null && "message" in error
                ? String((error as Error).message)
                : ""

        if (message === "Username already in use") {
            return { error: "Ese nombre de usuario ya esta en uso. Elige otro." }
        }

        return {
            error:
                REGISTER_ERROR_MESSAGES[code] ??
                "No fue posible crear la cuenta en este momento. Intenta nuevamente.",
        }
    }
}
