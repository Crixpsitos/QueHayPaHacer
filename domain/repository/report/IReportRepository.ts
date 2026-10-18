import type { Report } from "@/domain/entities/report/Report";

export interface IReportRepository {
  /** Crea el reporte; `false` si ese usuario ya reportó ese contenido. */
  create(report: Report): Promise<boolean>;
}
