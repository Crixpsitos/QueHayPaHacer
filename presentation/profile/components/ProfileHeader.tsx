"use client";

// ─────────────────────────────────────────────────────────────────
//  ProfileHeader — perfil público moderno con jerarquía visual
// ─────────────────────────────────────────────────────────────────

import { useAuth } from "@/app/store/auth/AuthContext";
import { Suspense, use, useEffect, useMemo, useRef, useState } from "react";
import { ProfileAvatar } from "./ProfileAvatar";
import {
  AlertCircle,
  AtSign,
  Award,
  Briefcase,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Construction,
  ExternalLink,
  Globe,
  Hash,
  Landmark,
  Loader2,
  Mail,
  MapPin,
  Medal,
  Phone,
  Sparkles,
  Store,
  Tag,
  Users,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { useProfileConfigStore } from "@/app/store/profile/profileConfig.store";
import { ProfileStats } from "./ProfileStats";
import { ShareProfileButton } from "./ShareProfileButton";
import { createClientContainer } from "@/infraestructure/di/container.client";
import type { UserBadge } from "@/domain/repository/profile/IProfileRepository";
import { BUSINESS_CATEGORY_LABEL, isProfessionalType } from "../lib/professionalType";
import { cn } from "@/app/lib/utils/cn";
import type {
  BusinessDetails,
  GovernmentDetails,
  OrganizerDetails,
} from "@/domain/entities/professional/ProfessionalRequest";
import type { SocialLinkEntry } from "@/domain/entities/user/User";
import { getMySitesAction } from "@/app/actions/sites/get-my-sites.action";
import Image from "next/image";
import { ProfileBanner } from "./ProfileBanner";

const { authService } = createClientContainer();

// ── Plataformas sociales ──────────────────────────────────────────

const SOCIAL_META: Record<
  string,
  { label: string; color: string; bg: string; border: string }
> = {
  instagram: {
    label: "Instagram",
    color: "text-rose-600",
    bg: "bg-rose-50",
    border: "border-rose-200",
  },
  facebook: {
    label: "Facebook",
    color: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-200",
  },
  tiktok: {
    label: "TikTok",
    color: "text-zinc-800",
    bg: "bg-zinc-50",
    border: "border-zinc-200",
  },
  youtube: {
    label: "YouTube",
    color: "text-red-600",
    bg: "bg-red-50",
    border: "border-red-200",
  },
  twitter: {
    label: "X / Twitter",
    color: "text-sky-600",
    bg: "bg-sky-50",
    border: "border-sky-200",
  },
  linkedin: {
    label: "LinkedIn",
    color: "text-blue-800",
    bg: "bg-blue-50",
    border: "border-blue-200",
  },
  other: {
    label: "Enlace",
    color: "text-muted-foreground",
    bg: "bg-muted/60",
    border: "border-border",
  },
};

// ── Tipos ─────────────────────────────────────────────────────────

interface ProfileHeaderProps {
  statsPromise: (uid: string) => Promise<{
    eventsCount: number;
    sitesCount: number;
    badgesCount: number;
  }>;
  badgesPromise: (uid: string) => Promise<UserBadge[]>;
}

// ─────────────────────────────────────────────────────────────────
//  Sub-componentes
// ─────────────────────────────────────────────────────────────────

/** Chip de contacto para email y teléfono */
function ContactChip({
  href,
  icon: Icon,
  label,
  external = false,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  label: string;
  external?: boolean;
}) {
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      aria-label={external ? `${label} — abre en nueva pestaña` : label}
      className="inline-flex items-center gap-1.5 rounded-lg bg-muted/60 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Icon className="size-3.5 shrink-0 opacity-60" aria-hidden />
      <span className="max-w-[200px] truncate">{label}</span>
    </a>
  );
}

/** Action tile para enlace de ubicación */
function MapTile({ href }: { href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Ver ubicación en el mapa — abre en nueva pestaña"
      className="group flex items-center gap-3 rounded-xl border border-border bg-card px-3.5 py-3 shadow-sm transition-all hover:border-primary/25 hover:bg-primary/[0.03] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/15"
        aria-hidden
      >
        <MapPin className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground">Ubicación</p>
        <p className="text-xs text-muted-foreground">Ver en el mapa</p>
      </div>
      <ExternalLink
        className="size-3.5 shrink-0 text-muted-foreground/30 transition-colors group-hover:text-primary/40"
        aria-hidden
      />
    </a>
  );
}

