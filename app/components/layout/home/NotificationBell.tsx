"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Bell, BadgeCheck, Bus, CalendarDays, CalendarPlus, MailPlus, MapPin, MessageSquareDiff, UserCheck, UserMinus, UserPlus, UserX, Users, XIcon } from "lucide-react";

import { getUnreadNotificationsCountAction } from "@/app/actions/notifications/get-unread-notifications-count.action";
import { listNotificationsAction } from "@/app/actions/notifications/list-notifications.action";
import { markNotificationsReadAction } from "@/app/actions/notifications/mark-notifications-read.action";
import type { NotificationItem, NotificationType } from "@/domain/entities/notification/Notification";
import { useAuth } from "@/app/store/auth/AuthContext";
import { useMediaQuery } from "@/app/lib/hooks/useMediaQuery";
import { cn } from "@/app/lib/utils/cn";
import { Button } from "../../ui/button/button";
import { Popover, PopoverContent, PopoverTrigger } from "../../ui/popover";
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "../../ui/drawer";

const ICONS: Record<NotificationType, typeof Bell> = {
  invitation_received: MailPlus,
  invitation_accepted: UserCheck,
  invitation_declined: UserX,
  team_added: UserPlus,
  team_removed: UserMinus,
  team_role_changed: Users,
  suggestion_received: MessageSquareDiff,
  suggestion_resolved: MessageSquareDiff,
  claim_resolved: BadgeCheck,
  event_moderation: CalendarDays,
  site_moderation: MapPin,
  transit_outdated: Bus,
  event_at_site: CalendarPlus,
};

const TITLE = "Notificaciones";
const DESCRIPTION = "Avisos de tus eventos, sitios e invitaciones.";

const rtf = new Intl.RelativeTimeFormat("es", { numeric: "auto" });
function timeAgo(ms: number) {
  const minutes = Math.round((ms - Date.now()) / 60000);
  if (Math.abs(minutes) < 1) return "ahora";
  if (Math.abs(minutes) < 60) return rtf.format(minutes, "minute");
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return rtf.format(hours, "hour");
  return rtf.format(Math.round(hours / 24), "day");
}

function Row({ n, onNavigate }: { n: NotificationItem; onNavigate: () => void }) {
  const Icon = ICONS[n.type] ?? Bell;
  const content = (
    <>
      <span aria-hidden className={cn("mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full", n.read ? "bg-muted text-muted-foreground" : "bg-[#FDF2F4] text-[#E63946]")}>
        <Icon className="size-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className={cn("block text-sm leading-snug [overflow-wrap:anywhere]", n.read ? "text-foreground/80" : "font-semibold text-foreground")}>
          {!n.read && <span className="sr-only">Nueva: </span>}
          {n.title}
        </span>
        {n.body && <span className="mt-0.5 block text-xs leading-snug text-muted-foreground [overflow-wrap:anywhere]">{n.body}</span>}
        <span className="mt-1 block text-xs text-muted-foreground/80">{timeAgo(n.createdAt)}</span>
      </span>
    </>
  );
  const cls = "flex min-h-14 items-start gap-3 rounded-xl px-2 py-2.5 text-left transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";
  return (
    <li>
      {n.href ? (
        <Link href={n.href} onClick={onNavigate} className={cls}>{content}</Link>
      ) : (
        <div className={cls}>{content}</div>
      )}
    </li>
  );
}

function List({ items, onNavigate }: { items: NotificationItem[] | null; onNavigate: () => void }) {
  if (!items) {
    return (
      <div aria-hidden className="grid gap-3 p-2">
        {[0, 1, 2].map((i) => <div key={i} className="h-14 animate-pulse rounded-xl bg-muted" />)}
      </div>
    );
  }
  if (items.length === 0) {
    return <p className="px-4 py-10 text-center text-sm text-muted-foreground">Aún no tienes avisos. Aquí verás invitaciones, revisiones de tus eventos y sitios, y respuestas a tus sugerencias.</p>;
  }
  return <ul className="grid grid-cols-[minmax(0,1fr)] gap-0.5">{items.map((n) => <Row key={n.id} n={n} onNavigate={onNavigate} />)}</ul>;
}

/** Campanita de avisos (`compact`: flotante sobre el mapa). Escritorio: popover; móvil: drawer. Al cerrar se marcan como leídos. */
export function NotificationBell({ compact = false }: { compact?: boolean } = {}) {
  const { user } = useAuth();
  const uid = user?.uid;
  const isMobile = useMediaQuery("(max-width: 767px)");
  const [rawUnread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[] | null>(null);
  const unread = uid ? rawUnread : 0;

  const refreshCount = useCallback(() => {
    void getUnreadNotificationsCountAction().then(setUnread).catch(() => {});
  }, []);

  // Al cargar y al volver a la pestaña (sin tiempo real: ver docs).
  useEffect(() => {
    if (!uid) return;
    refreshCount();
    const onVisible = () => document.visibilityState === "visible" && refreshCount();
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [uid, refreshCount]);

  if (!uid) return null;

  const onOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) {
      setItems(null);
      void listNotificationsAction().then((res) => setItems(res.success ? res.items : [])).catch(() => setItems([]));
      return;
    }
    // Al cerrar quedan leídas; la lista mostrada ya no se vuelve a abrir con el estado viejo.
    if (unread > 0) {
      setUnread(0);
      void markNotificationsReadAction();
    }
  };
  const close = () => onOpenChange(false);

  const trigger = (
    <Button
      variant="outline"
      size="icon-sm"
      aria-label={unread > 0 ? `Notificaciones, ${unread} sin leer` : "Notificaciones"}
      className={cn("relative size-9", compact && "size-11 rounded-full border-border bg-background/95 p-0 shadow-md backdrop-blur")}
      onClick={isMobile ? () => onOpenChange(true) : undefined}
    >
      <Bell className="size-4" aria-hidden="true" />
      {unread > 0 && (
        <span aria-hidden className="absolute -right-1 -top-1 flex min-w-4.5 items-center justify-center rounded-full border-2 border-background bg-[#E63946] px-1 text-[10px] font-bold leading-4 text-white">
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </Button>
  );

  if (isMobile) {
    return (
      <>
        {trigger}
        <Drawer open={open} onOpenChange={onOpenChange}>
          <DrawerContent className="max-h-[85dvh]">
            <DrawerClose asChild>
              <Button variant="ghost" size="icon" aria-label="Cerrar" className="absolute top-3 right-3 z-10 size-11 bg-secondary">
                <XIcon />
              </Button>
            </DrawerClose>
            <DrawerHeader className="pr-14 group-data-[vaul-drawer-direction=bottom]/drawer-content:text-left">
              <DrawerTitle>{TITLE}</DrawerTitle>
              <DrawerDescription>{DESCRIPTION}</DrawerDescription>
            </DrawerHeader>
            <div className="overflow-y-auto overscroll-contain px-2 pb-6">
              <List items={items} onNavigate={close} />
            </div>
          </DrawerContent>
        </Drawer>
      </>
    );
  }

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent align="end" sideOffset={8} className="max-h-[70dvh] w-[22rem] gap-0 overflow-y-auto rounded-2xl p-2">
        <p className="px-2 pb-2 pt-1 text-sm font-semibold">{TITLE}</p>
        <List items={items} onNavigate={close} />
      </PopoverContent>
    </Popover>
  );
}
