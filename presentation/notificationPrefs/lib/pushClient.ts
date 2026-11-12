import { getApp, getApps, initializeApp } from "firebase/app"
import { getMessaging, getToken, isSupported } from "firebase/messaging"
import { firebaseConfig } from "@/infraestructure/firebase/config/client/firebase"
import { registerPushTokenAction } from "@/app/actions/notificationPrefs/push.action"

export type EnablePushResult = { ok: true } | { ok: false; error: string }

/**
 * Pide permiso al navegador y registra ESTE dispositivo. Se llama solo tras una acción de valor (guardar tus avisos),
 * nunca al cargar la página. Si la persona dijo que no, no se vuelve a pedir en 30 días. En iPhone solo funciona con la PWA instalada.
 */
export async function enablePushDevice(): Promise<EnablePushResult> {
  try {
    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
    if (!vapidKey) return { ok: false, error: "Los avisos en el celular todavía no están activos." }
    if (!("Notification" in window) || !("serviceWorker" in navigator) || !(await isSupported())) return { ok: false, error: "Este navegador no permite avisos. En iPhone, instala la app (Compartir → Añadir a pantalla de inicio)." }
    const until = Number(localStorage.getItem("qhpa-push-denied-until") ?? 0)
    if (Notification.permission === "denied" || until > Date.now()) return { ok: false, error: "Tienes los avisos bloqueados en este navegador. Actívalos en la configuración del sitio." }
    const permission = Notification.permission === "granted" ? "granted" : await Notification.requestPermission()
    if (permission !== "granted") { localStorage.setItem("qhpa-push-denied-until", String(Date.now() + 30 * 86_400_000)); return { ok: false, error: "No activaste el permiso. No volveremos a preguntarte por ahora." } }
    const app = getApps().length ? getApp() : initializeApp(firebaseConfig)
    const reg = await navigator.serviceWorker.ready
    const token = await getToken(getMessaging(app), { vapidKey, serviceWorkerRegistration: reg })
    if (!token) return { ok: false, error: "No se pudo registrar este dispositivo." }
    const r = await registerPushTokenAction(token)
    return r.success ? { ok: true } : { ok: false, error: r.error }
  } catch {
    return { ok: false, error: "No se pudo activar el aviso en este dispositivo." }
  }
}
