"use client";

import Link from "next/link";

import { useRouter } from "next/navigation";
import { CalendarIcon, CalendarRangeIcon, ArrowRight, Lock, X } from "lucide-react";
import { cn } from "@/app/lib/utils/cn";

interface EventTypeSelectorProps {
  isPremium: boolean | undefined;
}

export function EventTypeSelector({ isPremium }: EventTypeSelectorProps) {
  const router = useRouter();

  const handleSelect = (type: "standard" | "multi-date") => {
    if (type === "multi-date" && !isPremium) return;
    const params = new URLSearchParams(window.location.search);
    params.set("type", type);
    router.push(`/eventos/create?${params.toString()}`);
  };

  const isMultiDateLocked = !isPremium;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#FAFAFC] px-4 py-16">
      <div className="w-full max-w-4xl">

        {/* ── Botón salir ─────────────────────────────────────────── */}
        <div className="mb-6 flex justify-start">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-medium text-[#71717A] transition-colors hover:bg-[#F4F4F5] hover:text-[#09090B]"
          >
            <X className="size-4" />
            Salir
          </button>
        </div>

        {/* ── Encabezado ──────────────────────────────────────────── */}
        <div className="mb-12 text-center">
          <div className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-[#FDF2F4] px-3 py-1.5">
            <CalendarIcon className="size-3.5 text-[#D42F3C]" />
            <span className="text-xs font-semibold text-[#D42F3C]">Nuevo evento</span>
          </div>
          <h1
            className="text-3xl font-bold text-[#09090B] sm:text-4xl"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            ¿Qué tipo de evento quieres crear?
          </h1>
          <p className="mt-3 text-base text-[#71717A]">
            Elige cómo se organizarán las fechas y sesiones de tu evento.
          </p>
        </div>

        {/* ── Tarjetas ─────────────────────────────────────────────── */}
        <div className="grid gap-5 sm:grid-cols-2">

          {/* ── Evento estándar ────── */}
          <button
            type="button"
            onClick={() => handleSelect("standard")}
            className="group flex flex-col rounded-2xl border border-[#E4E4E7] bg-white p-7 text-left shadow-card transition-all duration-200 hover:border-[#D42F3C] hover:shadow-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D42F3C] focus-visible:ring-offset-2"
          >
            {/* Icono */}
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FDF2F4] transition-colors duration-200 group-hover:bg-[#D42F3C]">
              <CalendarIcon className="size-7 text-[#D42F3C] transition-colors duration-200 group-hover:text-white" />
            </div>

            {/* Contenido */}
            <div className="flex-1 space-y-2">
              <h2
                className="text-xl font-bold text-[#09090B]"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                Evento estándar
              </h2>
              <p className="text-sm leading-relaxed text-[#71717A]">
                Una sola fecha, hora y lugar. Tu evento tiene un inicio y un fin concretos.
              </p>
            </div>

            {/* Ejemplos */}
            <div className="mt-5 flex flex-wrap gap-1.5">
              {["Conciertos", "Talleres", "Exposiciones", "Conferencias"].map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-[#E4E4E7] bg-[#FAFAFC] px-2.5 py-0.5 text-xs font-medium text-[#71717A] transition-colors group-hover:border-[#FDF2F4] group-hover:bg-[#FDF2F4] group-hover:text-[#D42F3C]"
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* CTA */}
            <div className="mt-6 flex items-center justify-between border-t border-[#F4F4F5] pt-5">
              <span className="text-sm font-semibold text-[#09090B]">
                Empezar con este tipo
              </span>
              <div className="flex size-8 items-center justify-center rounded-full bg-[#F4F4F5] transition-all duration-200 group-hover:bg-[#D42F3C]">
                <ArrowRight className="size-4 text-[#71717A] transition-colors duration-200 group-hover:text-white" />
              </div>
            </div>
          </button>

          {/* ── Evento multi-fecha ──── */}
          <button
            type="button"
            onClick={() => handleSelect("multi-date")}
            disabled={isMultiDateLocked}
            className={cn(
              "group flex flex-col rounded-2xl border p-7 text-left shadow-card transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#09090B] focus-visible:ring-offset-2",
              isMultiDateLocked
                ? "cursor-not-allowed border-[#E4E4E7] bg-white opacity-60"
                : "cursor-pointer border-[#E4E4E7] bg-white hover:border-[#09090B] hover:shadow-hover",
            )}
          >
            {/* Badge Premium */}
            {isMultiDateLocked && (
              <div className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                <Lock className="size-3" />
                Solo Premium
              </div>
            )}

            {/* Icono */}
            <div
              className={cn(
                "mb-6 flex h-14 w-14 items-center justify-center rounded-2xl transition-colors duration-200",
                isMultiDateLocked
                  ? "bg-[#F4F4F5]"
                  : "bg-[#09090B] group-hover:bg-[#18181B]",
              )}
            >
              <CalendarRangeIcon
                className={cn(
                  "size-7",
                  isMultiDateLocked ? "text-[#A1A1AA]" : "text-white",
                )}
              />
            </div>

            {/* Contenido */}
            <div className="flex-1 space-y-2">
              <h2
                className="text-xl font-bold text-[#09090B]"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                Evento multi-fecha
              </h2>
              <p className="text-sm leading-relaxed text-[#71717A]">
                Un mismo evento con varias sesiones independientes en diferentes fechas y lugares.
              </p>
            </div>

            {/* Ejemplos */}
            <div className="mt-5 flex flex-wrap gap-1.5">
              {["Festivales", "Cursos", "Temporadas", "Jornadas"].map((tag) => (
                <span
                  key={tag}
                  className={cn(
                    "rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
                    isMultiDateLocked
                      ? "border-[#E4E4E7] bg-[#FAFAFC] text-[#A1A1AA]"
                      : "border-[#E4E4E7] bg-[#FAFAFC] text-[#71717A] group-hover:border-[#18181B]/20 group-hover:bg-[#09090B]/5 group-hover:text-[#09090B]",
                  )}
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* CTA */}
            <div className="mt-6 flex items-center justify-between border-t border-[#F4F4F5] pt-5">
              <span
                className={cn(
                  "text-sm font-semibold",
                  isMultiDateLocked ? "text-[#A1A1AA]" : "text-[#09090B]",
                )}
              >
                {isMultiDateLocked ? "Requiere plan Premium" : "Empezar con este tipo"}
              </span>
              <div
                className={cn(
                  "flex size-8 items-center justify-center rounded-full transition-all duration-200",
                  isMultiDateLocked
                    ? "bg-amber-50"
                    : "bg-[#F4F4F5] group-hover:bg-[#09090B]",
                )}
              >
                {isMultiDateLocked ? (
                  <Lock className="size-3.5 text-amber-400" />
                ) : (
                  <ArrowRight className="size-4 text-[#71717A] transition-colors duration-200 group-hover:text-white" />
                )}
              </div>
            </div>
          </button>
        </div>

        {/* ── Nota footer ─────────────────────────────────────────── */}
        {isMultiDateLocked && (
          <p className="mt-8 text-center text-sm text-[#52525B]">
            ¿Tu evento tiene varias funciones?{" "}
            <Link href="/premium" className="font-semibold text-[#D42F3C] hover:underline">
              Conoce Premium
            </Link>
          </p>
        )}
        <p className="mt-4 text-center text-xs text-[#A1A1AA]">
          Puedes cambiar el tipo de evento más adelante si lo necesitas.
        </p>
      </div>
    </div>
  );
}
