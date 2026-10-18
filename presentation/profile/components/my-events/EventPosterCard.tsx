import Image from "next/image";
import Link from "next/link";
import { BarChart3, ExternalLink, Pencil } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { cn } from "@/app/lib/utils/cn";
import type { UserEvent } from "@/domain/repository/profile/IProfileRepository";
import { conversion, eventKind, type EventKind } from "./myEvents";

const STATUS: Record<EventKind, { label: string; className: string }> = {
  published: { label: "Publicado", className: "bg-white text-emerald-700" },
  review: { label: "En revisión", className: "bg-brand-gold text-foreground" },
  draft: { label: "Borrador", className: "bg-foreground text-white" },
  rejected: { label: "Rechazado", className: "bg-primary text-white" },
  other: { label: "", className: "bg-white text-muted-foreground" },
};

const OTHER_LABELS: Record<string, string> = { cancelled: "Cancelado", ended: "Finalizado" };

const dateFormat = new Intl.DateTimeFormat("es-CO", {
  timeZone: "America/Bogota",
  weekday: "long",
  day: "numeric",
  month: "long",
  hour: "numeric",
  minute: "2-digit",
});
const numberFormat = new Intl.NumberFormat("es-CO");

const metric = (value?: number) => (typeof value === "number" ? numberFormat.format(value) : "—");

interface EventPosterCardProps {
  event: UserEvent;
  isPremium: boolean;
  priority?: boolean;
}

export function EventPosterCard({ event, isPremium, priority = false }: EventPosterCardProps) {
  const kind = eventKind(event);
  const status = STATUS[kind];
  const statusLabel = status.label || OTHER_LABELS[event.status] || event.status;
  const { views, likes, registrations } = event.analytics ?? {};
  // Sin inscripción en la plataforma, "inscritos" no aplica: mejor "—" que un 0 engañoso.
  const hasRegistrations = event.registrationType !== "none";
  const rate = hasRegistrations ? conversion(views, registrations) : null;
  const venue = event.location?.venue ?? event.location?.city;
  const initial = (event.category?.title ?? event.title).trim().charAt(0).toUpperCase() || "Q";

  return (
    <article className="group flex flex-col">
      <div className="relative aspect-video overflow-hidden rounded-2xl bg-muted">
        {event.image ? (
          <Image
            src={event.image}
            alt=""
            fill
            priority={priority}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover motion-safe:transition-transform motion-safe:duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div
            aria-hidden
            className="flex size-full items-end justify-end p-4"
            style={{ background: "var(--grad-primary)" }}
          >
            <span className="font-heading text-7xl leading-none font-bold text-white/85">{initial}</span>
          </div>
        )}
        <span
          className={cn(
            "absolute top-3 left-3 rounded-full px-2.5 py-1 text-xs font-semibold shadow-sm",
            status.className,
          )}
        >
          {statusLabel}
        </span>
      </div>

      <div className="flex flex-1 flex-col pt-4">
        <h2 className="font-heading line-clamp-2 text-lg leading-snug font-semibold text-balance">
          {event.title}
        </h2>
        <p className="mt-1.5 text-sm text-foreground/80 first-letter:uppercase">
          {event.startDate ? (
            <>
              {event.eventType === "multi-date" && "Desde el "}
              <time dateTime={new Date(event.startDate).toISOString()}>
                {dateFormat.format(new Date(event.startDate))}
              </time>
            </>
          ) : (
            "Sin fecha definida"
          )}
        </p>
        {venue && <p className="mt-0.5 truncate text-sm text-muted-foreground">{venue}</p>}

        {kind === "rejected" && event.rejectionReason && (
          <p className="mt-3 rounded-xl bg-primary-light px-3 py-2 text-sm leading-relaxed text-primary-dark">
            <span className="font-semibold">Motivo del rechazo:</span> {event.rejectionReason}
          </p>
        )}

        <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-2 border-t border-border pt-3 text-sm">
          <Metric label="Vistas" value={metric(views)} />
          <Metric label="Me gusta" value={metric(likes)} />
          <Metric label="Inscritos" value={hasRegistrations ? metric(registrations) : "—"} />
          {rate && <Metric label="Conversión" value={rate} muted />}
        </dl>

        <div className="mt-4 flex flex-wrap gap-2 pt-1 sm:mt-auto sm:pt-4">
          <Button asChild size="sm">
            <Link href={`/eventos/${event.id}/edit`}>
              <Pencil aria-hidden />
              Gestionar
            </Link>
          </Button>
          {kind === "published" && (
            <Button asChild size="sm" variant="outline">
              <Link href={`/eventos/${event.id}`}>
                <ExternalLink aria-hidden />
                Ver
              </Link>
            </Button>
          )}
          {isPremium && (
            <Button asChild size="sm" variant="ghost">
              <Link href={`/studio/events/${event.id}`}>
                <BarChart3 aria-hidden />
                Estadísticas
              </Link>
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}

function Metric({ label, value, muted = false }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex flex-col">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className={cn("font-semibold tabular-nums", muted && "text-muted-foreground")}>{value}</dd>
    </div>
  );
}
