"use client"

import { useAuth } from "@/app/store/auth/AuthContext"
import { useAuthStateChangedWithEmailVerification } from "@/app/lib/hooks/useAuthStateChangedWithEmailVerification"
import { useTransition } from "react"

/**
 * Componente que monitorea la verificación de email en tiempo real
 * Cuando detecta que el email fue verificado, actualiza el contexto de autenticación
 * 
 * ✨ Verifica cada 3 segundos sin necesidad de cerrar/abrir sesión
 */
export function EmailVerificationWatcher() {
  const { user, refreshUser } = useAuth()
  const [, startTransition] = useTransition()

  // Usar el hook mejorado con polling
  useAuthStateChangedWithEmailVerification({
    onEmailVerified: async (authUser) => {
      console.log("✅ Email verificado detectado en tiempo real")
      // Actualizar el user en el contexto desde la BD
      startTransition(() => {
        void refreshUser()
      })
    },
    onEmailNotVerified: (authUser) => {
      console.log("⏳ Esperando verificación de email...", authUser.email)
    },
  })

  return null
}
