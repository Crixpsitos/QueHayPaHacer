"use client";

import { useState, useMemo, useCallback } from "react";
import { ProfileHeader } from "@/presentation/profile/components/ProfileHeader";
import { AuthContext } from "@/app/store/auth/AuthContext";
import type { User } from "@/app/store/auth/AuthContext";
import { generateUsername } from "@/app/lib/utils/generateUsername";
import type { SocialPlatform, SocialLinkEntry } from "@/domain/entities/user/User";
import type {
  OrganizerDetails,
  BusinessDetails,
  GovernmentDetails,
  BusinessCategory,
} from "@/domain/entities/professional/ProfessionalRequest";
import type { UserBadge } from "@/domain/repository/profile/IProfileRepository";
import { BUSINESS_CATEGORY_LABEL } from "@/presentation/profile/lib/professionalType";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Switch } from "@/app/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { Button } from "@/app/components/ui/button";
import { Separator } from "@/app/components/ui/separator";
import { cn } from "@/app/lib/utils/cn";
import { ChevronDown } from "lucide-react";

// ─────────────────────────────────────────────────────────────────
//  Tipos internos del playground
// ─────────────────────────────────────────────────────────────────

type SocialUrls = Record<SocialPlatform, string>;

interface PlaygroundState {
  // Identidad
  firstName: string;
  lastName: string;
  brandName: string;
  username: string;
  bio: string;
  photoURL: string;
  email: string;
  phoneNumber: string;
  // Cuenta
  role: "user" | "professional";
  professionalType: "" | "organizer" | "business" | "government";
  emailVerified: boolean;
  // Contenido profesional
  professionalDescription: string;
  // Organizador
  organizerType: "natural_person" | "organization";
  organizationName: string;
  nit: string;
  // Negocio
  businessCategory: BusinessCategory | "";
  // Gobierno
  entityName: string;
  department: string;
  institutionalEmail: string;
  institutionalPhone: string;
  // Digital
  mapsLink: string;
  website: string;
  socialUrls: SocialUrls;
  // Stats
  eventsCount: number;
  sitesCount: number;
  badgesCount: number;
  hasBadges: boolean;
}

const EMPTY_SOCIAL_URLS: SocialUrls = {
  instagram: "",
  facebook: "",
  tiktok: "",
  youtube: "",
  twitter: "",
  linkedin: "",
  other: "",
};

const SOCIAL_LABELS: Record<SocialPlatform, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  tiktok: "TikTok",
  youtube: "YouTube",
  twitter: "X / Twitter",
  linkedin: "LinkedIn",
  other: "Otro enlace",
};

const MOCK_BADGES: UserBadge[] = [
  {
    id: "b1",
    name: "Primer evento",
    description: "Creaste tu primer evento",
    icon: "🎉",
    category: "milestone",
    earnedAt: new Date("2024-03-01"),
  },
  {
    id: "b2",
    name: "Verificado",
    description: "Cuenta verificada",
    icon: "✅",
    category: "system",
    earnedAt: new Date("2024-01-15"),
  },
  {
    id: "b3",
    name: "Comunidad",
    description: "Participas activamente",
    icon: "🌟",
    category: "achievement",
    earnedAt: new Date("2024-06-10"),
  },
];

// ─────────────────────────────────────────────────────────────────
//  Presets
// ─────────────────────────────────────────────────────────────────

const BASE_STATE: PlaygroundState = {
  firstName: "",
  lastName: "",
  brandName: "",
  username: "",
  bio: "",
  photoURL: "",
  email: "usuario@example.com",
  phoneNumber: "",
  role: "user",
  professionalType: "",
  emailVerified: false,
  professionalDescription: "",
  organizerType: "natural_person",
  organizationName: "",
  nit: "",
  businessCategory: "",
  entityName: "",
  department: "",
  institutionalEmail: "",
  institutionalPhone: "",
  mapsLink: "",
  website: "",
  socialUrls: { ...EMPTY_SOCIAL_URLS },
  eventsCount: 0,
  sitesCount: 0,
  badgesCount: 0,
  hasBadges: false,
};

interface Preset {
  label: string;
  color: string;
  state: Partial<PlaygroundState>;
}

