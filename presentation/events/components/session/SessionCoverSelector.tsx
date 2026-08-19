"use client";

import { useState, useRef, useEffect } from "react";
import type { EventSession, SessionCoverSource } from "@/domain/entities/events/EventSession";
import Image from "next/image";
import { CalendarIcon, ChevronDownIcon, CopyIcon, ImageIcon, TriangleAlertIcon } from "lucide-react";
import { cn } from "@/app/lib/utils/cn";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface SessionCoverSelectorProps {
  value: SessionCoverSource;
  onChange: (value: SessionCoverSource) => void;
  parentCoverUrl?: string;
  otherSessions: EventSession[];
  ownImageUrl?: string;
  onUploadOwn: () => void;
}

/** Resuelve la URL de portada efectiva de una sesión (sin recursión infinita). */
function resolveSessionCover(
  session: EventSession,
  parentCoverUrl?: string,
  siblings?: EventSession[],
): string | undefined {
  if (session.coverSource === "own") return session.mainImage?.url;
  if (session.coverSource === "parent") return parentCoverUrl;
  const cs = session.coverSource;
  if (typeof cs === "object" && "sessionId" in cs) {
    const ref = siblings?.find((s) => s.id === cs.sessionId);
    if (ref) return ref.coverSource === "own" ? ref.mainImage?.url : parentCoverUrl;
  }
  return undefined;
}

function formatSessionDate(session: EventSession): string {
  if (!session.startDate) return "";
  try {
    return format(new Date(session.startDate), "d MMM · HH:mm", { locale: es });
  } catch {
    return "";
  }
}

