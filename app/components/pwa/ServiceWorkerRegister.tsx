"use client";

import { useEffect } from "react";

/**
 * Registra public/sw.js solo en producción. `?v=` lleva la versión del build
 * (NEXT_PUBLIC_SW_VERSION, fijada en next.config.ts): cada deploy cambia la URL
 * del script → el navegador instala el SW nuevo y este borra los cachés viejos.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker
      .register(`/sw.js?v=${process.env.NEXT_PUBLIC_SW_VERSION}`, { scope: "/", updateViaCache: "none" })
      .catch((error) => console.warn("No se pudo registrar el service worker", error));
  }, []);

  return null;
}
