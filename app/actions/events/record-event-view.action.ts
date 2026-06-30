"use server";

import { getFirebaseFirestore } from "@/infraestructure/firebase/config/admin/firebase";
import { FieldValue } from "firebase-admin/firestore";

export async function recordEventViewAction(eventId: string, userId?: string): Promise<void> {
  // Solo registrar vista si el usuario está autenticado
  if (!userId) {
    return;
  }

  try {
    const db = getFirebaseFirestore();
    const batch = db.batch();

    // Referencia del documento de interacción del usuario con el evento
    const eventInteractionRef = db
      .collection("users")
      .doc(userId)
      .collection("eventInteractions")
      .doc(eventId);

    // Verificar si el usuario ya ha visto este evento
    const existingInteraction = await eventInteractionRef.get();

    // Solo registrar la vista si es la primera vez que este usuario ve el evento
    if (!existingInteraction.exists) {
      // Incrementar contador global de vistas del evento
      const eventAnalyticsRef = db.collection("events").doc(eventId);
      batch.update(eventAnalyticsRef, {
        "analytics.views": FieldValue.increment(1),
      });

      // Registrar la interacción de visualización
      batch.set(
        eventInteractionRef,
        {
          eventId,
          type: "view",
          viewedAt: new Date(),
        },
        { merge: true },
      );

      await batch.commit();
    }
  } catch (error) {
    // Log de error pero no lanzar excepción — esto es análitica no bloqueante
    console.error("Error al registrar vista del evento:", error);
  }
}