export function SessionCoverSelector({
  value,
  onChange,
  parentCoverUrl,
  otherSessions,
  ownImageUrl,
  onUploadOwn,
}: SessionCoverSelectorProps) {
  const isOwn = value === "own";
  const isParent = value === "parent";
  const isOther = typeof value === "object" && "sessionId" in value;
  const selectedSessionId = isOther ? value.sessionId : undefined;
  const selectedSession = selectedSessionId
    ? otherSessions.find((s) => s.id === selectedSessionId)
    : undefined;

  // Detectar sessionId inválido (fue eliminada la sesión referenciada)
  const isInvalidSelection = isOther && selectedSessionId && !selectedSession;

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    if (!dropdownOpen) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [dropdownOpen]);

  // Cerrar con Escape
  useEffect(() => {
    if (!dropdownOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDropdownOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [dropdownOpen]);

  // Limpiar selección inválida automáticamente
  useEffect(() => {
    if (isInvalidSelection) onChange("parent");
  }, [isInvalidSelection, onChange]);

  const mainOptions = [
    {
      id: "parent" as const,
      label: "Portada del evento",
      description: "Usa la imagen principal del evento padre.",
      icon: <CalendarIcon className="size-4" />,
      thumb: parentCoverUrl,
      selected: isParent,
      onSelect: () => onChange("parent"),
    },
    {
      id: "own" as const,
      label: "Portada propia",
      description: "Sube una imagen exclusiva para esta sesión.",
      icon: <ImageIcon className="size-4" />,
      thumb: ownImageUrl,
      selected: isOwn,
      onSelect: () => { onChange("own"); if (!ownImageUrl) onUploadOwn(); },
    },
  ];

  const hasOtherSessions = otherSessions.length > 0;

  return (
    <div className="space-y-3">
      {/* Opciones principales */}
      <div className="flex flex-col gap-2 sm:flex-row">
        {mainOptions.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={opt.onSelect}
            className={cn(
              "flex flex-1 items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all",
              opt.selected
                ? "border-[#E63946] bg-[#FDF2F4]"
                : "border-[#E4E4E7] bg-white hover:bg-[#FAFAFC] hover:border-[#A1A1AA]",
            )}
          >
            <div className="relative h-10 w-14 shrink-0 overflow-hidden rounded-lg border border-[#F4F4F5] bg-[#F4F4F5]">
              {opt.thumb ? (
                <Image src={opt.thumb} alt={opt.label} fill sizes="56px" className="object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-[#A1A1AA]">
                  {opt.icon}
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className={cn("text-sm font-semibold", opt.selected ? "text-[#E63946]" : "text-[#09090B]")}>
                {opt.label}
              </p>
              <p className="text-xs text-[#71717A] leading-snug">{opt.description}</p>
            </div>
          </button>
        ))}

        {/* Botón "De otra sesión" — siempre presente, deshabilitado si no hay sesiones */}
        <button
          type="button"
          onClick={() => {
            if (!hasOtherSessions) return;
            // Al seleccionar por primera vez, no pre-seleccionar ninguna sesión.
            if (!isOther) onChange({ sessionId: "" });
            setDropdownOpen(true);
          }}
          disabled={!hasOtherSessions}
          aria-label="De otra sesión"
          className={cn(
            "flex flex-1 items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all",
            isOther
              ? "border-[#E63946] bg-[#FDF2F4]"
              : hasOtherSessions
                ? "border-[#E4E4E7] bg-white hover:bg-[#FAFAFC] hover:border-[#A1A1AA]"
                : "border-[#F4F4F5] bg-[#FAFAFC] opacity-50 cursor-not-allowed",
          )}
        >
          {/* Thumbnail: portada de la sesión seleccionada, o ícono genérico */}
          <div className="relative h-10 w-14 shrink-0 overflow-hidden rounded-lg border border-[#F4F4F5] bg-[#F4F4F5]">
            {selectedSession ? (
              (() => {
                const url = resolveSessionCover(selectedSession, parentCoverUrl, otherSessions);
                return url ? (
                  <Image src={url} alt={selectedSession.title ?? "Sesión"} fill sizes="56px" className="object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-[#A1A1AA]">
                    <CopyIcon className="size-4" />
                  </div>
                );
              })()
            ) : (
              <div className="flex h-full items-center justify-center text-[#A1A1AA]">
                <CopyIcon className="size-4" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className={cn("text-sm font-semibold", isOther ? "text-[#E63946]" : "text-[#09090B]")}>
              {selectedSession?.title?.trim() ? selectedSession.title : "De otra sesión"}
            </p>
            <p className="text-xs text-[#71717A] leading-snug">
              {selectedSession
                ? (formatSessionDate(selectedSession) || "Reutilizar portada de otra sesión")
                : hasOtherSessions
                  ? "Reutiliza la portada de otra sesión."
                  : "No hay otras sesiones disponibles."}
            </p>
          </div>
        </button>
      </div>

      {/* Picker visual de sesiones (solo cuando "De otra sesión" está activo) */}
      {isOther && (
        <div ref={dropdownRef} className="relative">
          {/* Trigger del picker */}
          <button
            type="button"
            onClick={() => setDropdownOpen((v) => !v)}
            aria-expanded={dropdownOpen}
            aria-haspopup="listbox"
            className={cn(
              "flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all",
              dropdownOpen
                ? "border-[#E63946] bg-white shadow-sm"
                : "border-[#E4E4E7] bg-white hover:border-[#A1A1AA]",
            )}
          >
            {/* Thumbnail de la sesión seleccionada */}
            <div className="relative h-9 w-12 shrink-0 overflow-hidden rounded-lg bg-[#F4F4F5]">
              {selectedSession ? (
                (() => {
                  const url = resolveSessionCover(selectedSession, parentCoverUrl, otherSessions);
                  return url ? (
                    <Image src={url} alt="" fill sizes="48px" className="object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-[#A1A1AA]">
                      <CopyIcon className="size-3.5" />
                    </div>
                  );
                })()
              ) : (
                <div className="flex h-full items-center justify-center text-[#A1A1AA]">
                  <CopyIcon className="size-3.5" />
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              {selectedSession ? (
                <>
                  <p className="text-sm font-semibold text-[#09090B] truncate">
                    {selectedSession.title?.trim() || `Sesión ${selectedSession.id.slice(0, 6)}`}
                  </p>
                  {formatSessionDate(selectedSession) && (
                    <p className="text-xs text-[#71717A]">{formatSessionDate(selectedSession)}</p>
                  )}
                </>
              ) : (
                <p className="text-sm text-[#A1A1AA]">Selecciona la sesión cuya portada quieres reutilizar</p>
              )}
            </div>

            <ChevronDownIcon
              className={cn(
                "size-4 shrink-0 text-[#71717A] transition-transform",
                dropdownOpen && "rotate-180",
              )}
            />
          </button>

          {/* Dropdown de opciones */}
          {dropdownOpen && (
            <ul
              role="listbox"
              aria-label="Seleccionar sesión"
              className="absolute left-0 right-0 top-full z-30 mt-1 overflow-hidden rounded-xl border border-[#E4E4E7] bg-white shadow-card"
            >
              {otherSessions.length === 0 ? (
                <li className="px-4 py-5 text-center text-sm text-[#71717A]">
                  No hay otras sesiones disponibles.
                </li>
              ) : (
                otherSessions.map((sess) => {
                  const coverUrl = resolveSessionCover(sess, parentCoverUrl, otherSessions);
                  const isSelected = sess.id === selectedSessionId;
                  const date = formatSessionDate(sess);
                  return (
                    <li key={sess.id}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => {
                          onChange({ sessionId: sess.id });
                          setDropdownOpen(false);
                        }}
                        className={cn(
                          "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors",
                          isSelected
                            ? "bg-[#FDF2F4] text-[#E63946]"
                            : "hover:bg-[#FAFAFC] text-[#09090B]",
                        )}
                      >
                        <div className="relative h-10 w-14 shrink-0 overflow-hidden rounded-lg bg-[#F4F4F5]">
                          {coverUrl ? (
                            <Image src={coverUrl} alt="" fill sizes="56px" className="object-cover" />
                          ) : (
                            <div className="flex h-full items-center justify-center text-[#A1A1AA]">
                              <CopyIcon className="size-3.5" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold truncate">
                            {sess.title?.trim() || `Sesión ${sess.id.slice(0, 6)}`}
                          </p>
                          {date && <p className="text-xs text-[#71717A]">{date}</p>}
                        </div>
                        {isSelected && (
                          <span className="shrink-0 text-xs font-semibold text-[#E63946]">✓</span>
                        )}
                      </button>
                    </li>
                  );
                })
              )}
            </ul>
          )}

          {/* Error: no hay sesión seleccionada */}
          {!selectedSessionId && (
            <p className="mt-1.5 flex items-center gap-1.5 text-xs text-amber-700">
              <TriangleAlertIcon className="size-3.5 shrink-0" />
              Selecciona la sesión cuya portada quieres reutilizar.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
