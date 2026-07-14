"use client";

import type { EventSession } from "@/domain/entities/events/EventSession";
import type { SessionCoverSource } from "@/domain/entities/events/EventSession";
import Image from "next/image";
import { CalendarIcon } from "lucide-react";

interface SessionCoverSelectorProps {
  value: SessionCoverSource;
  onChange: (value: SessionCoverSource) => void;
  parentCoverUrl?: string;
  otherSessions: EventSession[];
  ownImageUrl?: string;
  onUploadOwn: () => void;
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
  const isOther =
    typeof value === "object" && "sessionId" in value;
  const otherSessionId = isOther ? value.sessionId : undefined;

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-gray-900">Portada de la sesión</p>
      <p className="text-xs text-gray-500">
        Elige qué imagen usar como portada para esta sesión.
      </p>

      <div className="grid gap-3 sm:grid-cols-3">
        {/* Heredar del evento padre */}
        <button
          type="button"
          onClick={() => onChange("parent")}
          className={`flex flex-col items-center gap-2 rounded-xl border p-3 text-center transition-colors ${
            isParent
              ? "border-black bg-gray-50"
              : "border-gray-200 hover:border-gray-400"
          }`}
        >
          <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-gray-100">
            {parentCoverUrl ? (
              <Image src={parentCoverUrl} alt="Portada del evento" fill className="object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center">
                <CalendarIcon className="h-5 w-5 text-gray-300" />
              </div>
            )}
          </div>
          <span className="text-xs font-medium text-gray-700">
            Portada del evento
          </span>
        </button>

        {/* Propia */}
        <button
          type="button"
          onClick={() => {
            onChange("own");
            if (!ownImageUrl) onUploadOwn();
          }}
          className={`flex flex-col items-center gap-2 rounded-xl border p-3 text-center transition-colors ${
            isOwn
              ? "border-black bg-gray-50"
              : "border-gray-200 hover:border-gray-400"
          }`}
        >
          <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-gray-100">
            {ownImageUrl ? (
              <Image src={ownImageUrl} alt="Portada propia" fill className="object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-gray-400">
                <span className="text-xs">+ Subir imagen</span>
              </div>
            )}
          </div>
          <span className="text-xs font-medium text-gray-700">
            Portada propia
          </span>
        </button>

        {/* Otra sesión */}
        {otherSessions.length > 0 && (
          <div
            className={`flex flex-col gap-2 rounded-xl border p-3 transition-colors ${
              isOther
                ? "border-black bg-gray-50"
                : "border-gray-200"
            }`}
          >
            <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-gray-100">
              {otherSessionId && (
                (() => {
                  const ref = otherSessions.find((s) => s.id === otherSessionId);
                  return ref?.mainImage?.url ? (
                    <Image src={ref.mainImage.url} alt="Portada de otra sesión" fill className="object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <CalendarIcon className="h-5 w-5 text-gray-300" />
                    </div>
                  );
                })()
              )}
              {!otherSessionId && (
                <div className="flex h-full items-center justify-center">
                  <CalendarIcon className="h-5 w-5 text-gray-300" />
                </div>
              )}
            </div>
            <select
              value={otherSessionId ?? ""}
              onChange={(e) => {
                const id = e.target.value;
                if (id) onChange({ sessionId: id });
              }}
              className="w-full rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-black"
            >
              <option value="">Otra sesión...</option>
              {otherSessions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title ?? `Sesión ${s.id.slice(0, 6)}`}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
}
