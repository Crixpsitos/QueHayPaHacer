/** Envía una vista/clic de banner sin bloquear la navegación (sendBeacon; fetch keepalive de respaldo). */
export function trackCampaign(id: string, type: "view" | "click") {
  const body = JSON.stringify({ events: [{ id, type }] });
  try {
    if (navigator.sendBeacon?.("/api/campaigns/track", new Blob([body], { type: "application/json" }))) return;
    void fetch("/api/campaigns/track", { method: "POST", body, keepalive: true, headers: { "content-type": "application/json" } });
  } catch {}
}