const PRESETS: Record<string, Preset> = {
  "usuario-normal": {
    label: "Usuario normal",
    color: "bg-zinc-700 hover:bg-zinc-600",
    state: {
      firstName: "Cristian",
      lastName: "Peña",
      username: "cristian_pena",
      email: "cristian@example.com",
      phoneNumber: "+57 314 419 7191",
      bio: "Apasionado por la cultura y los eventos locales de Ibagué.",
      role: "user",
      professionalType: "",
      emailVerified: true,
      eventsCount: 5,
      sitesCount: 1,
      badgesCount: 2,
      hasBadges: true,
      socialUrls: { ...EMPTY_SOCIAL_URLS, instagram: "https://instagram.com/cristian_pena" },
    },
  },
  "organizador-natural": {
    label: "Organizador natural",
    color: "bg-primary/80 hover:bg-primary",
    state: {
      firstName: "Cristian",
      lastName: "Peña",
      brandName: "Cristian Eventos",
      username: "cristian_eventos",
      email: "cristian@example.com",
      phoneNumber: "+57 314 419 7191",
      bio: "Hola, soy organizador de eventos culturales y de entretenimiento en el Tolima.",
      professionalDescription:
        "Organizamos eventos de música, entretenimiento y experiencias culturales en Ibagué.",
      role: "professional",
      professionalType: "organizer",
      organizerType: "natural_person",
      emailVerified: true,
      website: "https://cristianeventos.co",
      mapsLink: "https://maps.google.com/?q=Ibague+Tolima",
      socialUrls: {
        ...EMPTY_SOCIAL_URLS,
        instagram: "https://instagram.com/cristian_eventos",
        facebook: "https://facebook.com/cristian.eventos",
        tiktok: "https://tiktok.com/@cristian_eventos",
      },
      eventsCount: 12,
      sitesCount: 2,
      badgesCount: 3,
      hasBadges: true,
    },
  },
  "organizador-juridico": {
    label: "Organizador jurídico",
    color: "bg-primary/80 hover:bg-primary",
    state: {
      firstName: "Andrés",
      lastName: "Torres",
      brandName: "Eventos Tolima SAS",
      organizationName: "Eventos Tolima SAS",
      username: "eventos_tolima",
      email: "info@eventostolima.com",
      phoneNumber: "+57 310 555 1234",
      bio: "",
      professionalDescription:
        "Empresa organizadora de eventos corporativos, culturales y artísticos en la región del Tolima.",
      role: "professional",
      professionalType: "organizer",
      organizerType: "organization",
      nit: "900.123.456-7",
      emailVerified: true,
      website: "https://eventostolima.com",
      mapsLink: "https://maps.google.com/?q=Eventos+Tolima+Ibague",
      socialUrls: {
        ...EMPTY_SOCIAL_URLS,
        instagram: "https://instagram.com/eventos_tolima",
        facebook: "https://facebook.com/eventostolima",
        tiktok: "https://tiktok.com/@eventos_tolima",
        youtube: "https://youtube.com/@eventos_tolima",
      },
      eventsCount: 34,
      sitesCount: 3,
      badgesCount: 2,
      hasBadges: true,
    },
  },
  "negocio": {
    label: "Negocio",
    color: "bg-blue-700 hover:bg-blue-600",
    state: {
      firstName: "Sandra",
      lastName: "López",
      brandName: "Bar El Encuentro",
      username: "bar_el_encuentro",
      email: "contacto@barencuentro.com",
      phoneNumber: "+57 8 2634521",
      bio: "",
      professionalDescription:
        "Bar y espacio cultural para música en vivo, gastronomía y entretenimiento en el corazón de Ibagué.",
      role: "professional",
      professionalType: "business",
      businessCategory: "bar",
      emailVerified: true,
      website: "https://barencuentro.com",
      mapsLink: "https://maps.google.com/?q=Bar+El+Encuentro+Ibague",
      socialUrls: {
        ...EMPTY_SOCIAL_URLS,
        instagram: "https://instagram.com/bar_encuentro",
        facebook: "https://facebook.com/barencuentro",
        tiktok: "https://tiktok.com/@bar_encuentro",
      },
      eventsCount: 8,
      sitesCount: 1,
      badgesCount: 1,
      hasBadges: false,
    },
  },
  "gobierno": {
    label: "Entidad gubernamental",
    color: "bg-emerald-700 hover:bg-emerald-600",
    state: {
      firstName: "",
      lastName: "",
      entityName: "Alcaldía de Ibagué",
      department: "Secretaría de Cultura",
      institutionalEmail: "cultura@alcaldiadeibague.gov.co",
      institutionalPhone: "+57 8 2611170",
      brandName: "Alcaldía de Ibagué",
      username: "alcaldia_ibague",
      email: "cultura@alcaldiadeibague.gov.co",
      phoneNumber: "+57 8 2611170",
      bio: "",
      professionalDescription:
        "Entidad encargada de promover y desarrollar programas culturales y artísticos en el municipio de Ibagué.",
      role: "professional",
      professionalType: "government",
      emailVerified: true,
      website: "https://alcaldiadeibague.gov.co",
      mapsLink: "https://maps.google.com/?q=Alcaldia+de+Ibague",
      socialUrls: {
        ...EMPTY_SOCIAL_URLS,
        instagram: "https://instagram.com/alcaldiaibague",
        facebook: "https://facebook.com/alcaldiadeibague",
        twitter: "https://x.com/alcaldiaibague",
      },
      eventsCount: 45,
      sitesCount: 5,
      badgesCount: 0,
      hasBadges: false,
    },
  },
  "perfil-completo": {
    label: "Perfil completo",
    color: "bg-violet-700 hover:bg-violet-600",
    state: {
      firstName: "Cristian",
      lastName: "Peña",
      brandName: "Cristian Eventos",
      username: "cristian_eventos",
      email: "cristian@example.com",
      phoneNumber: "+57 314 419 7191",
      bio: "Apasionado por la cultura, los eventos y las experiencias únicas. Ibaguereño de corazón.",
      professionalDescription:
        "Organizamos eventos de música, entretenimiento y experiencias culturales en Ibagué.",
      role: "professional",
      professionalType: "organizer",
      organizerType: "natural_person",
      emailVerified: true,
      website: "https://cristianeventos.co",
      mapsLink: "https://maps.google.com/?q=Ibague",
      socialUrls: {
        instagram: "https://instagram.com/cristian_eventos",
        facebook: "https://facebook.com/cristian.eventos",
        tiktok: "https://tiktok.com/@cristian_eventos",
        youtube: "https://youtube.com/@cristian_eventos",
        twitter: "https://x.com/cristian_eventos",
        linkedin: "https://linkedin.com/in/cristian_eventos",
        other: "",
      },
      eventsCount: 33,
      sitesCount: 4,
      badgesCount: 3,
      hasBadges: true,
    },
  },
  "perfil-minimo": {
    label: "Perfil mínimo",
    color: "bg-zinc-600 hover:bg-zinc-500",
    state: {
      firstName: "Juan",
      lastName: "García",
      brandName: "Juan Eventos",
      username: "juan_eventos",
      email: "juan@example.com",
      phoneNumber: "",
      bio: "",
      professionalDescription: "",
      role: "professional",
      professionalType: "organizer",
      organizerType: "natural_person",
      emailVerified: false,
      website: "",
      mapsLink: "",
      socialUrls: { ...EMPTY_SOCIAL_URLS },
      eventsCount: 0,
      sitesCount: 0,
      badgesCount: 0,
      hasBadges: false,
    },
  },
  "nombre-largo": {
    label: "Nombre largo (stress UI)",
    color: "bg-orange-700 hover:bg-orange-600",
    state: {
      firstName: "Cristian Andrés",
      lastName: "Peña Montealegre",
      brandName: "Organización de Eventos Culturales y Empresariales del Tolima",
      organizationName: "Organización de Eventos Culturales y Empresariales del Tolima",
      username: "organizacion_eventos_culturales_tolima",
      email: "contacto@organizacioneventostolima.com.co",
      phoneNumber: "+57 310 555 1234",
      bio: "Esta es una descripción de bio extremadamente larga diseñada para probar cómo el ProfileHeader maneja textos que se extienden en múltiples líneas y podrían causar problemas de layout o tipografía en dispositivos con pantallas pequeñas o medianas.",
      professionalDescription:
        "Somos una organización de eventos con más de 10 años de experiencia en la organización de eventos corporativos, culturales, artísticos, musicales y empresariales en la región del Tolima y el centro del país.",
      role: "professional",
      professionalType: "organizer",
      organizerType: "organization",
      nit: "900.123.456-7",
      emailVerified: true,
      website: "https://organizacioneventosculturalesytolima.com.co",
      mapsLink: "https://maps.google.com/?q=Ibague+Tolima",
      socialUrls: {
        instagram: "https://instagram.com/organizacion_eventos",
        facebook: "https://facebook.com/organizacion.eventos.tolima",
        tiktok: "https://tiktok.com/@organizacion_eventos_tolima",
        youtube: "https://youtube.com/@organizacioneventostolima",
        twitter: "https://x.com/org_eventos_col",
        linkedin: "https://linkedin.com/company/organizacion-eventos-tolima",
        other: "",
      },
      eventsCount: 124,
      sitesCount: 8,
      badgesCount: 5,
      hasBadges: true,
    },
  },
  "muchas-redes": {
    label: "Muchas redes",
    color: "bg-pink-700 hover:bg-pink-600",
    state: {
      firstName: "María",
      lastName: "Salcedo",
      brandName: "María Eventos",
      username: "maria_eventos",
      email: "maria@example.com",
      phoneNumber: "+57 314 000 0000",
      bio: "Creadora de contenido y organizadora de eventos.",
      professionalDescription: "Eventos sociales y corporativos en Ibagué y alrededores.",
      role: "professional",
      professionalType: "organizer",
      organizerType: "natural_person",
      emailVerified: true,
      website: "https://mariaeventos.co",
      mapsLink: "https://maps.google.com/?q=Ibague",
      socialUrls: {
        instagram: "https://instagram.com/maria_eventos",
        facebook: "https://facebook.com/maria.eventos",
        tiktok: "https://tiktok.com/@maria_eventos",
        youtube: "https://youtube.com/@mariaeventos",
        twitter: "https://x.com/maria_eventos",
        linkedin: "https://linkedin.com/in/mariasalcedo",
        other: "",
      },
      eventsCount: 15,
      sitesCount: 2,
      badgesCount: 2,
      hasBadges: true,
    },
  },
  "sin-redes": {
    label: "Sin redes sociales",
    color: "bg-slate-600 hover:bg-slate-500",
    state: {
      firstName: "Carlos",
      lastName: "Jiménez",
      brandName: "Carlos Eventos",
      username: "carlos_eventos",
      email: "carlos@example.com",
      phoneNumber: "+57 315 000 0000",
      bio: "Organizador independiente de eventos locales.",
      professionalDescription: "Eventos familiares y sociales en Ibagué.",
      role: "professional",
      professionalType: "organizer",
      organizerType: "natural_person",
      emailVerified: true,
      website: "",
      mapsLink: "",
      socialUrls: { ...EMPTY_SOCIAL_URLS },
      eventsCount: 6,
      sitesCount: 0,
      badgesCount: 0,
      hasBadges: false,
    },
  },
};

