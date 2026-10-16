/**
 * Refresca las cachés de la app tras un cambio hecho desde un script (que no puede llamar a revalidateTag).
 * Usa POST /api/sites/revalidate; requiere REVALIDATE_APP_URL y SITE_REVALIDATE_WEBHOOK_SECRET en el entorno del script.
 * Sin ellas no falla: la ficha pública se refresca sola (≤1 h si estaba publicada, ~1 min si no).
 */
export async function revalidateSite(siteId: string, authorIds: string[] = []): Promise<void> {
  const base = process.env.REVALIDATE_APP_URL;
  const secret = process.env.SITE_REVALIDATE_WEBHOOK_SECRET;
  if (!base || !secret) {
    console.log("(caché de la app sin refrescar: define REVALIDATE_APP_URL y SITE_REVALIDATE_WEBHOOK_SECRET para hacerlo al instante)");
    return;
  }
  try {
    const res = await fetch(`${base.replace(/\/$/, "")}/api/sites/revalidate`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${secret}` },
      body: JSON.stringify({ siteId, authorIds: [...new Set(authorIds.filter(Boolean))] }),
      signal: AbortSignal.timeout(10_000),
    });
    console.log(res.ok ? "caché de la app refrescada" : `la app rechazó la revalidación (HTTP ${res.status})`);
  } catch (error) {
    console.log("no se pudo refrescar la caché de la app:", String(error));
  }
}