/** Action tile para sitio web */
function WebTile({ href, hostname }: { href: string; hostname: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Visitar ${hostname} — abre en nueva pestaña`}
      className="group flex items-center gap-3 rounded-xl border border-border bg-card px-3.5 py-3 shadow-sm transition-all hover:border-border/80 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors group-hover:bg-muted/70"
        aria-hidden
      >
        <Globe className="size-4" />
      </div>
      <div className="min-w-0 flex-1 overflow-hidden">
        <p className="text-sm font-semibold text-foreground">Sitio web</p>
        <p className="truncate text-xs text-muted-foreground">{hostname}</p>
      </div>
      <ExternalLink
        className="size-3.5 shrink-0 text-muted-foreground/30 transition-colors group-hover:text-muted-foreground/60"
        aria-hidden
      />
    </a>
  );
}

/** Iconos de plataformas sociales (Simple Icons, CC0) */
function SocialIcon({ platform }: { platform: string }) {
  const cls = "size-4 fill-current";
  switch (platform) {
    case "instagram":
      return (
        <svg viewBox="0 0 24 24" className={cls} aria-hidden>
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
        </svg>
      );
    case "facebook":
      return (
        <svg viewBox="0 0 24 24" className={cls} aria-hidden>
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      );
    case "tiktok":
      return (
        <svg viewBox="0 0 24 24" className={cls} aria-hidden>
          <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
        </svg>
      );
    case "youtube":
      return (
        <svg viewBox="0 0 24 24" className={cls} aria-hidden>
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      );
    case "twitter":
      return (
        <svg viewBox="0 0 24 24" className={cls} aria-hidden>
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.742l7.737-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      );
    case "linkedin":
      return (
        <svg viewBox="0 0 24 24" className={cls} aria-hidden>
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.14-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
      );
    default:
      return <ExternalLink className="size-4" aria-hidden />;
  }
}

/** Tile de red social con color de plataforma */
function SocialTile({ link }: { link: SocialLinkEntry }) {
  const meta = SOCIAL_META[link.platform] ?? SOCIAL_META.other;
  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${meta.label} — abre en nueva pestaña`}
      className={cn(
        "group flex items-center gap-2 rounded-lg border px-2.5 py-2 transition-all hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        meta.bg,
        meta.border,
      )}
    >
      <span
        className={cn(
          "flex h-5 w-5 shrink-0 items-center justify-center",
          meta.color,
        )}
        aria-hidden
      >
        <SocialIcon platform={link.platform} />
      </span>
      <span className={cn("truncate text-xs font-semibold", meta.color)}>
        {meta.label}
      </span>
      <ExternalLink
        className={cn(
          "ml-auto size-3 shrink-0 opacity-0 transition-opacity group-hover:opacity-50",
          meta.color,
        )}
        aria-hidden
      />
    </a>
  );
}

/** Pill de metadata (NIT, categoría, tipo organizador) */
function MetaPill({
  icon: Icon,
  label,
  prominent = false,
}: {
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  label: string;
  /** Usa foreground/card en lugar de muted para información destacada */
  prominent?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium",
        prominent
          ? "border-border/80 bg-card text-foreground/80 shadow-sm"
          : "border-border bg-muted/50 text-muted-foreground",
      )}
    >
      <Icon
        className={cn("size-3 shrink-0", prominent ? "opacity-75" : "opacity-60")}
        aria-hidden
      />
      {label}
    </span>
  );
}

/** Bloque de actividad profesional con acento de marca */
function ProfessionalDescriptionBlock({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = text.length > 200;
  return (
    <div className="overflow-hidden rounded-xl border border-primary/20 bg-primary/[0.04]">
      <div className="flex items-center gap-2 border-b border-primary/10 bg-primary/[0.03] px-4 py-2.5">
        <Sparkles className="size-3.5 shrink-0 text-primary/60" aria-hidden />
        <span className="text-[10px] font-semibold uppercase tracking-widest text-primary/55">
          Actividad profesional
        </span>
      </div>
      <div className="px-4 py-3.5">
        <p
          className={cn(
            "text-sm leading-relaxed text-foreground/80",
            !expanded && isLong && "line-clamp-3",
          )}
        >
          {text}
        </p>
        {isLong && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="mt-2 inline-flex items-center gap-0.5 text-xs font-medium text-primary/70 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-expanded={expanded}
          >
            {expanded ? "Ver menos" : "Ver más"}
            <ChevronDown
              className={cn(
                "size-3.5 transition-transform duration-200",
                expanded && "rotate-180",
              )}
              aria-hidden
            />
          </button>
        )}
      </div>
    </div>
  );
}

