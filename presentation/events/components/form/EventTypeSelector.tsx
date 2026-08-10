"use client";

import { useRouter } from "next/navigation";
import { CalendarIcon, CalendarRangeIcon } from "lucide-react";

interface EventTypeSelectorProps {
  /** Si es undefined, aún se está cargando. */
  isProfessional: boolean | undefined;
}

const EVENT_TYPES = [
  {
    type: "standard" as const,
    icon: CalendarIcon,
    title: "Evento estándar",
    description:
      "Un solo lugar, fecha y hora. Perfecto para conciertos, talleres, exposiciones, etc.",
    available: true,
  },
  {
    type: "multi-date" as const,
    icon: CalendarRangeIcon,
    title: "Evento multi-fecha",
    description:
      "El mismo evento con varias sesiones en distintas fechas (ej: 7 de dic, 24 de dic, 31 de dic). Exclusivo para cuentas profesionales.",
    available: undefined as boolean | undefined, // se resuelve según isProfessional
  },
];

export function EventTypeSelector({ isProfessional }: EventTypeSelectorProps) {
  const router = useRouter();

  const handleSelect = (type: "standard" | "multi-date") => {
    if (type === "multi-date" && !isProfessional) return;
    const params = new URLSearchParams(window.location.search);
    params.set("type", type);
    router.push(`/eventos/create?${params.toString()}`);
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <div className="mb-10 text-center">
        <h1 className="text-2xl font-semibold text-gray-900">
          ¿Qué tipo de evento quieres crear?
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          Elige el formato que mejor describe tu evento.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {EVENT_TYPES.map(({ type, icon: Icon, title, description }) => {
          const isMultiDate = type === "multi-date";
          const isDisabled = isMultiDate && !isProfessional;

          return (
            <button
              key={type}
              type="button"
              disabled={isDisabled}
              onClick={() => handleSelect(type)}
              className={`group flex flex-col gap-4 rounded-xl border p-6 text-left transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-black ${
                isDisabled
                  ? "cursor-not-allowed border-amber-300 bg-amber-50/60 opacity-70"
                  : "cursor-pointer border-gray-200 hover:border-black hover:shadow-sm"
              }`}
            >
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                  isDisabled ? "bg-amber-100" : "bg-gray-100 group-hover:bg-black group-hover:text-white"
                } transition-colors`}
              >
                <Icon className="h-5 w-5" />
              </div>

              <div>
                <p className="font-semibold text-gray-900">{title}</p>
                <p className="mt-1 text-sm text-gray-500">{description}</p>

                {isDisabled && (
                  <p className="mt-2 text-xs font-medium text-amber-600">
                    Solo disponible para cuentas profesionales
                  </p>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
