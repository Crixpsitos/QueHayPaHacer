import type { SupportTicketStatus } from "@/domain/entities/studio/Studio";

/**
 * ViewModels de la sección "Soporte prioritario".
 * Datos MOCK por ahora (ver `lib/studioSupportMock.ts`).
 * Repos relacionados (stubs): getSupportTickets, createSupportTicket.
 */

export interface SupportTicketVM {
  id: string;
  subject: string;
  category: string;
  status: SupportTicketStatus;
  createdAt: string; // ISO
}

export interface SupportMessageVM {
  id: string;
  author: "user" | "admin";
  authorName: string;
  message: string;
  createdAt: string; // ISO
}

export interface SupportTicketDetailVM extends SupportTicketVM {
  description: string;
  attachments: string[];
  messages: SupportMessageVM[];
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