// ─────────────────────────────────────────────────────────────────
//  Función: construir mock User desde el estado del playground
// ─────────────────────────────────────────────────────────────────

function buildSocialLinks(urls: SocialUrls): SocialLinkEntry[] {
  return (Object.keys(urls) as SocialPlatform[])
    .filter((p) => p !== "other" && urls[p].trim())
    .map((p) => ({ platform: p, url: urls[p].trim() }));
}

function buildMockUser(s: PlaygroundState): User {
  let professionalDetails:
    | OrganizerDetails
    | BusinessDetails
    | GovernmentDetails
    | undefined;

  if (s.role === "professional") {
    if (s.professionalType === "organizer") {
      const details: OrganizerDetails = {
        organizerType: s.organizerType,
        organizationName:
          s.organizerType === "organization" ? s.organizationName || null : null,
        nit:
          s.organizerType === "organization" ? s.nit || null : null,
        eventCategories: [],
      };
      professionalDetails = details;
    } else if (s.professionalType === "business") {
      const details: BusinessDetails = {
        businessCategory: (s.businessCategory || "otro") as BusinessCategory,
        businessDescription: null,
        mapsLink: s.mapsLink || null,
        socialLink: null,
        nit: null,
        locationLat: null,
        locationLng: null,
      };
      professionalDetails = details;
    } else if (s.professionalType === "government") {
      const details: GovernmentDetails = {
        entityName: s.entityName || "Entidad",
        department: s.department || "",
        institutionalEmail: s.institutionalEmail || s.email,
        institutionalPhone: s.institutionalPhone || "",
        mapsLink: s.mapsLink || null,
      };
      professionalDetails = details;
    }
  }

  const socialLinks = buildSocialLinks(s.socialUrls);

  // uid incluye stats para que ProfileHeader recargue al cambiarlos
  const uid = `dev-${s.eventsCount}e${s.sitesCount}s${s.hasBadges ? 1 : 0}b`;

  return {
    uid,
    displayName: s.username || null,
    email: s.email || null,
    phoneNumber: s.phoneNumber || null,
    photoURL: s.photoURL || null,
    providerId: "dev-playground",
    emailVerified: s.emailVerified,
    customClaims:
      s.role === "professional" && s.professionalType
        ? { role: "professional", professionalType: s.professionalType }
        : { role: "user" },
    profile: {
      firstName: s.firstName,
      lastName: s.lastName,
      username: s.username,
      phoneNumber: s.phoneNumber,
      accountType: s.role === "professional" ? "professional" : null,
      professionalType: s.role === "professional" ? (s.professionalType ?? null) : null,
      professionalStatus: s.role === "professional" ? "active" : null,
      bio: s.bio || null,
      photoURL: s.photoURL || null,
      imagePath: null,
      isPublic: true,
      brandName: s.brandName || undefined,
      website: s.website || undefined,
      mapsLink: s.mapsLink || undefined,
      socialLinks: socialLinks.length > 0 ? socialLinks : undefined,
      isUsernameCustomized: true,
      professionalDescription: s.professionalDescription || undefined,
      professionalDetails,
    },
  };
}

