import type { Report } from "@/domain/entities/report/Report";

export interface IReportRepository {
  /** Crea el reporte; `false` si ese usuario ya reportó ese contenido. */
  create(report: Report): Promise<boolean>;
  /** Quiénes reportaron ese contenido desde `since` (para ocultar de forma preventiva con varios reportes distintos). */
  recentReporters(targetType: Report["targetType"], targetId: string, since: Date): Promise<{ by: string; at: Date }[]>;
}
