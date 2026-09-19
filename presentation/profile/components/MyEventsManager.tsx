"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BarChart3, CalendarPlus, Eye, Heart, Pencil, Users } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Skeleton } from "@/app/components/ui/skeleton";
import { useAuth } from "@/app/store/auth/AuthContext";
import { fetchMyProfileData, type MyProfileData } from "@/app/lib/api/profile-fetcher";
import { EventStatusBadge } from "./EventStatusBadge";

export function MyEventsManager() {
  const { user } = useAuth();
  const [data, setData] = useState<MyProfileData | null>(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    fetchMyProfileData().then(setData).catch(() => setHasError(true));
  }, []);

  if (hasError) return <p className="text-sm text-muted-foreground">No pudimos cargar tus eventos.</p>;
  if (!data) return <Skeleton className="h-72 w-full rounded-2xl" />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>Mis eventos</h1>
          <p className="mt-1 text-sm text-muted-foreground">Administra los eventos que estás preparando y publicando.</p>
        </div>
        <Button asChild>
          <Link href="/eventos/create"><CalendarPlus className="size-4" aria-hidden />Crear evento</Link>
        </Button>
      </div>

      {user?.profile?.plan === "premium" && (
        <div className="flex flex-col justify-between gap-4 rounded-2xl border border-primary/20 bg-primary-light p-5 sm:flex-row sm:items-center">
          <div>
            <p className="font-semibold">¿Quieres conocer mejor el rendimiento de tus eventos?</p>
            <p className="mt-1 text-sm text-muted-foreground">Consulta analítica avanzada y herramientas profesionales en Studio.</p>
          </div>
          <Button asChild variant="outline"><Link href="/studio"><BarChart3 className="size-4" aria-hidden />Ir a Studio</Link></Button>
        </div>
      )}

      {data.events.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-14 text-center">
          <p className="font-semibold">Todavía no tienes eventos.</p>
          <p className="mt-1 text-sm text-muted-foreground">Aporta el primero para comenzar tu trayectoria como creador.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {data.events.map((event) => (
            <article key={event.id} className="flex flex-col rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-subtle)]">
              <div className="flex items-start justify-between gap-3">
                <h2 className="line-clamp-2 font-semibold">{event.title}</h2>
                <EventStatusBadge
                  status={
                    event.moderationStatus === "pending_audit"
                      ? "pending_audit"
                      : event.status
                  }
                />
              </div>
              <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{event.description}</p>
              {event.status === "rejected" && event.rejectionReason && (
                <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs leading-relaxed text-red-700">
                  <span className="font-semibold">Motivo:</span> {event.rejectionReason}
                </p>
              )}
              <div className="mt-5 grid grid-cols-3 gap-2 border-y border-border py-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Eye className="size-3.5" />{event.analytics?.views ?? 0}</span>
                <span className="flex items-center gap-1"><Heart className="size-3.5" />{event.analytics?.likes ?? 0}</span>
                <span className="flex items-center gap-1"><Users className="size-3.5" />{event.analytics?.registrations ?? 0}</span>
              </div>
              <Button asChild variant="outline" className="mt-4 w-full">
                <Link href={`/eventos/${event.id}/edit`}><Pencil className="size-4" aria-hidden />Gestionar</Link>
              </Button>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}