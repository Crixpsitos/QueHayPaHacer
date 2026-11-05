import type { MediaItem } from "@/application/dto/events/EventDto";
import type { IStorageService } from "@/domain/services/storage/IStorageService";
import { canRetryNow, type RetryDecision } from "./decideRetry";

export type RetryEventMediaResult =
  | { success: true; status: "retriggered" }
  | { success: true; status: "already-ready"; item: MediaItem }
  | { success: false; error: string; code: "forbidden" | "not-found" | "missing-original" | "failed" };

/**
 * Ejecuta la decisión de "Reintentar" (eventos y sesiones comparten esto): reescribe el original en Storage para que
 * el CF vuelva a correr. Con enfriamiento en el servidor y sin tocar el documento.
 */
export async function applyRetry(
  decision: RetryDecision,
  storage: IStorageService,
  media: { id: string }[],
  mediaId: string,
): Promise<RetryEventMediaResult> {
  switch (decision.kind) {
    case "already-ready": {
      // El documento ya está listo pero el formulario sigue viendo "processing": devolver el item guardado.
      const item = media.find((m) => m.id === mediaId);
      return { success: true, status: "already-ready", item: JSON.parse(JSON.stringify(item)) as MediaItem };
    }
    case "not-found":
      return { success: false, code: "not-found", error: "No encontramos ese archivo." };
    case "bad-path":
      return { success: false, code: "missing-original", error: "No pudimos recuperar este archivo. Vuelve a subirlo." };
  }

  try {
    const age = await storage.ageMs(decision.path);
    if (age === null) {
      return { success: false, code: "missing-original", error: "El archivo original ya no existe. Vuelve a subirlo." };
    }
    // Cada reintento lanza una compresión (imagen o ffmpeg): sin enfriamiento un bucle del cliente sale caro.
    if (!canRetryNow(age)) {
      return { success: false, code: "failed", error: "Ya se está reintentando. Espera un par de minutos." };
    }
    await storage.retrigger(decision.path);
    return { success: true, status: "retriggered" };
  } catch (error) {
    console.error("retry media failed:", error);
    return { success: false, code: "failed", error: "No se pudo reintentar. Inténtalo de nuevo en un momento." };
  }
}
