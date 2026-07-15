"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  BadgeCheck,
  Check,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Download,
  FileText,
  Loader2,
  Trash2,
  UserCheck,
  X,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { cn } from "@/app/lib/utils/cn";
import { notify } from "@/presentation/shared/lib/notify";
import { confirmAttendanceAction } from "@/app/actions/studio/confirm-attendance.action";
import { removeParticipantAction } from "@/app/actions/studio/remove-participant.action";
import { toCsv, downloadCsv } from "../../../lib/csv";
import { EventsSearchInput } from "../EventsSearchInput";
import type { RegistrationRow } from "../../../view-models/StudioEventsViewModel";
import type { RegistrationSortBy } from "@/domain/entities/studio/Studio";

interface RegistrationsTableProps {
  eventId: string;
  /** Si viene, las inscripciones son de una sesión, no del evento padre. */
  sessionId?: string;
  rows: RegistrationRow[];
  /** Orden, límite y búsqueda actuales (vienen de los query params del slot). */
  sortBy: RegistrationSortBy;
  sortDir: "asc" | "desc";
  limit: number;
  query: string;
  /** Cursores de paginación; `null` si no hay página en esa dirección. */
  nextCursor: string | null;
  prevCursor: string | null;
  /** Si el evento lleva control de asistencia (check-in). Si es false, la
   * columna "Asistencia" no se gestiona y muestra "No se requiere". */
  requiresAttendance: boolean;
  withFormResponses?: boolean;
}

const LIMIT_OPTIONS = [10, 25, 50, 100];

const formatDateTime = (iso: string) =>
  new Intl.DateTimeFormat("es-CO", { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));

const initials = (name: string) => name.slice(0, 2).toUpperCase();

