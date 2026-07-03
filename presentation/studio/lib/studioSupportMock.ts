import type {
  SupportTicketVM,
  SupportTicketDetailVM,
} from "../view-models/StudioSupportViewModel";

/**
 * Datos MOCK para la sección "Soporte prioritario".
 * Reemplazar por studioService.getSupportTickets(uid).
 */
export const MOCK_SUPPORT_TICKETS: SupportTicketVM[] = [
  {
    id: "tkt-1024",
    subject: "No puedo publicar mi evento",
    category: "Gestión de eventos",
    status: "resolved",
    createdAt: "2026-06-10T11:20:00.000Z",
  },
  {
    id: "tkt-1031",
    subject: "Error al subir la imagen principal",
    category: "Problema técnico",
    status: "in_progress",
    createdAt: "2026-06-18T16:05:00.000Z",
  },
  {
    id: "tkt-1042",
    subject: "Duda sobre facturación del plan profesional",
    category: "Pagos y facturación",
    status: "open",
    createdAt: "2026-06-22T08:45:00.000Z",
  },
];

// MOCK — detalle de cada ticket (descripción, evidencias y respuestas del admin)
const TICKET_DETAILS: Record<string, Omit<SupportTicketDetailVM, keyof SupportTicketVM>> = {
  "tkt-1024": {
    description:
      "Cuando le doy a 'Publicar evento' me sale un error y no pasa nada. Ya completé todos los pasos del formulario.",
    attachments: ["https://picsum.photos/seed/evidencia1/600/400"],
    messages: [
      {
        id: "m1",
        author: "admin",
        authorName: "Soporte QHPH",
        message: "Hola, gracias por reportarlo. ¿Podrías confirmar si verificaste tu correo? Es requisito para publicar.",
        createdAt: "2026-06-10T13:00:00.000Z",
      },
      {
        id: "m2",
        author: "user",
        authorName: "Tú",
        message: "Cierto, no lo había verificado. Ya lo hice y funcionó. ¡Gracias!",
        createdAt: "2026-06-10T15:20:00.000Z",
      },
    ],
    closeReason: "Resuelto: el correo no estaba verificado. Se confirmó publicación exitosa.",
  },
  "tkt-1031": {
    description:
      "Al subir la imagen principal del evento se queda cargando y luego marca error. Probé con varias imágenes JPG.",
    attachments: [
      "https://picsum.photos/seed/evidencia2/600/400",
      "https://picsum.photos/seed/evidencia3/600/400",
    ],
    messages: [
      {
        id: "m1",
        author: "admin",
        authorName: "Soporte QHPH",
        message: "Estamos revisando con el equipo técnico. ¿De qué tamaño son las imágenes aproximadamente?",
        createdAt: "2026-06-18T17:30:00.000Z",
      },
    ],
  },
  "tkt-1042": {
    description:
      "Quiero entender qué incluye el plan profesional y cómo se factura mensualmente.",
    attachments: [],
    messages: [],
  },
};

// MOCK — detalle de un ticket
export function getMockSupportTicketDetail(ticketId: string): SupportTicketDetailVM | null {
  const ticket = MOCK_SUPPORT_TICKETS.find((t) => t.id === ticketId);
  const extra = TICKET_DETAILS[ticketId];
  if (!ticket || !extra) return null;
  return { ...ticket, ...extra };
}
