"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { rebalanceEventSeatsForOwnerAction } from "@/app/actions/events/rebalance-event-seats.action";

/**
 * Al abrir el panel de un evento con enlace externo se ponen al día los cupos (vencimientos de 24 h y lista de espera) y se avisa
 * a las personas afectadas. Si algo cambió, se recarga la lista. No pinta nada.
 */
export function SeatsRebalance({ eventId }: { eventId: string }) {
  const router = useRouter();
  useEffect(() => {
    let alive = true;
    void rebalanceEventSeatsForOwnerAction(eventId).then((n) => { if (alive && n > 0) router.refresh(); }).catch(() => undefined);
    return () => { alive = false; };
  }, [eventId, router]);
  return null;
}
