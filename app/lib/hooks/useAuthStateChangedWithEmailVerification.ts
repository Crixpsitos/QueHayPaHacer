import { useEffect, useState, useCallback } from "react"
import { onAuthStateChanged, type User } from "firebase/auth"
import { getFirebaseAuth } from "@/infraestructure/firebase/config/client/firebase"

interface AuthUser extends User {
  emailVerified: boolean
}

interface UseAuthStateOptions {
  onEmailVerified?: (user: AuthUser) => void | Promise<void>
  onEmailNotVerified?: (user: AuthUser) => void
  onSignOut?: () => void
  skipReload?: boolean
}

/**
 * Hook que monitorea cambios en el estado de autenticación y verifica el email
 * Solo ejecuta onEmailVerified si el email está verificado
 * Evita rewrites verificando si el usuario ya existe en la base de datos
 */
export function useAuthStateChangedWithEmailVerification(
  options?: UseAuthStateOptions
) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [emailVerified, setEmailVerified] = useState(false)

  const checkUserExists = useCallback(async (uid: string): Promise<boolean> => {
    try {
      const response = await fetch("/api/auth/me", {
        method: "GET",
        credentials: "include",
      })
      if (response.ok) {
        const userData = await response.json()
        return !!userData?.uid
      }
      return false
    } catch (error) {
      console.error("Error checking user existence:", error)
      return false
    }
  }, [])

  useEffect(() => {
    const auth = getFirebaseAuth()

    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      try {
        if (authUser) {
          // Recargar el usuario para obtener el estado más reciente del email verificado
          if (!options?.skipReload) {
            await authUser.reload()
          }

          const userData: AuthUser = {
            ...authUser,
            emailVerified: authUser.emailVerified,
          }

          setUser(userData)
          setEmailVerified(authUser.emailVerified)

          // Solo ejecutar onEmailVerified si el email está verificado Y el usuario no existe aún
          if (authUser.emailVerified) {
            const userExists = await checkUserExists(authUser.uid)
            if (!userExists) {
              // Usuario nuevo con email verificado - seguro hacer la escritura
              await options?.onEmailVerified?.(userData)
            } else {
              // Usuario ya existe, no hacer rewrite
              console.log("Usuario ya existe en la base de datos, no se hace rewrite")
            }
          } else {
            // Email no verificado
            options?.onEmailNotVerified?.(userData)
          }
        } else {
          setUser(null)
          setEmailVerified(false)
          options?.onSignOut?.()
        }
      } catch (error) {
        console.error("Error en onAuthStateChanged:", error)
      } finally {
        setIsLoading(false)
      }
    })

    return () => unsubscribe()
  }, [options, checkUserExists])

  return {
    user,
    isLoading,
    emailVerified,
    isAuthenticated: !!user,
  }
}
