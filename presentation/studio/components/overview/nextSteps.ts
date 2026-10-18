import type { StudioOverviewViewModel } from "../../view-models/StudioOverviewViewModel";

/** Con menos vistas la tasa de conversión es ruido: no se sugiere nada. */
export const MIN_VIEWS_FOR_CONVERSION = 20;

const pct = new Intl.NumberFormat("es-CO", { style: "percent", maximumFractionDigits: 1 });
const num = new Intl.NumberFormat("es-CO");

/**
 * 0–3 sugerencias derivadas solo de los números del resumen. Nunca inventa
 * métricas: si no hay base suficiente, devuelve menos (o ninguna).
 */
export function buildNextSteps(data: StudioOverviewViewModel): string[] {
  const steps: string[] = [];
  const measurable = data.conversion.filter(
    (r) => r.rate !== null && r.views >= MIN_VIEWS_FOR_CONVERSION,
  );

  // `conversion` ya viene ordenado por tasa desc.
  const best = measurable[0];
  const worst = measurable.length >= 2 ? measurable[measurable.length - 1] : undefined;

  if (worst && worst.rate! < best.rate!) {
    steps.push(
      `«${worst.eventName}» tiene ${num.format(worst.views)} vistas pero convierte solo el ${pct.format(worst.rate!)}. Revisa la descripción, el precio o la fecha.`,
    );
  }
  if (best && best.registrations > 0) {
    steps.push(
      `«${best.eventName}» es el que mejor convierte (${pct.format(best.rate!)}). Vuelve a compartirlo mientras tiene tirón.`,
    );
  }

  const unshared = data.interactivity
    .filter((e) => e.shares === 0 && e.views >= MIN_VIEWS_FOR_CONVERSION)
    .sort((a, b) => b.views - a.views)[0];
  if (unshared) {
    steps.push(
      `«${unshared.eventName}» suma ${num.format(unshared.views)} vistas y nadie lo ha compartido. Pide a tus asistentes que lo compartan.`,
    );
  }

  if (data.kpis.activeEvents.value === 0) {
    steps.unshift("No tienes eventos activos. Publica uno para volver a recibir visitas.");
  }

  return steps.slice(0, 3);
}
