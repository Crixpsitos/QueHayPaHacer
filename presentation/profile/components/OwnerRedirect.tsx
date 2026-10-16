"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/store/auth/AuthContext";

/**
 * Si quien mira es el dueño del perfil, lo manda a /profile. Va en el cliente para que el HTML público no dependa
 * de la sesión (antes `cookies()` en el servidor hacía cada visita única y sin caché).
 */
export function OwnerRedirect({ uid }: { uid: string }) {
  const router = useRouter();
  const { user } = useAuth();
  useEffect(() => {
    if (user?.uid === uid) router.replace("/profile");
  }, [user?.uid, uid, router]);
  return null;
}
