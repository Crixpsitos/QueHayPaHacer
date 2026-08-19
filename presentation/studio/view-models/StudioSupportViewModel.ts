import type { SupportTicketStatus } from "@/domain/entities/studio/Studio";

/**
 * ViewModels de la sección "Soporte prioritario".
 *
 * Modelo: NO es un chat. El usuario crea el ticket y espera; el equipo lo
 * contacta por fuera (correo/teléfono). En la app solo se ve el estado.
 */

export interface SupportTicketVM {
  id: string;
  subject: string;
  category: string;
  status: SupportTicketStatus;
  createdAt: string; // ISO
}

export interface SupportTicketDetailVM extends SupportTicketVM {
  description: string;
  attachments: string[];
  closeReason?: string;
}

export const SUPPORT_CATEGORIES = [
  "Problema técnico",
  "Pagos y facturación",
  "Mi cuenta profesional",
  "Gestión de eventos",
  "Reportar contenido",
  "Otro",
] as const;

export const SUPPORT_STATUS_LABEL: Record<SupportTicketStatus, string> = {
  open: "Abierto",
  in_progress: "En proceso",
  resolved: "Resuelto",
};
