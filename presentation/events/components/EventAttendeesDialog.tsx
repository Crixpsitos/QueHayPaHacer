"use client";

import { useState, type ReactNode } from "react";
import { BadgeCheck, Check, Loader2, Search, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/app/components/ui/dialog";
import {
  getEventAttendeesAction,
  type EventAttendeeVM,
} from "@/app/actions/events/get-event-attendees.action";

interface EventAttendeesDialogProps {
  eventId: string;
  eventTitle: string;
  /** Botón disparador (estilado por el llamador). Se usa con `asChild`. */
  trigger: ReactNode;
}

const formatDateTime = (iso: string) =>
  new Intl.DateTimeFormat("es-CO", { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));

const initials = (name: string) => name.slice(0, 2).toUpperCase();

/**
 * Modal de "Inscritos" para el organizador de un evento (pensado para cuentas
 * NO profesionales, que no tienen acceso al Estudio). Muestra la lista de
 * personas inscritas con buen detalle visual y "cargar más" por cursor.
 */
export function EventAttendeesDialog({ eventId, eventTitle, trigger }: EventAttendeesDialogProps) {
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [attendees, setAttendees] = useState<EventAttendeeVM[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [requiresAttendance, setRequiresAttendance] = useState(false);
  const [total, setTotal] = useState(0);
  const [query, setQuery] = useState("");

  const fetchFirstPage = async () => {
    setLoading(true);
    setError(null);
    const res = await getEventAttendeesAction(eventId);
    if (res.success) {
      setAttendees(res.attendees);
      setNextCursor(res.nextCursor);
      setRequiresAttendance(res.requiresAttendance);
      setTotal(res.total);
    } else {
      setError(res.error);
    }
    setLoading(false);
    setLoaded(true);
  };

  const loadMore = async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    const res = await getEventAttendeesAction(eventId, nextCursor);
    if (res.success) {
      setAttendees((prev) => [...prev, ...res.attendees]);
      setNextCursor(res.nextCursor);
    } else {
      setError(res.error);
    }
    setLoadingMore(false);
  };

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next && !loaded) void fetchFirstPage();
  };

  const filtered = query.trim()
    ? attendees.filter((a) => a.name.toLowerCase().includes(query.trim().toLowerCase()))
    : attendees;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="flex max-h-[85vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-xl">
        <DialogHeader className="border-b border-gray-100 px-5 py-4">
          <DialogTitle className="flex items-center gap-2 text-base">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <Users className="h-4 w-4" />
            </span>
            Inscritos
            {!loading && (
              <span className="ml-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
                {total}
              </span>
            )}
          </DialogTitle>
          <DialogDescription className="truncate">
            Personas inscritas a «{eventTitle}».
          </DialogDescription>
        </DialogHeader>

        {/* Búsqueda (filtra lo ya cargado en cliente). */}
        <div className="border-b border-gray-100 px-5 py-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nombre…"
              className="h-9 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-sm outline-none transition-colors focus:border-indigo-400"
            />
          </div>
        </div>

        <div className="min-h-[200px] flex-1 overflow-y-auto px-2 py-2">
          {loading ? (
            <div className="flex flex-col gap-2 px-3 py-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 py-2">
                  <div className="h-9 w-9 animate-pulse rounded-full bg-gray-100" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 w-1/3 animate-pulse rounded bg-gray-100" />
                    <div className="h-2.5 w-1/4 animate-pulse rounded bg-gray-100" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center gap-2 px-6 py-12 text-center">
              <p className="text-sm text-red-600">{error}</p>
              <button
                type="button"
                onClick={() => void fetchFirstPage()}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
              >
                Reintentar
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 px-6 py-14 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-50 text-gray-300">
                <Users className="h-6 w-6" />
              </span>
              <p className="text-sm font-medium text-gray-700">
                {query ? "Sin resultados" : "Aún no hay inscritos"}
              </p>
              <p className="max-w-xs text-xs text-gray-400">
                {query
                  ? "Prueba con otro nombre."
                  : "Cuando alguien se inscriba a tu evento, aparecerá aquí."}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-50">
              {filtered.map((a) => (
                <li key={a.userId} className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-gray-50">
                  <Avatar className="h-9 w-9 border border-gray-200">
                    <AvatarImage src={a.photoURL} alt={a.name} />
                    <AvatarFallback className="bg-indigo-50 text-xs font-semibold text-indigo-700">
                      {initials(a.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1 truncate text-sm font-medium text-gray-900">
                      <span className="truncate">{a.name}</span>
                      {a.verified && (
                        <BadgeCheck
                          className="h-3.5 w-3.5 shrink-0 fill-sky-500 text-white"
                          aria-label="Cuenta profesional verificada"
                        />
                      )}
                      {a.handle && (
                        <span className="shrink-0 text-xs font-normal text-gray-400">@{a.handle}</span>
                      )}
                    </p>
                    <p className="truncate text-xs text-gray-400" suppressHydrationWarning>
                      Inscrito el {formatDateTime(a.registeredAt)}
                    </p>
                  </div>
                  {requiresAttendance &&
                    (a.attendanceConfirmed ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                        <Check className="h-3 w-3" />
                        Asistió
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-500">
                        Pendiente
                      </span>
                    ))}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Pie: cargar más (solo si no estamos filtrando en cliente). */}
        {!loading && !error && nextCursor && !query && (
          <div className="border-t border-gray-100 px-5 py-3">
            <button
              type="button"
              onClick={() => void loadMore()}
              disabled={loadingMore}
              className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-60"
            >
              {loadingMore && <Loader2 className="h-4 w-4 animate-spin" />}
              Cargar más
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
