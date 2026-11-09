export const BASELINE_METRICS = ["views", "likes", "shares", "registrations", "clicks"] as const;
export type BaselineMetric = (typeof BASELINE_METRICS)[number];

export interface BaselineDoc {
  id: string;
  analytics?: Partial<Record<BaselineMetric, number>>;
}

export interface BaselineSummary {
  total: number;
  metrics: Record<BaselineMetric, { sum: number; avg: number }>;
  viewsZero: number;
  withStats: number;
}

const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : 0);

/** Resumen puro de contadores acumulados; `idsWithStats` = ids con subcolección `stats`. */
export function summarizeBaseline(docs: BaselineDoc[], idsWithStats: Set<string>): BaselineSummary {
  const metrics = {} as BaselineSummary["metrics"];
  for (const m of BASELINE_METRICS) {
    const sum = docs.reduce((acc, d) => acc + num(d.analytics?.[m]), 0);
    metrics[m] = { sum, avg: docs.length ? sum / docs.length : 0 };
  }
  return {
    total: docs.length,
    metrics,
    viewsZero: docs.filter((d) => num(d.analytics?.views) === 0).length,
    withStats: docs.filter((d) => idsWithStats.has(d.id)).length,
  };
}
