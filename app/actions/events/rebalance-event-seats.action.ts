"use server";

import { updateTag } from "next/cache";
import { createServerContainer } from "@/infraestructure/di/container";
import { requireEventPermission } from "@/app/actions/_session";
import { eventSeatNotification } from "@/domain/entities/notification/messages";

const ID_RE = /^[A-Za-z0-9_-]{1,128}$/;

async function run(eventId: string, force: boolean): Promise<number> {
  const { eventRegistrationService, notifyUser } = createServerContainer();
  const r = await eventRegistrationService.rebalanceExternalSeats(eventId, force);
  if (!r.changes.length) return 0;
  updateTag(`event-${eventId}`);
  // Un aviso (campanita + push si lo autorizó) por persona y por cambio; el id lo hace idempotente.
  await Promise.all(
    r.changes.map((c) => notifyUser(c.uid, eventSeatNotification({ title: r.title, ref: r.ref, notice: c.notice }), `seat_${eventId}_${c.uid}_${c.notice}_${c.registeredAt}`).catch(() => undefined)),
  );
  return r.changes.length;
}

/**
 * Se llama al abrir el detalle de un evento con enlace externo y cupos. Cualquiera puede dispararla (no hay datos de nadie en la
 * respuesta): sin pasar 5 minutos desde la última revisión no hace nada más que una lectura.
 */
export async function rebalanceEventSeatsAction(eventId: string): Promise<void> {
  const id = eventId?.trim();
  if (!id || !ID_RE.test(id)) return;
  try { await run(id, false); } catch (e) { console.warn("[rebalance-seats]", e instanceof Error ? e.message : "error"); }
}

/** Igual, pero desde Studio: quien organiza siempre obtiene la revisión al día (sin la espera de 5 minutos). */
export async function rebalanceEventSeatsForOwnerAction(eventId: string): Promise<number> {
  const id = eventId?.trim();
  if (!id || !ID_RE.test(id)) return 0;
  if (!(await requireEventPermission(id, "view_registrations", { ownerNeedsPremium: false }))) return 0;
  try { return await run(id, true); } catch (e) { console.warn("[rebalance-seats]", e instanceof Error ? e.message : "error"); return 0; }
}