// ─────────────────────────────────────────────────────────────────
//  Sección colapsable de controles
// ─────────────────────────────────────────────────────────────────

function ControlSection({
  title,
  defaultOpen = true,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-lg border border-white/10 bg-white/5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white/60 transition-colors hover:text-white/90"
      >
        {title}
        <ChevronDown
          className={cn(
            "size-3.5 transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>
      {open && (
        <div className="border-t border-white/10 px-4 pb-4 pt-3">
          {children}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
//  Control de campo con label
// ─────────────────────────────────────────────────────────────────

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[11px] font-medium text-white/50">{label}</Label>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
//  Control switch con label inline
// ─────────────────────────────────────────────────────────────────

function SwitchField({
  label,
  checked,
  onCheckedChange,
  description,
}: {
  label: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  description?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="text-xs text-white/70">{label}</p>
        {description && (
          <p className="text-[10px] text-white/35">{description}</p>
        )}
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onCheckedChange}
        className="data-[state=checked]:bg-primary"
      />
    </div>
  );
}

const INPUT_CLS =
  "h-8 border-white/10 bg-white/8 text-xs text-white placeholder:text-white/25 focus:border-primary/60";

// ─────────────────────────────────────────────────────────────────
//  Componente principal del playground
// ─────────────────────────────────────────────────────────────────

export function ProfileHeaderPlayground() {
  const [state, setState] = useState<PlaygroundState>(() => ({
    ...BASE_STATE,
    ...PRESETS["organizador-natural"].state,
  }));

  const set = useCallback(
    <K extends keyof PlaygroundState>(key: K, value: PlaygroundState[K]) =>
      setState((s) => ({ ...s, [key]: value })),
    [],
  );

  const setSocial = useCallback(
    (platform: SocialPlatform, url: string) =>
      setState((s) => ({
        ...s,
        socialUrls: { ...s.socialUrls, [platform]: url },
      })),
    [],
  );

  const applyPreset = useCallback((key: string) => {
    setState({ ...BASE_STATE, ...PRESETS[key].state });
  }, []);

  // Auto-genera username cuando cambia brandName o entityName
  const suggestedUsername = useMemo(() => {
    const source =
      state.professionalType === "government"
        ? state.entityName
        : state.professionalType === "organizer" &&
          state.organizerType === "organization"
        ? state.organizationName || state.brandName
        : state.brandName;
    return source.trim() ? generateUsername(source) : "";
  }, [
    state.brandName,
    state.entityName,
    state.organizationName,
    state.organizerType,
    state.professionalType,
  ]);

  // Mock stats y badges basados en el estado
  const mockStatsPromise = useCallback(
    (_uid: string) =>
      Promise.resolve({
        eventsCount: state.eventsCount,
        sitesCount: state.sitesCount,
        badgesCount: state.badgesCount,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state.eventsCount, state.sitesCount, state.badgesCount],
  );

  const mockBadgesPromise = useCallback(
    (_uid: string) =>
      Promise.resolve(state.hasBadges ? MOCK_BADGES.slice(0, state.badgesCount || 3) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state.hasBadges, state.badgesCount],
  );

  const mockUser = useMemo(() => buildMockUser(state), [state]);

  const mockAuthValue = useMemo(
    () => ({
      user: mockUser,
      isHydrating: false,
      setUser: () => undefined,
      refreshUser: async () => undefined,
    }),
    [mockUser],
  );

  return (
    <div className="flex min-h-screen flex-col">

      {/* Presets */}
      <div className="border-b border-white/10 bg-zinc-900 px-4 py-3">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-white/40">
          Presets
        </p>
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(PRESETS).map(([key, preset]) => (
            <button
              key={key}
              type="button"
              onClick={() => applyPreset(key)}
              className={cn(
                "rounded-full px-3 py-1 text-[11px] font-medium text-white transition-colors",
                preset.color,
              )}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Cuerpo: controles + preview */}
      <div className="flex flex-1 flex-col gap-0 md:flex-row">

        {/* ── Panel de controles ── */}
        <div className="w-full shrink-0 space-y-2 overflow-y-auto p-4 md:w-[400px] lg:w-[440px]">

          {/* ─── Cuenta ─── */}
          <ControlSection title="Cuenta">
            <div className="space-y-3">
              <Field label="Email">
                <Input
                  value={state.email}
                  onChange={(e) => set("email", e.target.value)}
                  placeholder="usuario@example.com"
                  className={INPUT_CLS}
                />
              </Field>
              <SwitchField
                label="Email verificado"
                checked={state.emailVerified}
                onCheckedChange={(v) => set("emailVerified", v)}
              />
              <Field label="Tipo de cuenta">
                <Select
                  value={
                    !state.professionalType
                      ? "user"
                      : `pro-${state.professionalType}`
                  }
                  onValueChange={(v) => {
                    if (v === "user") {
                      set("role", "user");
                      set("professionalType", "");
                    } else {
                      const type = v.replace("pro-", "") as
                        | "organizer"
                        | "business"
                        | "government";
                      set("role", "professional");
                      set("professionalType", type);
                    }
                  }}
                >
                  <SelectTrigger className={cn(INPUT_CLS, "h-9")}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Usuario normal</SelectItem>
                    <SelectItem value="pro-organizer">Organizador</SelectItem>
                    <SelectItem value="pro-business">Negocio</SelectItem>
                    <SelectItem value="pro-government">
                      Entidad gubernamental
                    </SelectItem>
                  </SelectContent>
                </Select>
              </Field>

              {state.professionalType === "organizer" && (
                <Field label="Tipo de organizador">
                  <Select
                    value={state.organizerType}
                    onValueChange={(v) =>
                      set(
                        "organizerType",
                        v as "natural_person" | "organization",
                      )
                    }
                  >
                    <SelectTrigger className={cn(INPUT_CLS, "h-9")}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="natural_person">
                        Persona natural
                      </SelectItem>
                      <SelectItem value="organization">
                        Empresa / organización
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              )}

              {state.professionalType === "business" && (
                <Field label="Categoría del negocio">
                  <Select
                    value={state.businessCategory}
                    onValueChange={(v) =>
                      set("businessCategory", v as BusinessCategory)
                    }
                  >
                    <SelectTrigger className={cn(INPUT_CLS, "h-9")}>
                      <SelectValue placeholder="Seleccionar..." />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(BUSINESS_CATEGORY_LABEL).map(
                        ([key, label]) => (
                          <SelectItem key={key} value={key}>
                            {label}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                </Field>
              )}
            </div>
          </ControlSection>

          {/* ─── Identidad ─── */}
          <ControlSection title="Identidad">
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <Field label="Nombre">
                  <Input
                    value={state.firstName}
                    onChange={(e) => set("firstName", e.target.value)}
                    placeholder="Cristian"
                    className={INPUT_CLS}
                  />
                </Field>
                <Field label="Apellidos">
                  <Input
                    value={state.lastName}
                    onChange={(e) => set("lastName", e.target.value)}
                    placeholder="Peña"
                    className={INPUT_CLS}
                  />
                </Field>
              </div>

              {state.professionalType !== "government" && (
                <Field label="Nombre / identidad profesional (brandName)">
                  <Input
                    value={state.brandName}
                    onChange={(e) => set("brandName", e.target.value)}
                    placeholder="Cristian Eventos"
                    className={INPUT_CLS}
                  />
                </Field>
              )}

              {state.professionalType === "organizer" &&
                state.organizerType === "organization" && (
                  <Field label="Nombre de la organización">
                    <Input
                      value={state.organizationName}
                      onChange={(e) => set("organizationName", e.target.value)}
                      placeholder="Eventos Tolima SAS"
                      className={INPUT_CLS}
                    />
                  </Field>
                )}

              {state.professionalType === "government" && (
                <>
                  <Field label="Nombre de la entidad">
                    <Input
                      value={state.entityName}
                      onChange={(e) => set("entityName", e.target.value)}
                      placeholder="Alcaldía de Ibagué"
                      className={INPUT_CLS}
                    />
                  </Field>
                  <Field label="Dependencia / área">
                    <Input
                      value={state.department}
                      onChange={(e) => set("department", e.target.value)}
                      placeholder="Secretaría de Cultura"
                      className={INPUT_CLS}
                    />
                  </Field>
                </>
              )}

              <Field label="Identificador público (@username)">
                <div className="flex gap-2">
                  <Input
                    value={state.username}
                    onChange={(e) => set("username", e.target.value)}
                    placeholder="cristian_eventos"
                    className={INPUT_CLS}
                  />
                  {suggestedUsername && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => set("username", suggestedUsername)}
                      className="shrink-0 border-white/10 bg-white/5 text-[10px] text-white/50 hover:bg-white/10 hover:text-white/80"
                      title="Aplicar username generado"
                    >
                      → {suggestedUsername}
                    </Button>
                  )}
                </div>
                {suggestedUsername && (
                  <p className="mt-1 text-[10px] text-white/30">
                    Generado desde nombre:{" "}
                    <span className="text-primary/60">@{suggestedUsername}</span>
                  </p>
                )}
              </Field>

              <Field label="Bio personal">
                <textarea
                  value={state.bio}
                  onChange={(e) => set("bio", e.target.value)}
                  placeholder="Descripción personal breve..."
                  rows={3}
                  className={cn(
                    INPUT_CLS,
                    "h-auto w-full rounded-md border px-3 py-2 font-sans text-xs",
                  )}
                />
              </Field>
            </div>
          </ControlSection>

          {/* ─── Cuenta profesional ─── */}
          {state.role === "professional" && (
            <ControlSection title="Cuenta profesional">
              <div className="space-y-3">
                <Field label="Descripción profesional / actividad">
                  <textarea
                    value={state.professionalDescription}
                    onChange={(e) =>
                      set("professionalDescription", e.target.value)
                    }
                    placeholder="Describe la actividad profesional..."
                    rows={4}
                    className={cn(
                      INPUT_CLS,
                      "h-auto w-full rounded-md border px-3 py-2 font-sans text-xs",
                    )}
                  />
                </Field>

                {state.professionalType === "organizer" &&
                  state.organizerType === "organization" && (
                    <Field label="NIT">
                      <Input
                        value={state.nit}
                        onChange={(e) => set("nit", e.target.value)}
                        placeholder="900.123.456-7"
                        className={INPUT_CLS}
                      />
                    </Field>
                  )}
              </div>
            </ControlSection>
          )}

          {/* ─── Contacto ─── */}
          <ControlSection title="Contacto" defaultOpen={false}>
            <div className="space-y-3">
              <Field label="Teléfono">
                <Input
                  value={state.phoneNumber}
                  onChange={(e) => set("phoneNumber", e.target.value)}
                  placeholder="+57 314 000 0000"
                  className={INPUT_CLS}
                />
              </Field>
              {state.professionalType === "government" && (
                <>
                  <Field label="Email institucional">
                    <Input
                      value={state.institutionalEmail}
                      onChange={(e) =>
                        set("institutionalEmail", e.target.value)
                      }
                      placeholder="cultura@entidad.gov.co"
                      className={INPUT_CLS}
                    />
                  </Field>
                  <Field label="Teléfono institucional">
                    <Input
                      value={state.institutionalPhone}
                      onChange={(e) =>
                        set("institutionalPhone", e.target.value)
                      }
                      placeholder="+57 8 2611170"
                      className={INPUT_CLS}
                    />
                  </Field>
                </>
              )}
            </div>
          </ControlSection>

          {/* ─── Presencia digital ─── */}
          <ControlSection title="Presencia digital" defaultOpen={false}>
            <div className="space-y-3">
              <Field label="Sitio web">
                <Input
                  value={state.website}
                  onChange={(e) => set("website", e.target.value)}
                  placeholder="https://ejemplo.com"
                  className={INPUT_CLS}
                />
              </Field>
              {(["instagram", "facebook", "tiktok", "youtube", "twitter", "linkedin"] as SocialPlatform[]).map(
                (platform) => (
                  <Field key={platform} label={SOCIAL_LABELS[platform]}>
                    <Input
                      value={state.socialUrls[platform]}
                      onChange={(e) => setSocial(platform, e.target.value)}
                      placeholder={`https://${platform}.com/...`}
                      className={INPUT_CLS}
                    />
                  </Field>
                ),
              )}
            </div>
          </ControlSection>

          {/* ─── Ubicación ─── */}
          <ControlSection title="Ubicación" defaultOpen={false}>
            <div className="space-y-3">
              <Field label="Enlace de Google Maps">
                <Input
                  value={state.mapsLink}
                  onChange={(e) => set("mapsLink", e.target.value)}
                  placeholder="https://maps.google.com/?q=..."
                  className={INPUT_CLS}
                />
              </Field>
              <p className="text-[10px] text-white/30">
                El mapa se mostrará en el ProfileHeader como "Ver en mapa".
              </p>
            </div>
          </ControlSection>

          {/* ─── Métricas & Insignias ─── */}
          <ControlSection title="Métricas & Insignias" defaultOpen={false}>
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <Field label="Eventos">
                  <Input
                    type="number"
                    min={0}
                    value={state.eventsCount}
                    onChange={(e) =>
                      set("eventsCount", Number(e.target.value))
                    }
                    className={INPUT_CLS}
                  />
                </Field>
                <Field label="Sitios">
                  <Input
                    type="number"
                    min={0}
                    value={state.sitesCount}
                    onChange={(e) =>
                      set("sitesCount", Number(e.target.value))
                    }
                    className={INPUT_CLS}
                  />
                </Field>
                <Field label="Insignias (stats)">
                  <Input
                    type="number"
                    min={0}
                    value={state.badgesCount}
                    onChange={(e) =>
                      set("badgesCount", Number(e.target.value))
                    }
                    className={INPUT_CLS}
                  />
                </Field>
              </div>
              <SwitchField
                label="Tiene insignias"
                description="Muestra badges reales en la sección de insignias"
                checked={state.hasBadges}
                onCheckedChange={(v) => set("hasBadges", v)}
              />
            </div>
          </ControlSection>

          {/* Info del estado actual */}
          <div className="rounded-lg border border-white/8 bg-white/3 p-3">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-white/30">
              Estado actual
            </p>
            <div className="space-y-1 text-[10px] text-white/40 font-mono">
              <div>role: <span className="text-primary/70">{state.role}</span></div>
              {state.professionalType && (
                <div>
                  professionalType:{" "}
                  <span className="text-primary/70">{state.professionalType}</span>
                </div>
              )}
              {state.professionalType === "organizer" && (
                <div>
                  organizerType:{" "}
                  <span className="text-primary/70">{state.organizerType}</span>
                </div>
              )}
              <div>
                emailVerified:{" "}
                <span className={state.emailVerified ? "text-emerald-400" : "text-red-400"}>
                  {String(state.emailVerified)}
                </span>
              </div>
              <div>
                uid (mock): <span className="text-white/25">{mockUser.uid}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Panel de preview ── */}
        <div className="flex-1 border-t border-white/10 bg-zinc-950/50 p-4 md:border-l md:border-t-0">
          <div className="sticky top-[52px] max-h-[calc(100vh-52px)] overflow-y-auto">
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-white/30">
              Vista previa — ProfileHeader real
            </p>
            {/* Inyección del mock user vía AuthContext.Provider */}
            <AuthContext.Provider value={mockAuthValue}>
              <ProfileHeader
                key={mockUser.uid}
                statsPromise={mockStatsPromise}
                badgesPromise={mockBadgesPromise}
              />
            </AuthContext.Provider>
          </div>
        </div>
      </div>
    </div>
  );
}
