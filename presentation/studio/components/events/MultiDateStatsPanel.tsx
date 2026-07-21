import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  CalendarDays,
  ChevronRight,
  Eye,
  Heart,
  ImageIcon,
  Layers,
  Pencil,
  Share2,
  TrendingUp,
  Users,
} from "lucide-react";
import { cn } from "@/app/lib/utils/cn";
import type { MultiDateEventStats } from "@/domain/entities/studio/Studio";

interface MultiDateStatsPanelProps {
  stats: MultiDateEventStats;
}

const formatNumber = (n: number) => n.toLocaleString("es-CO");

const formatDate = (date: Date | null) =>
  date
    ? new Intl.DateTimeFormat("es-CO", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(date)
    : "Sin fecha";

const STATUS_STYLE: Record<string, string> = {
  published: "bg-emerald-50 text-emerald-700",
  draft: "bg-slate-100 text-slate-600",
  cancelled: "bg-red-50 text-red-600",
  ended: "bg-amber-50 text-amber-700",
};

const STATUS_LABEL: Record<string, string> = {
  published: "Publicada",
  draft: "Borrador",
  cancelled: "Cancelada",
  ended: "Finalizada",
};

/**
 * Índice del Estudio para eventos multi-date: acumulado arriba y una tarjeta por
 * fecha, cada una enlazando a su propio detalle (mismo diseño que un evento
 * normal: gráficas + tabla de inscritos).
 *
 * Reemplaza a los slots `stats`/`registrations`, que asumen un evento con fecha
 * y registro propios. Aquí eso vive en cada sesión, así que las métricas del
 * padre solas engañan: el acumulado suma evento + sesiones.
 */
export function MultiDateStatsPanel({ stats }: MultiDateStatsPanelProps) {
  const published = stats.status.toLowerCase() === "published";

  // Los likes NO se acumulan: son del evento. Sumar los de las fechas contaría
  // dos veces a quien dio like al evento y a una de sus fechas (mismo uid).
  const totalItems = [
    { key: "views", label: "Vistas", icon: Eye, value: stats.totals.views },
    {
      key: "registrations",
      label: "Registros",
      icon: Users,
      value: stats.totals.registrations,
    },
    { key: "shares", label: "Compartidos", icon: Share2, value: stats.totals.shares },
    {
      key: "sessions",
      label: "Fechas",
      icon: Layers,
      value: stats.sessions.length,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div>
        <Link
          href="/studio/events"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Mis eventos
        </Link>

        <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
              {stats.image ? (
                <Image
                  src={stats.image}
                  alt={stats.name}
                  fill
                  sizes="56px"
                  className="object-cover"
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center">
                  <ImageIcon className="h-4 w-4 text-slate-300" />
                </span>
              )}
            </span>

            <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                {stats.name}
              </h1>
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
                  published
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-slate-100 text-slate-600",
                )}
              >
                {published ? "Publicado" : "Borrador"}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2.5 py-0.5 text-xs font-semibold text-violet-700">
                <CalendarDays className="h-3 w-3" />
                Varias fechas
              </span>
            </div>
            <p className="mt-1.5 text-sm text-slate-500">
              Abre una fecha para ver sus gráficas y su tabla de inscritos.
            </p>
            </div>
          </div>

          <Link
            href={`/eventos/${stats.eventId}/edit?step=sessions`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            <Pencil className="h-4 w-4" />
            Gestionar sesiones
          </Link>
        </div>
      </div>

      {/* Acumulado evento + sesiones */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-slate-900">
          Acumulado{" "}
          <span className="font-normal text-slate-400">
            (evento + {stats.sessions.length}{" "}
            {stats.sessions.length === 1 ? "fecha" : "fechas"})
          </span>
        </h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {totalItems.map(({ key, label, icon: Icon, value }) => (
            <div
              key={key}
              className="rounded-xl border border-slate-200 bg-white p-4"
            >
              <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                <Icon className="h-3.5 w-3.5" />
                {label}
              </div>
              <p className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900">
                {formatNumber(value)}
              </p>
            </div>
          ))}
        </div>
        {/* El like es del evento completo, no de una fecha: por eso va aparte. */}
        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
          <span className="inline-flex items-center gap-1.5">
            <Heart className="h-3.5 w-3.5 text-slate-400" />
            <span className="font-semibold text-slate-900">
              {formatNumber(stats.event.likes)}
            </span>
            like(s) al evento
          </span>
          <span className="inline-flex items-center gap-1.5">
            <TrendingUp className="h-3.5 w-3.5 text-slate-400" />
            score{" "}
            <span className="font-semibold text-slate-900">
              {stats.event.score.toFixed(2)}
            </span>
          </span>
          <span className="text-slate-400">
            El like es del evento completo, no de una fecha.
          </span>
        </div>
      </div>

      {/* Fechas */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-900">Fechas</h2>

        {stats.sessions.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-200 px-4 py-10 text-center text-sm text-slate-500">
            Este evento aún no tiene fechas.
          </p>
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {stats.sessions.map((session) => (
              <Link
                key={session.sessionId}
                href={`/studio/events/${stats.eventId}/session/${session.sessionId}`}
                className="group flex items-stretch gap-4 rounded-xl border border-slate-200 bg-white p-3 transition-all hover:border-indigo-300 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
              >
                {/* Portada resuelta por `coverSource` (propia, del padre u otra sesión). */}
                <span className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
                  {session.image ? (
                    <Image
                      src={session.image}
                      alt={session.title}
                      fill
                      sizes="96px"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center">
                      <ImageIcon className="h-5 w-5 text-slate-300" />
                    </span>
                  )}
                </span>

                <div className="flex min-w-0 flex-1 flex-col justify-between py-0.5">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="truncate font-semibold text-slate-900 group-hover:text-indigo-700">
                        {session.title}
                      </span>
                      <span
                        className={cn(
                          "inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-semibold",
                          STATUS_STYLE[session.status] ?? STATUS_STYLE.draft,
                        )}
                      >
                        {STATUS_LABEL[session.status] ?? session.status}
                      </span>
                    </div>

                    <p
                      className="mt-1 flex items-center gap-1.5 text-xs text-slate-500"
                      suppressHydrationWarning
                    >
                      <CalendarDays className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                      {formatDate(session.startDate)}
                    </p>
                  </div>

                  <div className="mt-2 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3.5 text-xs text-slate-600">
                      <span className="inline-flex items-center gap-1">
                        <Eye className="h-3.5 w-3.5 text-slate-400" />
                        <span className="tabular-nums font-medium">
                          {formatNumber(session.views)}
                        </span>
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Users className="h-3.5 w-3.5 text-slate-400" />
                        <span className="tabular-nums font-medium">
                          {formatNumber(session.registrations)}
                        </span>
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Share2 className="h-3.5 w-3.5 text-slate-400" />
                        <span className="tabular-nums font-medium">
                          {formatNumber(session.shares)}
                        </span>
                      </span>
                    </div>

                    {/* CTA explícito: la tarjeta entera navega, pero sin esto no
                        se lee como algo en lo que se pueda entrar. */}
                    <span className="inline-flex shrink-0 items-center gap-0.5 text-xs font-semibold text-indigo-600">
                      Ver estadísticas
                      <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
