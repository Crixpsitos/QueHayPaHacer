"use client"

import { useAuth } from "@/app/store/auth/AuthContext"
import { useAuthStateChangedWithEmailVerification } from "@/app/lib/hooks/useAuthStateChangedWithEmailVerification"
import { Mail, LogOut } from "lucide-react"

/**
 * Componente que muestra un aviso simple al usuario
 * indicándole que cierre sesión y reinicie para ver cambios
 * si ha verificado su email
 */
export function EmailVerificationStatus() {
  const { user } = useAuth()
  const { emailVerified } = useAuthStateChangedWithEmailVerification()

  if (!user || emailVerified) {
    return null
  }

  return (
    <div className="sticky top-4 z-50 max-w-sm mx-auto px-4">
      <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-900 p-4 flex items-start gap-3 shadow-sm">
        <div className="shrink-0 mt-1">
          <Mail className="w-5 h-5 text-amber-600 dark:text-amber-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-amber-900 dark:text-amber-200 mb-1">
            Verifica tu email
          </p>
          <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
            Hemos enviado un enlace a <span className="font-semibold">{user.email}</span>. 
            <br />
            <span className="inline-flex items-center gap-1 mt-2">
              <LogOut className="w-3 h-3" />
              Una vez verificado, cierra sesión y vuelve a iniciar para ver los cambios.
            </span>
          </p>
        </div>
      </div>
    </div>
  )
}
