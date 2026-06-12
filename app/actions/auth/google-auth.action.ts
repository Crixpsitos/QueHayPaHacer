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

            // Generate username from email prefix; if taken, append random suffix
            let baseUsername = googleUser.email.split("@")[0].toLowerCase().replace(/[^a-z0-9._]/g, "")
            let username = baseUsername
            let attempts = 0
            while (attempts < 5) {
                const taken = await userService.getUserByUsername(username)
                if (!taken) break
                username = `${baseUsername}${Math.floor(Math.random() * 9000) + 1000}`
                attempts++
            }

            await userService.createUser({
                uid: googleUser.uid,
                email: googleUser.email,
                displayName: username,
                firstName,
                lastName,
                phoneNumber: "",
                photoURL: googleUser.photoURL,
                acceptedTerms: true,
            })
        }

        redirect("/")
    } catch (error) {
        unstable_rethrow(error)
        console.error("Error al autenticar con Google", error)
        return { error: "No fue posible iniciar sesion con Google. Intenta nuevamente." }
    }
}