/** Bloque de información institucional para cuentas de gobierno */
function GovernmentInfoBlock({ details }: { details: GovernmentDetails }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border/60 bg-muted/[0.08]">
      <div className="flex items-center gap-2 border-b border-border/40 bg-muted/20 px-4 py-2.5">
        <Landmark className="size-3.5 shrink-0 text-muted-foreground/60" aria-hidden />
        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/55">
          Información institucional
        </span>
      </div>
      <div className="divide-y divide-border/30 px-4">
        <div className="flex items-start gap-3 py-3">
          <Building2 className="mt-0.5 size-4 shrink-0 text-muted-foreground/50" aria-hidden />
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/45">
              Dependencia
            </p>
            <p className="text-sm font-medium text-foreground/85">{details.department}</p>
          </div>
        </div>
        {details.institutionalEmail && (
          <div className="flex items-start gap-3 py-3">
            <Mail className="mt-0.5 size-4 shrink-0 text-muted-foreground/50" aria-hidden />
            <div className="min-w-0 overflow-hidden">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/45">
                Correo institucional
              </p>
              <a
                href={`mailto:${details.institutionalEmail}`}
                className="truncate text-sm font-medium text-foreground/80 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label={`Enviar correo a ${details.institutionalEmail}`}
              >
                {details.institutionalEmail}
              </a>
            </div>
          </div>
        )}
        {details.institutionalPhone && (
          <div className="flex items-start gap-3 py-3">
            <Phone className="mt-0.5 size-4 shrink-0 text-muted-foreground/50" aria-hidden />
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/45">
                Teléfono institucional
              </p>
              <a
                href={`tel:${details.institutionalPhone}`}
                className="text-sm font-medium text-foreground/80 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label={`Llamar al ${details.institutionalPhone}`}
              >
                {details.institutionalPhone}
              </a>
            </div>
          </div>
        )}
        {details.nit && (
          <div className="flex items-start gap-3 py-3">
            <Hash className="mt-0.5 size-4 shrink-0 text-muted-foreground/50" aria-hidden />
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/45">
                NIT
              </p>
              <p className="text-sm font-medium text-foreground/85">{details.nit}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/** Sección de insignias con empty state elegante */
function BadgesPreview({
  badgesPromise,
}: {
  badgesPromise: Promise<UserBadge[]>;
}) {
  const badges = use(badgesPromise);
  const hasBadges = Array.isArray(badges) && badges.length > 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/50">
          Insignias
        </p>
        {hasBadges && (
          <span className="rounded-full bg-primary/8 px-2.5 py-0.5 text-[10px] font-bold text-primary">
            {badges.length}
          </span>
        )}
      </div>

      {!hasBadges ? (
        <div className="flex flex-col items-center gap-2.5 py-6 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted/60 ring-1 ring-border/50">
            <Medal className="size-6 text-muted-foreground/25" aria-hidden />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground/60">
              Aún no hay insignias
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground/40">
              Participa en la plataforma para conseguirlas.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {badges.map((badge) => (
            <div
              key={badge.id}
              title={badge.description}
              className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-medium text-foreground/80 shadow-sm transition-shadow hover:shadow"
            >
              <span className="text-sm leading-none" aria-hidden>
                {badge.icon ?? "⭐"}
              </span>
              <span className="max-w-[6rem] truncate">{badge.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface BusinessSiteData {
  id: string;
  slug: string;
  name: string;
  description: string;
  coverUrl: string;
  publicationStatus: "draft" | "published";
}

/** Miniatura de portada del site con fallback de placeholder */
function SiteCoverThumb({
  coverUrl,
  name,
  isDraft,
}: {
  coverUrl: string;
  name: string;
  isDraft: boolean;
}) {
  if (coverUrl) {
    return (
      <div className="relative h-full w-full overflow-hidden">
        <Image
          src={coverUrl}
          alt={`Portada de ${name}`}
          fill
          sizes="192px"
          className="object-cover"
          unoptimized={false}
        />
        <div className="absolute inset-0 bg-black/10" aria-hidden />
      </div>
    );
  }
  return (
    <div
      className={cn(
        "flex h-full w-full items-center justify-center",
        isDraft ? "bg-amber-100" : "bg-primary/8",
      )}
      aria-hidden
    >
      {isDraft ? (
        <Construction className={cn("size-7", "text-amber-400")} />
      ) : (
        <Store className={cn("size-7", "text-primary/60")} />
      )}
    </div>
  );
}

/** Tarjeta del sitio asociado a una cuenta de negocio — solo visible para el propietario */
function BusinessSiteCard({ site }: { site: BusinessSiteData }) {
  const isDraft = site.publicationStatus === "draft";
  const href = isDraft ? `/studio/sites/${site.id}` : `/donde-ir/${site.slug}`;
  const statusLabel = isDraft ? "Sitio en construcción" : "Sitio oficial";
  const title = isDraft ? "Tu sitio está en construcción" : site.name;
  const body = isDraft
    ? "Ya creamos la base de tu sitio. Completa los datos para publicarlo."
    : site.description || "Visita el sitio oficial de este negocio.";
  const ctaLabel = isDraft ? "Completar sitio" : "Visitar sitio";

  return (
    <a
      href={href}
      rel={isDraft ? undefined : "noopener noreferrer"}
      target={isDraft ? undefined : "_blank"}
      className={cn(
        "group block overflow-hidden rounded-xl border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        isDraft
          ? "border-amber-200/80 bg-amber-50/40 hover:border-amber-300/80 hover:bg-amber-50/70"
          : "border-primary/20 bg-primary/[0.03] hover:border-primary/30 hover:bg-primary/[0.05]",
      )}
      aria-label={`${statusLabel}: ${title}`}
    >
      {/* Banda de estado */}
      <div
        className={cn(
          "flex items-center gap-1.5 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider",
          isDraft
            ? "bg-amber-100/70 text-amber-700"
            : "bg-primary/8 text-primary/70",
        )}
        aria-hidden
      >
        {isDraft ? (
          <Construction className="size-3" />
        ) : (
          <Store className="size-3" />
        )}
        {statusLabel}
      </div>

      {/* Cuerpo: thumbnail + texto */}
      <div className="flex items-stretch gap-0">
        {/* Thumbnail */}
        <div className="relative w-[88px] shrink-0 self-stretch">
          <SiteCoverThumb
            coverUrl={site.coverUrl}
            name={site.name}
            isDraft={isDraft}
          />
        </div>

        {/* Texto */}
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 px-3.5 py-3">
          <p className="line-clamp-1 text-sm font-semibold text-foreground">
            {title}
          </p>
          <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
            {body}
          </p>
          <span
            className={cn(
              "mt-1 inline-flex w-fit items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors",
              isDraft
                ? "bg-amber-600/90 text-white group-hover:bg-amber-700"
                : "bg-primary text-white group-hover:bg-primary/90",
            )}
          >
            {ctaLabel}
            <ExternalLink className="size-2.5" aria-hidden />
          </span>
        </div>
      </div>
    </a>
  );
}

// ─────────────────────────────────────────────────────────────────
//  Componente principal
// ─────────────────────────────────────────────────────────────────

export const ProfileHeader = ({
  statsPromise,
  badgesPromise,
}: ProfileHeaderProps) => {
  const { user, isHydrating } = useAuth();

  const [statsPromiseResolved, setStatsPromiseResolved] = useState<Promise<{
    eventsCount: number;
    sitesCount: number;
    badgesCount: number;
  }> | null>(null);
  const [badgesPromiseResolved, setBadgesPromiseResolved] =
    useState<Promise<UserBadge[]> | null>(null);
  const statsPromiseRef = useRef(statsPromise);
  const badgesPromiseRef = useRef(badgesPromise);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [businessSite, setBusinessSite] = useState<BusinessSiteData | null>(null);

  // Firestore (profile) es fuente de verdad; customClaims puede estar desactualizado (JWT stale)
  const isProfessional = useMemo(
    () => user?.profile?.accountType === "professional" || user?.customClaims?.role === "professional",
    [user],
  );
  const professionalType = useMemo(() => {
    const value = (user?.profile?.professionalType as string | undefined)
      ?? (user?.customClaims?.professionalType as string | undefined);
    return isProfessionalType(value) ? value : undefined;
  }, [user]);
  const isVerified = useMemo(() => user?.emailVerified ?? false, [user]);
  const showProfileCompletionHint = useMemo(() => {
    const missingPhone = !user?.phoneNumber && !user?.profile?.phoneNumber;
    const missingBio = !user?.profile?.bio?.trim();
    return missingPhone || missingBio;
  }, [user]);

  const organizerDetails =
    professionalType === "organizer"
      ? (user?.profile?.professionalDetails as OrganizerDetails | undefined)
      : null;
  const businessDetails =
    professionalType === "business"
      ? (user?.profile?.professionalDetails as BusinessDetails | undefined)
      : null;
  const governmentDetails =
    professionalType === "government"
      ? (user?.profile?.professionalDetails as GovernmentDetails | undefined)
      : null;

  const personalFullName = useMemo(() => {
    const first = user?.profile?.firstName ?? "";
    const last = user?.profile?.lastName ?? "";
    return `${first} ${last}`.trim() || (user?.displayName ?? "Usuario");
  }, [user]);

  const h1Name = useMemo(() => {
    if (!isProfessional) return personalFullName;
    if (professionalType === "business")
      return user?.profile?.brandName || personalFullName;
    if (professionalType === "government")
      return governmentDetails?.entityName || user?.profile?.brandName || personalFullName;
    if (professionalType === "organizer") {
      if (organizerDetails?.organizerType === "organization")
        return organizerDetails.organizationName || user?.profile?.brandName || personalFullName;
      return personalFullName;
    }
    return personalFullName;
  }, [isProfessional, professionalType, personalFullName, user, governmentDetails, organizerDetails]);

  const showPersonalNameUnderH1 = useMemo(() => {
    if (!isProfessional) return false;
    if (h1Name === personalFullName) return false;
    return Boolean(personalFullName);
  }, [isProfessional, h1Name, personalFullName]);

  const bio = user?.profile?.bio?.trim() || null;
  const professionalDesc = isProfessional
    ? (user?.profile?.professionalDescription as string | undefined)?.trim() || null
    : null;

  const website = user?.profile?.website as string | undefined;
  const mapsLink = (
    user?.profile?.mapsLink ?? governmentDetails?.mapsLink
  ) as string | undefined;
  const phone = user?.phoneNumber ?? user?.profile?.phoneNumber;
  const contactEmail = governmentDetails?.institutionalEmail || user?.email;
  // Para gobierno: teléfono institucional. Para negocio: teléfono comercial (si existe).
  // Para otros: teléfono personal. Nunca copiamos el personal como comercial automáticamente.
  const contactPhone =
    professionalType === "government"
      ? governmentDetails?.institutionalPhone
      : professionalType === "business"
        ? (businessDetails?.businessPhone || undefined)
        : phone;

  const allSocialLinks = useMemo<SocialLinkEntry[]>(() => {
    const newLinks = user?.profile?.socialLinks;
    if (newLinks?.length) return newLinks;
    const legacy = user?.profile?.socialLink as string | undefined;
    if (legacy) return [{ platform: "other" as const, url: legacy }];
    return [];
  }, [user]);

  const businessCategoryLabel = businessDetails?.businessCategory
    ? BUSINESS_CATEGORY_LABEL[businessDetails.businessCategory]
    : null;

  // NIT solo visible para organizadores con personería jurídica
  const organizerNit =
    organizerDetails?.organizerType === "organization"
      ? (organizerDetails.nit ?? null)
      : null;

  const websiteHostname = (() => {
    try {
      return website ? new URL(website).hostname.replace("www.", "") : "";
    } catch {
      return website ?? "";
    }
  })();

  const hasPresencePanel =
    Boolean(mapsLink || website) || allSocialLinks.length > 0;

  const hasProfessionalMeta =
    isProfessional &&
    Boolean(
      organizerDetails?.organizerType ||
        businessCategoryLabel ||
        organizerNit ||
        businessDetails?.nit,
    );

  // ── Handlers ────────────────────────────────────────────────
  const { onOpenSettings, onSelectSectionSetting } = useProfileConfigStore();

  useEffect(() => {
    statsPromiseRef.current = statsPromise;
  }, [statsPromise]);
  useEffect(() => {
    badgesPromiseRef.current = badgesPromise;
  }, [badgesPromise]);
  useEffect(() => {
    if (!user?.uid) return;
    setStatsPromiseResolved(statsPromiseRef.current(user.uid));
    setBadgesPromiseResolved(badgesPromiseRef.current(user.uid));
  }, [user?.uid]);

  // Cargar el sitio del negocio (solo propietario; draft y published)
  useEffect(() => {
    if (professionalType !== "business" || !user?.uid) return;
    void getMySitesAction().then((sites) => {
      const first = sites[0];
      if (first)
        setBusinessSite({
          id: first.id,
          slug: first.slug,
          name: first.name,
          description: (first as { description?: string }).description ?? "",
          coverUrl: first.coverUrl ?? "",
          publicationStatus: first.publicationStatus,
        });
    });
  }, [professionalType, user?.uid]);

  const openProfileSectionSetting = () => {
    onSelectSectionSetting("edit-profile");
    onOpenSettings(true);
  };

  const handleSendEmailVerification = async () => {
    setIsVerifying(true);
    try {
      await authService.sendEmailVerification();
      setVerificationMessage({
        type: "success",
        message: "Email de verificación enviado. Revisa tu bandeja de entrada.",
      });
    } catch {
      setVerificationMessage({
        type: "error",
        message: "Error al enviar el email de verificación",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  if (isHydrating) return <ProfileHeaderSkeleton />;

  const usernameHandle = user?.profile?.username as string | undefined;

  // ── Render ───────────────────────────────────────────────────

  return (
    <section aria-label="Perfil de usuario" className="space-y-3">
      <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">

        {/* ─────────────────────────────────────────────────────
            NIVEL 1: BANNER / PORTADA
        ───────────────────────────────────────────────────── */}
        <ProfileBanner
          bannerUrl={user?.profile?.bannerUrl}
          editable
          uid={user?.uid ?? undefined}
        >
          {/* Acciones — top-right con glass */}
          <div className="absolute right-3 top-3 flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={openProfileSectionSetting}
              className="h-8 border-white/40 bg-white/75 text-xs font-medium text-foreground shadow-sm backdrop-blur-md transition-all hover:bg-white/95 focus-visible:ring-2"
              aria-label="Editar perfil"
            >
              Editar perfil
            </Button>
            <ShareProfileButton
              username={usernameHandle ?? user?.displayName ?? "usuario"}
              variant="icon"
            />
          </div>
        </ProfileBanner>

        {/* ─────────────────────────────────────────────────────
            CUERPO
        ───────────────────────────────────────────────────── */}
        <div className="px-4 sm:px-6">

          {/* ── NIVEL 2: AVATAR superpuesto ── */}
          <div className="-mt-12 mb-4 sm:-mt-14">
            <div className="relative inline-block">
              {/* Anillo exterior para cuentas profesionales */}
              {isProfessional && (
                <div
                  className="absolute -inset-1.5 rounded-full border-2 border-primary/20"
                  aria-hidden
                />
              )}
              <div
                className={cn(
                  "relative rounded-full ring-[3px] ring-card",
                  isProfessional ? "shadow-md" : "shadow-sm",
                )}
              >
                <ProfileAvatar
                  src={user?.photoURL}
                  alt={`Foto de perfil de ${h1Name}`}
                  name={user?.displayName}
                  firstName={user?.profile?.firstName}
                  lastName={user?.profile?.lastName}
                  sizes="(max-width: 640px) 88px, 104px"
                  loading="eager"
                  className="h-[88px] w-[88px] sm:h-[104px] sm:w-[104px]"
                  textClassName="text-2xl sm:text-3xl"
                />
              </div>
              {/* Badge de verificación */}
              {isVerified && (
                <div
                  className="absolute -bottom-0.5 -right-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-card shadow-sm ring-2 ring-card"
                  title="Cuenta verificada"
                >
                  <CheckCircle2
                    className="size-5 fill-emerald-500 text-white"
                    strokeWidth={2}
                    aria-label="Cuenta verificada"
                  />
                </div>
              )}
            </div>
          </div>

          <div
            className={cn(
              "pb-5 sm:pb-6",
              hasPresencePanel &&
                "lg:grid lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start lg:gap-x-8",
            )}
          >
            <div className="space-y-4">

            {/* ── NIVEL 3: IDENTIDAD ── */}
            <div className="space-y-1">
              <h1 className="text-2xl font-bold leading-tight tracking-tight text-foreground sm:text-3xl">
                {h1Name}
              </h1>

              {/* Nombre personal cuando el H1 es la identidad de la entidad */}
              {showPersonalNameUnderH1 && (
                <p className="text-sm font-medium text-foreground/48">
                  {personalFullName}
                </p>
              )}

              {/* @identificador — secundario y compacto */}
              {usernameHandle && (
                <div className="flex items-center gap-0.5 pt-0.5">
                  <AtSign
                    className="size-3.5 shrink-0 text-primary/50"
                    aria-hidden
                  />
                  <span className="text-sm tracking-tight text-muted-foreground/65">
                    {usernameHandle}
                  </span>
                </div>
              )}
            </div>

            {/* ── NIVEL 4: BADGES de estado ── */}
            <div className="flex flex-wrap items-center gap-1.5">
              {isProfessional && professionalType === "organizer" && (
                <span className="inline-flex items-center gap-1 rounded-full border border-primary/25 bg-primary/8 px-3 py-1 text-[11px] font-semibold text-primary shadow-sm">
                  <Award className="h-3.5 w-3.5" aria-hidden />
                  Organizador
                </span>
              )}
              {isProfessional && professionalType === "business" && (
                <span className="inline-flex items-center gap-1 rounded-full border border-primary/25 bg-primary/8 px-3 py-1 text-[11px] font-semibold text-primary shadow-sm">
                  <Briefcase className="h-3.5 w-3.5" aria-hidden />
                  Negocio
                </span>
              )}
              {isProfessional && professionalType === "government" && (
                <span className="inline-flex items-center gap-1 rounded-full border border-primary/25 bg-primary/8 px-3 py-1 text-[11px] font-semibold text-primary shadow-sm">
                  <Landmark className="h-3.5 w-3.5" aria-hidden />
                  Entidad gubernamental
                </span>
              )}
              {isProfessional && !professionalType && (
                <span className="inline-flex items-center gap-1 rounded-full border border-primary/25 bg-primary/8 px-3 py-1 text-[11px] font-semibold text-primary shadow-sm">
                  <Briefcase className="h-3.5 w-3.5" aria-hidden />
                  Profesional
                </span>
              )}
              {isVerified && (
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300/70 bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700 shadow-sm">
                  <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                  Verificado
                </span>
              )}
              {showProfileCompletionHint && (
                <button
                  type="button"
                  onClick={openProfileSectionSetting}
                  className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-[11px] font-medium text-amber-700 shadow-sm transition-colors hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                  aria-label="Completa tu perfil — abrir configuración"
                >
                  <AlertCircle className="h-3.5 w-3.5" aria-hidden />
                  Completar perfil
                </button>
              )}
            </div>

            {/* ── NIVEL 5: BIO PERSONAL ── */}
            {bio ? (
              <div className="space-y-1.5">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/40">
                  Biografía
                </p>
                <p className="max-w-prose text-sm leading-relaxed text-foreground/72">
                  {bio}
                </p>
              </div>
            ) : (
              <button
                type="button"
                onClick={openProfileSectionSetting}
                className="text-sm italic text-muted-foreground/35 underline-offset-2 transition-colors hover:text-muted-foreground/60 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Agregar descripción al perfil"
              >
                Agrega una descripción sobre ti…
              </button>
            )}

            {/* ── NIVEL 6: ACTIVIDAD PROFESIONAL ── */}
            {professionalDesc && (
              <ProfessionalDescriptionBlock text={professionalDesc} />
            )}

            {/* ── NIVEL 7: METADATA PROFESIONAL ── */}
            {hasProfessionalMeta && (
              <div className="flex flex-wrap items-center gap-1.5">
                {organizerDetails?.organizerType && (
                  <MetaPill
                    icon={
                      organizerDetails.organizerType === "organization"
                        ? Building2
                        : Users
                    }
                    label={
                      organizerDetails.organizerType === "organization"
                        ? "Organización"
                        : "Persona natural"
                    }
                  />
                )}
                {(organizerDetails?.eventCategories?.length ?? 0) > 0 && (
                  <MetaPill
                    icon={CalendarDays}
                    label={`${organizerDetails!.eventCategories.length} ${
                      organizerDetails!.eventCategories.length === 1
                        ? "categoría"
                        : "categorías"
                    }`}
                  />
                )}
                {businessCategoryLabel && (
                  <MetaPill icon={Tag} label={businessCategoryLabel} prominent />
                )}
                {businessDetails?.nit && (
                  <MetaPill icon={Hash} label={`NIT ${businessDetails.nit}`} prominent />
                )}
                {organizerNit && (
                  <MetaPill icon={Building2} label={`NIT ${organizerNit}`} />
                )}
              </div>
            )}

            {/* ── NIVEL 7b: INFORMACIÓN INSTITUCIONAL ── */}
            {professionalType === "government" && governmentDetails && (
              <GovernmentInfoBlock details={governmentDetails} />
            )}

            {/* ── NIVEL 8a: CONTACTO (solo cuentas no gubernamentales) ── */}
            {professionalType !== "government" && (contactEmail || contactPhone) && (
              <div className="flex flex-wrap gap-2">
                {contactEmail && (
                  <ContactChip
                    href={`mailto:${contactEmail}`}
                    icon={Mail}
                    label={contactEmail}
                  />
                )}
                {contactPhone && (
                  <ContactChip
                    href={`tel:${contactPhone}`}
                    icon={Phone}
                    label={String(contactPhone)}
                  />
                )}
              </div>
            )}
            </div>

          {/* ── NIVEL 8b: PRESENCIA DIGITAL ── */}
          {hasPresencePanel && (
            <div className="mt-5 space-y-2 lg:mt-0">
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/40">
                Presencia
              </p>
              {mapsLink && <MapTile href={mapsLink} />}
              {website && websiteHostname && (
                <WebTile href={website} hostname={websiteHostname} />
              )}
              {allSocialLinks.length > 0 && (
                <div
                  className={cn(
                    "grid gap-1.5",
                    allSocialLinks.length > 1 ? "grid-cols-2" : "grid-cols-1",
                  )}
                >
                  {allSocialLinks.map((link, i) => (
                    <SocialTile key={i} link={link} />
                  ))}
                </div>
              )}
              {professionalType === "business" && businessSite && (
                <BusinessSiteCard site={businessSite} />
              )}
            </div>
          )}
          {professionalType === "business" && businessSite && !hasPresencePanel && (
            <div className="mt-4">
              <BusinessSiteCard site={businessSite} />
            </div>
          )}
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────
            NIVEL 9: MÉTRICAS
        ───────────────────────────────────────────────────── */}
        {statsPromiseResolved && (
          <div className="border-t border-border">
            <Suspense fallback={<StatsSkeleton />}>
              <ProfileStats statsPromise={statsPromiseResolved} />
            </Suspense>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────
            NIVEL 10: INSIGNIAS
        ───────────────────────────────────────────────────── */}
        {badgesPromiseResolved && (
          <div className="border-t border-border px-4 py-4 sm:px-6">
            <Suspense fallback={<BadgesPreviewSkeleton />}>
              <BadgesPreview badgesPromise={badgesPromiseResolved} />
            </Suspense>
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────
          BANNER: VERIFICACIÓN DE EMAIL
      ───────────────────────────────────────────────────── */}
      {!isVerified && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4">
          <div className="flex gap-3">
            <AlertCircle
              className="mt-0.5 h-5 w-5 shrink-0 text-amber-600"
              aria-hidden
            />
            <div className="flex-1">
              <h3 className="font-semibold text-amber-900">
                Verifica tu correo electrónico
              </h3>
              <p className="mt-1 text-sm text-amber-800">
                Necesitas verificarlo para publicar eventos en la plataforma.
              </p>
              <Button
                size="sm"
                onClick={handleSendEmailVerification}
                disabled={isVerifying}
                className="mt-3 bg-amber-600 text-white hover:bg-amber-700"
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" aria-hidden />
                    Enviando…
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-3.5 w-3.5" aria-hidden />
                    Enviar verificación
                  </>
                )}
              </Button>
              {verificationMessage && (
                <p
                  className={cn(
                    "mt-2 text-xs font-medium",
                    verificationMessage.type === "success"
                      ? "text-emerald-700"
                      : "text-destructive",
                  )}
                >
                  {verificationMessage.message}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

// ─────────────────────────────────────────────────────────────────
//  Skeletons
// ─────────────────────────────────────────────────────────────────

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-3 divide-x divide-border">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="flex flex-col items-center gap-1.5 py-5">
          <div className="h-7 w-10 animate-pulse rounded bg-muted" />
          <div className="h-3 w-12 animate-pulse rounded bg-muted" />
        </div>
      ))}
    </div>
  );
}

function BadgesPreviewSkeleton() {
  return (
    <div className="space-y-3">
      <div className="h-3 w-16 animate-pulse rounded bg-muted" />
      <div className="flex gap-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-8 w-24 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    </div>
  );
}

function ProfileHeaderSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
      <div className="h-44 animate-pulse bg-muted sm:h-56" />
      <div className="px-4 sm:px-6">
        <div className="-mt-12 mb-4 sm:-mt-14">
          <div className="h-[88px] w-[88px] animate-pulse rounded-full bg-muted ring-[3px] ring-card sm:h-[104px] sm:w-[104px]" />
        </div>
        <div className="space-y-4 pb-5">
          <div className="space-y-1.5">
            <div className="h-8 w-52 animate-pulse rounded-lg bg-muted sm:h-9 sm:w-64" />
            <div className="h-4 w-32 animate-pulse rounded bg-muted" />
          </div>
          <div className="flex gap-2">
            <div className="h-6 w-24 animate-pulse rounded-full bg-muted" />
            <div className="h-6 w-20 animate-pulse rounded-full bg-muted" />
          </div>
          <div className="space-y-2">
            <div className="h-4 w-full max-w-xs animate-pulse rounded bg-muted" />
            <div className="h-4 w-3/4 max-w-[220px] animate-pulse rounded bg-muted" />
          </div>
        </div>
      </div>
      <div className="border-t border-border">
        <StatsSkeleton />
      </div>
    </div>
  );
}
