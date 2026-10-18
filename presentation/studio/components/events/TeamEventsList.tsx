import Image from "next/image";
import Link from "next/link";
import { CalendarDays, ImageIcon } from "lucide-react";
import { cn } from "@/app/lib/utils/cn";
import { TEAM_ROLE_LABEL, type TeamRole } from "@/domain/entities/events/teamAccess";

export interface TeamEventRow {
  id: string;
  title: string;
  startDate: Date | null;
  mainImage?: string;
  status: string;
  role: TeamRole;
}

const formatDate = (d: Date | null) =>
  d ? new Intl.DateTimeFormat("es-CO", { timeZone: "America/Bogota", dateStyle: "medium" }).format(d) : "Sin fecha";

/** Eventos de otras personas donde la sesión es parte del equipo. La tarjeta lleva al Studio del evento (el servidor valida el rol). */
export function TeamEventsList({
  events,
  title = "Eventos del equipo",
  description = "Eventos de otras personas en los que participas. Tu rol define lo que puedes hacer en cada uno.",
  as: Heading = "h2",
}: {
  events: TeamEventRow[];
  title?: string;
  description?: string;
  as?: "h1" | "h2";
}) {
  return (
    <section aria-labelledby="eventos-equipo" className="space-y-4">
      <div>
        <Heading
          id="eventos-equipo"
          className={cn("font-bold tracking-tight text-slate-900", Heading === "h1" ? "text-2xl" : "text-lg")}
        >
          {title}
        </Heading>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>

      {events.length === 0 ? (
        <p className="rounded-xl border border-dashed border-gray-200 bg-white px-4 py-10 text-center text-sm text-slate-500">
          Todavía no participas en eventos de otras personas.
        </p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {events.map((e) => {
            const published = e.status.toLowerCase() === "published";
            return (
              <li key={e.id}>
                <Link
                  href={`/studio/events/${e.id}`}
                  className="group flex h-full items-stretch gap-3 rounded-xl border border-gray-200 bg-white p-3 transition-colors hover:border-primary/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  <span className="relative size-20 shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-slate-100">
                    {e.mainImage ? (
                      <Image src={e.mainImage} alt="" fill sizes="80px" className="object-cover" />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center">
                        <ImageIcon className="size-4 text-slate-300" aria-hidden />
                      </span>
                    )}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col justify-between gap-2">
                    <span className="line-clamp-2 font-semibold text-slate-900 group-hover:text-primary">{e.title}</span>
                    <span className="flex items-center gap-1.5 text-xs text-slate-500" suppressHydrationWarning>
                      <CalendarDays className="size-3.5 text-slate-400" aria-hidden />
                      {formatDate(e.startDate)}
                    </span>
                    <span className="flex flex-wrap items-center gap-1.5">
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                          published ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600",
                        )}
                      >
                        {published ? "Publicado" : "Borrador"}
                      </span>
                      <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-semibold text-zinc-700">
                        {TEAM_ROLE_LABEL[e.role]}
                      </span>
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
