/**
 * ViewModel del Resumen del Estudio.
 * Se construye con `StudioOverviewViewModelMapper.toViewModel(domainOverview)`.
 */

export interface KpiViewModel {
  label: string;
  value: number;
  previousValue?: number;
  changePct: number;
}

export interface StudioOverviewViewModel {
  kpis: {
    views: KpiViewModel;
    registrations: KpiViewModel;
    likes: KpiViewModel;
    activeEvents: KpiViewModel;
  };
  /** Ordenado por conversión desc (eventos sin vistas al final). */
  conversion: ConversionRowViewModel[];
  registrationsTimeline: { date: string; registrations: number }[];
  topEvents: { eventId: string; name: string; score: number; views: number }[];
  interactivity: { eventName: string; views: number; likes: number; shares: number }[];
}

export interface ConversionRowViewModel {
  eventId: string;
  eventName: string;
  views: number;
  registrations: number;
  /** registrations / views; null si no hay vistas (no se puede calcular). */
  rate: number | null;
}
