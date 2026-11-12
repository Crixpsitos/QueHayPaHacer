/**
 * Qué se le dice a la persona al guardar cambios de un evento YA publicado, y a dónde va. Lo usan los dos botones
 * ("Guardar cambios" del encabezado y "Actualizar evento" del último paso) para que digan lo mismo: si el autor no está
 * verificado, editar devuelve el evento a validación y deja de verse hasta que lo aprueben.
 */
export function editOutcome(status: string | undefined): { message: string; goTo: "my-events" | null } {
  if (status === "pending") {
    return { message: "Cambios enviados a validación. Tu evento no será visible hasta que lo aprueben.", goTo: "my-events" };
  }
  return { message: "Cambios guardados.", goTo: null };
}
