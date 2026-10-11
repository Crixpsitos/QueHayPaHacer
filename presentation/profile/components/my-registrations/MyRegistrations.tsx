"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarSearch, MapPin } from "lucide-react";
import { cancelRegistrationAction } from "@/app/actions/events/cancel-registration.action";
import { Button } from "@/app/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { cn } from "@/app/lib/utils/cn";
import {
  canCancel,
  registrationCounts,
  splitRegistrations,
  statusLabel,
  type UserRegistrationItem,
} from "@/domain/entities/EventRegistration/myRegistrations";
import { dateParts, formatTimeRange } from "@/presentation/events/components/detail/format";
import { notify } from "@/presentation/shared/lib/notify";

const keyOf = (r: UserRegistrationItem) => `${r.eventId}/${r.sessionId ?? ""}`;
const hrefOf = (r: UserRegistrationItem) =>
  r.sessionId ? `/eventos/${r.eventRef}/sessions/${r.sessionRef}` : `/eventos/${r.eventRef}`;

export function MyRegistrations({ items }: { items: UserRegistrationItem[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [target, setTarget] = useState<UserRegistrationItem | null>(null);
  // `now` se fija al montar para que el corte próxima/pasada no cambie entre renders.
  const [now] = useState(() => Date.now());

  const { upcoming, past } = splitRegistrations(items, now);
  const counts = registrationCounts(items, now);

  const confirmCancel = () => {
    if (!target) return;
    const r = target;
    startTransition(async () => {
      const res = await cancelRegistrationAction({ eventId: r.eventId, sessionId: r.sessionId });
      if (res.success) {
        notify.success("Inscripción cancelada");
        setTarget(null);
        router.refresh();
      } else {
        notify.error(res.error ?? "No se pudo cancelar la inscripción.");
      }
    });
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">Mis inscripciones</h1>
        <p className="mt-2 text-muted-foreground">Los eventos a los que te inscribiste y tu historial de asistencia.</p>
      </header>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-14 text-center">
          <p className="font-heading text-lg font-semibold">Aún no te has inscrito a ningún evento</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            Cuando te inscribas a uno, lo verás aquí con su fecha y lugar.
          </p>
          <Button asChild variant="outline" className="mt-5">
            <Link href="/eventos">
              <CalendarSearch aria-hidden />
              Explorar eventos
            </Link>
          </Button>
        </div>
      ) : (
        <>
          <dl className="grid grid-cols-2 divide-x divide-border rounded-2xl border border-border bg-card">
            <Counter label="Próximas" value={counts.upcoming} />
            <Counter label="Asistidas" value={counts.attended} />
          </dl>

          <Section title="Próximas" items={upcoming} now={now} onCancel={setTarget} empty="No tienes inscripciones vigentes." />
          {past.length > 0 && <Section title="Historial" items={past} now={now} onCancel={setTarget} />}
        </>
      )}

      <Dialog open={target !== null} onOpenChange={(open) => !open && !pending && setTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Cancelar tu inscripción?</DialogTitle>
            <DialogDescription>
              Dejarás de estar inscrito en {target?.title}. Puedes volver a inscribirte mientras el evento no haya terminado.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTarget(null)} disabled={pending}>
              Mantener inscripción
            </Button>
            <Button variant="destructive" onClick={confirmCancel} disabled={pending}>
              {pending ? "Cancelando…" : "Cancelar inscripción"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Counter({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col gap-1 px-4 py-4 sm:px-6 sm:py-5">
      <dt className="text-xs text-muted-foreground sm:text-sm">{label}</dt>
      <dd className="font-heading text-2xl font-bold tabular-nums sm:text-3xl">{value}</dd>
    </div>
  );
}

function Section({
  title, items, now, onCancel, empty,
}: {
  title: string;
  items: UserRegistrationItem[];
  now: number;
  onCancel: (r: UserRegistrationItem) => void;
  empty?: string;
}) {
  return (
    <section aria-labelledby={`sec-${title}`} className="space-y-4">
      <h2 id={`sec-${title}`} className="font-heading text-xl font-semibold">
        {title} <span className="text-base font-normal text-muted-foreground tabular-nums">{items.length}</span>
      </h2>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{empty}</p>
      ) : (
        <ul className="space-y-3">
          {items.map((r, i) => (
            <li key={keyOf(r)}>
              <RegistrationRow r={r} now={now} priority={i < 2} onCancel={onCancel} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

const notch = "absolute left-0 size-4 -translate-x-1/2 rounded-full border border-[#E4E4E7] bg-[#FAFAFC]";

function RegistrationRow({
  r, now, priority, onCancel,
}: {
  r: UserRegistrationItem;
  now: number;
  priority: boolean;
  onCancel: (r: UserRegistrationItem) => void;
}) {
  const muted = r.status === "canceled" || new Date(r.endDate).getTime() < now;
  const d = dateParts(r.startDate);
  const place = [r.venue, r.city].filter(Boolean).join(", ");
  const label = statusLabel(r);
  const confirmed = label === "Asistencia confirmada";

  return (
    <article className={cn("relative flex overflow-hidden rounded-2xl border bg-white", muted ? "border-[#F4F4F5]" : "border-[#E4E4E7]")}>
      <div
        className={cn(
          "flex w-20 shrink-0 flex-col items-center justify-center py-4 sm:w-24",
          muted ? "bg-[#F4F4F5] text-[#A1A1AA]" : "bg-[#09090B] text-white",
        )}
      >
        <span className={cn("text-xs capitalize", !muted && "text-white/60")}>{d.weekdayShort}</span>
        <span className="font-heading text-3xl leading-none font-bold tracking-tight tabular-nums">{d.day}</span>
        <span className="mt-0.5 text-xs font-medium">{d.monthShort}</span>
      </div>

      <div aria-hidden="true" className="relative w-0">
        <span className={cn(notch, "-top-2")} />
        <span className="absolute inset-y-3 left-0 border-l-2 border-dashed border-[#E4E4E7]" />
        <span className={cn(notch, "-bottom-2")} />
      </div>

      <div className="flex min-w-0 flex-1 gap-3 py-3.5 pr-4 pl-5">
        <div className="min-w-0 flex-1 space-y-1">
          <h3 className="font-heading leading-snug font-semibold text-balance">
            <Link
              href={hrefOf(r)}
              className={cn(
                "line-clamp-2 hover:underline focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-[#E63946] focus-visible:ring-offset-2 focus-visible:outline-none",
                muted ? "text-[#71717A]" : "text-[#09090B]",
              )}
            >
              {r.title}
            </Link>
          </h3>
          {r.eventTitle && <p className="truncate text-xs text-[#71717A]">{r.eventTitle}</p>}
          <p className="text-sm text-[#52525B]">
            <time dateTime={r.startDate}>{formatTimeRange(r.startDate, r.endDate)}</time>
          </p>
          {place && (
            <p className="flex items-center gap-1 truncate text-sm text-[#71717A]">
              <MapPin className="size-3.5 shrink-0" aria-hidden />
              <span className="truncate">{place}</span>
            </p>
          )}
          <div className="flex flex-wrap items-center gap-2 pt-1.5">
            <span
              className={cn(
                "rounded-full px-2.5 py-0.5 text-xs font-medium",
                r.status === "canceled" && "bg-[#F4F4F5] text-[#71717A]",
                confirmed && "bg-emerald-50 text-emerald-700",
                !confirmed && r.status !== "canceled" && "bg-[#09090B]/5 text-[#09090B]",
              )}
            >
              {label}
            </span>
            {canCancel(r, now) && (
              <Button variant="ghost" size="sm" className="-my-1 h-7 px-2 text-[#E63946] hover:text-[#C92F3B]" onClick={() => onCancel(r)}>
                Cancelar inscripción
              </Button>
            )}
          </div>
        </div>

        <div className="relative hidden size-16 shrink-0 self-center overflow-hidden rounded-xl bg-[#F4F4F5] sm:block">
          {r.image && (
            <Image src={r.image} alt="" fill priority={priority} sizes="64px" className={cn("object-cover", muted && "opacity-60")} />
          )}
        </div>
      </div>
    </article>
  );
}