export function RegistrationsTable({
  eventId,
  sessionId,
  rows,
  sortBy,
  sortDir,
  limit,
  query,
  nextCursor,
  prevCursor,
  requiresAttendance,
  withFormResponses = false,
}: RegistrationsTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [data, setData] = useState<RegistrationRow[]>(rows);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [responsesRow, setResponsesRow] = useState<RegistrationRow | null>(null);

  // El servidor manda orden/límite/búsqueda/página; cuando cambian, el slot
  // re-fetchea y llegan filas nuevas por props → resincronizamos lo local.
  useEffect(() => {
    setData(rows);
    setSelected(new Set());
  }, [rows]);

  // Construye una URL con overrides; `null` elimina el param.
  const buildHref = (overrides: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(overrides).forEach(([key, value]) => {
      if (value === null) params.delete(key);
      else params.set(key, value);
    });
    const qs = params.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  };

  // Cambiar orden o límite invalida la posición del cursor → vuelve a página 1.
  const replaceResettingCursor = (overrides: Record<string, string>) => {
    const href = buildHref({ ...overrides, cursor: null, direction: null });
    startTransition(() => router.replace(href, { scroll: false }));
  };

  const toggleSort = (key: RegistrationSortBy) => {
    // Mismo campo → invierte dirección; campo nuevo → arranca ascendente.
    const nextDir = key === sortBy && sortDir === "asc" ? "desc" : "asc";
    replaceResettingCursor({ sort: key, dir: nextDir });
  };

  const changeLimit = (n: number) => replaceResettingCursor({ limit: String(n) });

  const formColumns = useMemo(
    () => (withFormResponses ? data[0]?.formResponses?.map((r) => r.label) ?? [] : []),
    [withFormResponses, data],
  );

  const allFilteredSelected = data.length > 0 && data.every((r) => selected.has(r.userId));

  const toggleAll = () =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (allFilteredSelected) data.forEach((r) => next.delete(r.userId));
      else data.forEach((r) => next.add(r.userId));
      return next;
    });

  const toggleOne = (userId: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });

  const confirmOne = async (userId: string) => {
    setData((prev) => prev.map((r) => (r.userId === userId ? { ...r, attendanceConfirmed: true } : r)));
    const res = await confirmAttendanceAction(eventId, userId, sessionId);
    if (!res.success) notify.error(res.error ?? "Error al confirmar.");
  };

  const removeOne = async (userId: string) => {
    setData((prev) => prev.filter((r) => r.userId !== userId));
    setSelected((prev) => {
      const next = new Set(prev);
      next.delete(userId);
      return next;
    });
    const res = await removeParticipantAction(eventId, userId, sessionId);
    if (!res.success) notify.error(res.error ?? "Error al quitar participante.");
    // Refresca los Server Components de la ruta (slot @stats: card "Registros" y
    // gráficas) para que reflejen el contador actualizado. En éxito muestra el
    // valor decrementado; en error restaura la fila desde la verdad del servidor.
    router.refresh();
  };

  const bulkConfirm = async () => {
    const ids = [...selected];
    setData((prev) => prev.map((r) => (selected.has(r.userId) ? { ...r, attendanceConfirmed: true } : r)));
    setSelected(new Set());
    await Promise.all(ids.map((id) => confirmAttendanceAction(eventId, id, sessionId)));
    notify.success(`${ids.length} asistencia(s) confirmada(s).`);
  };

  const bulkRemove = async () => {
    const ids = [...selected];
    setData((prev) => prev.filter((r) => !selected.has(r.userId)));
    setSelected(new Set());
    await Promise.all(ids.map((id) => removeParticipantAction(eventId, id, sessionId)));
    notify.success(`${ids.length} participante(s) removido(s).`);
    // Sincroniza el slot @stats (contador "Registros" y gráficas) con el servidor.
    router.refresh();
  };

  const exportCsv = () => {
    const headers = ["Nombre", "Registrado", "Asistencia", ...formColumns];
    const csvRows = data.map((r) => [
      r.name,
      formatDateTime(r.registeredAt),
      requiresAttendance
        ? r.attendanceConfirmed
          ? "Confirmada"
          : "Pendiente"
        : "No se requiere asistencia",
      ...formColumns.map((label) => r.formResponses?.find((f) => f.label === label)?.value ?? ""),
    ]);
    downloadCsv(`registros-${eventId}.csv`, toCsv(headers, csvRows));
  };

  const hasPagination = Boolean(nextCursor || prevCursor);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-slate-900">
          Registros <span className="font-normal text-slate-400">({data.length})</span>
        </h2>
        <button
          type="button"
          onClick={exportCsv}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 text-xs font-medium text-slate-600 transition-colors hover:bg-gray-50"
        >
          <Download className="h-3.5 w-3.5" />
          Exportar CSV
        </button>
      </div>

      {withFormResponses && (
        <div className="flex items-start gap-2.5 rounded-lg border border-indigo-200 bg-indigo-50/70 px-3 py-2.5">
          <ClipboardList className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />
          <p className="text-xs text-indigo-900">
            Este evento usa <strong>registro por formulario</strong>. Pulsa{" "}
            <span className="font-semibold">&quot;Ver respuestas&quot;</span> en cada fila para ver lo
            que respondió la persona. El CSV exportado incluye todas las respuestas.
          </p>
        </div>
      )}

      {/* Toolbar: búsqueda (server-side, escribe ?q= y resetea el cursor) + límite */}
      <div className="flex flex-wrap items-center gap-2">
        <EventsSearchInput query={query} placeholder="Buscar por nombre…" />
        {isPending && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
        <label className="flex items-center gap-1.5 text-xs text-slate-500">
          Mostrar
          <select
            value={limit}
            onChange={(e) => changeLimit(Number(e.target.value))}
            disabled={isPending}
            className="h-9 rounded-lg border border-gray-200 bg-white px-2 text-sm outline-none focus:border-indigo-400 disabled:opacity-50"
          >
            {LIMIT_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>
      </div>

      {query && (
        <p className="-mt-1 text-xs text-slate-500">
          Mostrando resultados para{" "}
          <span className="font-medium text-slate-700">«{query}»</span>
        </p>
      )}

      {/* Toolbar de acciones masivas */}
      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2">
          <span className="text-xs font-semibold text-indigo-700">{selected.size} seleccionado(s)</span>
          <div className="ml-auto flex items-center gap-2">
            {requiresAttendance && (
              <button
                type="button"
                onClick={() => void bulkConfirm()}
                className="inline-flex h-7 items-center gap-1.5 rounded-md bg-indigo-600 px-2.5 text-xs font-medium text-white hover:bg-indigo-700"
              >
                <UserCheck className="h-3.5 w-3.5" />
                Confirmar asistencia
              </button>
            )}
            <button
              type="button"
              onClick={() => void bulkRemove()}
              className="inline-flex h-7 items-center gap-1.5 rounded-md border border-red-200 bg-white px-2.5 text-xs font-medium text-red-600 hover:bg-red-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Quitar
            </button>
            <button
              type="button"
              onClick={() => setSelected(new Set())}
              className="inline-flex h-7 w-7 items-center justify-center rounded-md text-indigo-500 hover:bg-indigo-100"
              aria-label="Limpiar selección"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="max-h-[560px] overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-white/85 backdrop-blur">
              <tr className="border-b border-gray-200 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                <th className="w-10 px-3 py-2.5">
                  <input
                    type="checkbox"
                    checked={allFilteredSelected}
                    onChange={toggleAll}
                    className="h-4 w-4 cursor-pointer accent-indigo-600"
                    aria-label="Seleccionar todos"
                  />
                </th>
                <th className="px-3 py-2.5">
                  <SortHeader
                    label="Participante"
                    columnKey="name"
                    activeKey={sortBy}
                    dir={sortDir}
                    disabled={isPending}
                    onClick={() => toggleSort("name")}
                  />
                </th>
                <th className="px-3 py-2.5">
                  <SortHeader
                    label="Registrado"
                    columnKey="registeredAt"
                    activeKey={sortBy}
                    dir={sortDir}
                    disabled={isPending}
                    onClick={() => toggleSort("registeredAt")}
                  />
                </th>
                <th className="px-3 py-2.5">Asistencia</th>
                <th className="px-3 py-2.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className={cn(isPending && "opacity-60 transition-opacity")}>
              {data.map((row, i) => (
                <RegistrationRowItem
                  key={row.userId}
                  row={row}
                  zebra={i % 2 === 1}
                  selected={selected.has(row.userId)}
                  requiresAttendance={requiresAttendance}
                  withFormResponses={withFormResponses}
                  onToggleSelect={() => toggleOne(row.userId)}
                  onViewResponses={() => setResponsesRow(row)}
                  onConfirm={() => void confirmOne(row.userId)}
                  onRemove={() => void removeOne(row.userId)}
                />
              ))}
              {data.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-10 text-center text-sm text-slate-400">
                    {query ? "Sin resultados para tu búsqueda." : "No hay registros."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pie: paginación por cursor (Anterior / Siguiente), como "Mis eventos". */}
        {(data.length > 0 || hasPagination) && (
          <div className="flex items-center justify-between gap-2 border-t border-gray-200 px-3 py-2.5">
            <span className="text-xs tabular-nums text-slate-500">
              {data.length} en esta página
            </span>
            <div className="flex items-center gap-1.5">
              <PaginationLink
                href={prevCursor ? buildHref({ cursor: prevCursor, direction: "prev" }) : null}
                direction="prev"
              />
              <PaginationLink
                href={nextCursor ? buildHref({ cursor: nextCursor, direction: "next" }) : null}
                direction="next"
              />
            </div>
          </div>
        )}
      </div>

      {/* Modal de respuestas del formulario */}
      <Dialog open={responsesRow !== null} onOpenChange={(open) => !open && setResponsesRow(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4 text-indigo-600" />
              Respuestas del formulario
            </DialogTitle>
            <DialogDescription>Lo que respondió esta persona al inscribirse.</DialogDescription>
          </DialogHeader>

          {responsesRow && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-slate-50 p-3">
                <Avatar className="h-9 w-9 border border-gray-200">
                  <AvatarImage src={responsesRow.photoURL} alt={responsesRow.name} />
                  <AvatarFallback className="bg-indigo-50 text-xs font-semibold text-indigo-700">
                    {initials(responsesRow.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="flex items-center gap-1 truncate text-sm font-semibold text-slate-900">
                    <span className="truncate">{responsesRow.name}</span>
                    {responsesRow.verified && (
                      <BadgeCheck
                        className="h-3.5 w-3.5 shrink-0 fill-sky-500 text-white"
                        aria-label="Cuenta profesional verificada"
                      />
                    )}
                    {responsesRow.handle && (
                      <span className="text-xs font-normal text-slate-400">
                        @{responsesRow.handle}
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-slate-400" suppressHydrationWarning>
                    Registrado el {formatDateTime(responsesRow.registeredAt)}
                  </p>
                </div>
              </div>

              <dl className="space-y-3">
                {(responsesRow.formResponses ?? []).map((f) => (
                  <div key={f.label} className="rounded-lg border border-gray-100 bg-white p-3">
                    <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                      {f.label}
                    </dt>
                    <dd className="mt-1 text-sm text-slate-800">{f.value}</dd>
                  </div>
                ))}
                {(responsesRow.formResponses ?? []).length === 0 && (
                  <p className="text-sm text-slate-400">Sin respuestas registradas.</p>
                )}
              </dl>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PaginationLink({
  href,
  direction,
}: {
  href: string | null;
  direction: "prev" | "next";
}) {
  const label = direction === "prev" ? "Anterior" : "Siguiente";
  const className = cn(
    "inline-flex h-7 items-center gap-1 rounded-md border border-gray-200 px-2 text-xs font-medium text-slate-600 transition-colors",
    href ? "hover:bg-gray-50" : "cursor-not-allowed opacity-40",
  );

  if (!href) {
    return (
      <span className={className} aria-disabled="true">
        {direction === "prev" && <ChevronLeft className="h-3.5 w-3.5" />}
        {label}
        {direction === "next" && <ChevronRight className="h-3.5 w-3.5" />}
      </span>
    );
  }

  return (
    <Link href={href} scroll={false} className={className}>
      {direction === "prev" && <ChevronLeft className="h-3.5 w-3.5" />}
      {label}
      {direction === "next" && <ChevronRight className="h-3.5 w-3.5" />}
    </Link>
  );
}

function SortHeader({
  label,
  columnKey,
  activeKey,
  dir,
  disabled,
  onClick,
}: {
  label: string;
  columnKey: RegistrationSortBy;
  activeKey: RegistrationSortBy;
  dir: "asc" | "desc";
  disabled: boolean;
  onClick: () => void;
}) {
  const active = columnKey === activeKey;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-sort={active ? (dir === "asc" ? "ascending" : "descending") : "none"}
      className={cn(
        "inline-flex items-center gap-1 transition-colors hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-50",
        active && "text-slate-700",
      )}
    >
      {label}
      {active ? (
        dir === "asc" ? (
          <ArrowUp className="h-3 w-3" />
        ) : (
          <ArrowDown className="h-3 w-3" />
        )
      ) : (
        <ArrowUpDown className="h-3 w-3 opacity-50" />
      )}
    </button>
  );
}

function RegistrationRowItem({
  row,
  zebra,
  selected,
  requiresAttendance,
  withFormResponses,
  onToggleSelect,
  onViewResponses,
  onConfirm,
  onRemove,
}: {
  row: RegistrationRow;
  zebra: boolean;
  selected: boolean;
  requiresAttendance: boolean;
  withFormResponses: boolean;
  onToggleSelect: () => void;
  onViewResponses: () => void;
  onConfirm: () => void;
  onRemove: () => void;
}) {
  return (
    <tr
      className={cn(
        "border-b border-gray-100 transition-colors hover:bg-slate-100/70",
        zebra && "bg-slate-50/50",
        selected && "bg-indigo-50/60",
      )}
    >
      <td className="px-3 py-2.5">
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggleSelect}
          className="h-4 w-4 cursor-pointer accent-indigo-600"
          aria-label={`Seleccionar ${row.name}`}
        />
      </td>
      <td className="px-3 py-2.5">
        <div className="flex items-center gap-2.5">
          <Avatar className="h-7 w-7 border border-gray-200">
            <AvatarImage src={row.photoURL} alt={row.name} />
            <AvatarFallback className="bg-indigo-50 text-[10px] font-semibold text-indigo-700">
              {initials(row.name)}
            </AvatarFallback>
          </Avatar>
          <span className="flex min-w-0 items-center gap-1">
            <span className="truncate font-medium text-slate-800">{row.name}</span>
            {row.verified && (
              <BadgeCheck
                className="h-3.5 w-3.5 shrink-0 fill-sky-500 text-white"
                aria-label="Cuenta profesional verificada"
              />
            )}
            {row.handle && (
              <span className="shrink-0 text-xs font-normal text-slate-400">
                @{row.handle}
              </span>
            )}
          </span>
        </div>
      </td>
      <td className="px-3 py-2.5 text-slate-500" suppressHydrationWarning>
        {formatDateTime(row.registeredAt)}
      </td>
      <td className="px-3 py-2.5">
        {!requiresAttendance ? (
          <span className="text-[11px] text-slate-400">No se requiere</span>
        ) : row.attendanceConfirmed ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
            <Check className="h-3 w-3" />
            Confirmada
          </span>
        ) : (
          <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
            Pendiente
          </span>
        )}
      </td>
      <td className="px-3 py-2.5">
        <div className="flex items-center justify-end gap-1 whitespace-nowrap">
          {withFormResponses && (
            <button
              type="button"
              onClick={onViewResponses}
              className="inline-flex h-7 items-center gap-1 rounded-md border border-indigo-200 bg-indigo-50 px-2 text-xs font-medium text-indigo-700 hover:bg-indigo-100"
            >
              <FileText className="h-3.5 w-3.5" />
              Respuestas
            </button>
          )}
          {requiresAttendance && !row.attendanceConfirmed && (
            <button
              type="button"
              onClick={onConfirm}
              title="Confirmar asistencia"
              aria-label={`Confirmar asistencia de ${row.name}`}
              className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-gray-200 text-slate-500 hover:bg-emerald-50 hover:text-emerald-700"
            >
              <UserCheck className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={onRemove}
            title="Quitar del evento"
            aria-label={`Quitar a ${row.name}`}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-transparent text-slate-400 hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
}
