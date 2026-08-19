"use client";

import { useEffect, useId, useMemo, useState } from "react";
import {
  Briefcase,
  Building2,
  CalendarDays,
  Check,
  ChevronDown,
  Clock,
  Coffee,
  Dumbbell,
  Film,
  GlassWater,
  Globe,
  Info,
  Landmark,
  Loader2,
  Mail,
  Music,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Tag,
  Trees,
  TriangleAlert,
  UserCircle,
  UtensilsCrossed,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/app/components/ui/radio-group";
import { MultiSelect } from "@/app/components/ui/multi-select";
import { submitProfessionalRequestAction } from "@/app/actions/professional/submit-professional-request.action";
import { checkUsernameAvailabilityAction } from "@/app/actions/professional/check-username-availability.action";
import { generateUsername } from "@/app/lib/utils/generateUsername";
import { BUSINESS_CATEGORY_LABEL } from "../../lib/professionalType";
import { notify } from "@/presentation/shared/lib/notify";
import { cn } from "@/app/lib/utils/cn";
import type {
  BusinessCategory,
  GovernmentDetails,
  ProfessionalRequest,
  ProfessionalType,
} from "@/domain/entities/professional/ProfessionalRequest";
import type { SubmitProfessionalRequestDto } from "@/application/dto/professional/ProfessionalRequestDto";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProfessionalRequestFormProps {
  uid: string;
  defaultUsername: string;
  defaultPhone: string;
  /** Website actual del perfil del usuario — single source of truth */
  defaultWebsite: string;
  isReapply: boolean;
  previousRequest: ProfessionalRequest | null;
  onCancel: () => void;
  onSubmitted: () => void;
}

interface CategoryOption {
  value: string;
  label: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const BUSINESS_CATEGORY_OPTIONS: {
  value: BusinessCategory;
  label: string;
  icon: React.ElementType;
}[] = [
  { value: "bar",             label: "Bar",                  icon: GlassWater },
  { value: "cafe",            label: "Café",                 icon: Coffee },
  { value: "restaurante",     label: "Restaurante",          icon: UtensilsCrossed },
  { value: "discoteca",       label: "Discoteca / Club",     icon: Music },
  { value: "hotel",           label: "Hotel / Hostal",       icon: Building2 },
  { value: "teatro_cine",     label: "Teatro / Cine",        icon: Film },
  { value: "museo_galeria",   label: "Museo / Galería",      icon: Landmark },
  { value: "parque_tematico", label: "Parque / Naturaleza",  icon: Trees },
  { value: "gimnasio",        label: "Gimnasio",             icon: Dumbbell },
  { value: "spa_bienestar",   label: "Spa / Bienestar",      icon: Sparkles },
  { value: "salon_eventos",   label: "Salón de eventos",     icon: CalendarDays },
  { value: "tienda",          label: "Tienda",               icon: ShoppingBag },
  { value: "otro",            label: "Otro",                 icon: Tag },
];

const PROFESSIONAL_TYPE_OPTIONS: {
  value: ProfessionalType;
  label: string;
  description: string;
  icon: React.ElementType;
}[] = [
  {
    value: "organizer",
    label: "Organizador",
    description: "Personas u organizaciones que organizan eventos",
    icon: Briefcase,
  },
  {
    value: "business",
    label: "Negocio",
    description: "Bares, cafés, restaurantes y similares",
    icon: Building2,
  },
  {
    value: "government",
    label: "Entidad gubernamental",
    description: "Alcaldías, gobernaciones, dependencias",
    icon: Landmark,
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ProfessionalRequestForm({
  uid,
  defaultUsername,
  defaultPhone,
  defaultWebsite,
  isReapply,
  previousRequest,
  onCancel,
  onSubmitted,
}: ProfessionalRequestFormProps) {
  const formId = useId();

  // ── Estado compartido ──────────────────────────────────────────────────────
  const [professionalType, setProfessionalType] = useState<ProfessionalType | "">(
    previousRequest?.professionalType ?? "",
  );
  const [description, setDescription] = useState(previousRequest?.description ?? "");
  // Website pre-llenado desde el perfil del usuario (single source of truth)
  const [website, setWebsite] = useState(previousRequest?.website ?? defaultWebsite);
  const [phone, setPhone] = useState(previousRequest?.phone ?? "");
  const [brandName, setBrandName] = useState(previousRequest?.brandName ?? "");
  const [reapplyReason, setReapplyReason] = useState("");

  // ── Estado específico de Organizador ──────────────────────────────────────
  // Nombre visible del organizador; de aquí se genera el @handle automáticamente
  const [organizerDisplayName, setOrganizerDisplayName] = useState(
    previousRequest?.professionalType === "organizer"
      ? (previousRequest.brandName ?? "")
      : "",
  );
  const [organizerType, setOrganizerType] = useState<"natural_person" | "organization" | "">(
    previousRequest?.professionalType === "organizer" &&
      "organizerType" in previousRequest.details
      ? (previousRequest.details.organizerType as "natural_person" | "organization")
      : "",
  );
  const [organizationName, setOrganizationName] = useState(
    previousRequest?.professionalType === "organizer" &&
      "organizationName" in previousRequest.details
      ? (previousRequest.details.organizationName ?? "")
      : "",
  );
  const [nit, setNit] = useState(
    previousRequest?.professionalType === "organizer" && "nit" in previousRequest.details
      ? (previousRequest.details.nit ?? "")
      : "",
  );
  const [eventCategories, setEventCategories] = useState<string[]>(
    previousRequest?.professionalType === "organizer" &&
      "eventCategories" in previousRequest.details
      ? previousRequest.details.eventCategories
      : [],
  );

  // ── Estado específico de Negocio ──────────────────────────────────────────
  const [businessCategory, setBusinessCategory] = useState<BusinessCategory | "">(
    previousRequest?.professionalType === "business" &&
      "businessCategory" in previousRequest.details
      ? previousRequest.details.businessCategory
      : "",
  );
  const [mapsLink, setMapsLink] = useState(
    previousRequest?.professionalType === "business" && "mapsLink" in previousRequest.details
      ? (previousRequest.details.mapsLink ?? "")
      : "",
  );
  const [businessNit, setBusinessNit] = useState(
    previousRequest?.professionalType === "business" &&
      "nit" in previousRequest.details
      ? ((previousRequest.details as { nit?: string | null }).nit ?? "")
      : "",
  );
  const [businessPhone, setBusinessPhone] = useState(
    previousRequest?.professionalType === "business" &&
      "businessPhone" in previousRequest.details
      ? ((previousRequest.details as { businessPhone?: string | null }).businessPhone ?? "")
      : "",
  );
  const [bizCheckResult, setBizCheckResult] = useState<"available" | "taken" | null>(null);
  const [bizCheckedUsername, setBizCheckedUsername] = useState<string>("");

  // ── Estado específico de Gobierno ─────────────────────────────────────────
  const [entityName, setEntityName] = useState(
    previousRequest?.professionalType === "government" && "entityName" in previousRequest.details
      ? previousRequest.details.entityName
      : "",
  );
  const [department, setDepartment] = useState(
    previousRequest?.professionalType === "government" && "department" in previousRequest.details
      ? previousRequest.details.department
      : "",
  );
  const [institutionalEmail, setInstitutionalEmail] = useState(
    previousRequest?.professionalType === "government" &&
      "institutionalEmail" in previousRequest.details
      ? previousRequest.details.institutionalEmail
      : "",
  );
  const [govMapsLink, setGovMapsLink] = useState(
    previousRequest?.professionalType === "government" &&
      "mapsLink" in previousRequest.details
      ? ((previousRequest.details as GovernmentDetails).mapsLink ?? "")
      : "",
  );
  const [govNit, setGovNit] = useState(
    previousRequest?.professionalType === "government" && "nit" in previousRequest.details
      ? ((previousRequest.details as GovernmentDetails).nit ?? "")
      : "",
  );
  const [govCheckResult, setGovCheckResult] = useState<"available" | "taken" | null>(null);
  const [govCheckedUsername, setGovCheckedUsername] = useState<string>("");
  const [orgCheckResult, setOrgCheckResult] = useState<"available" | "taken" | null>(null);
  const [orgCheckedUsername, setOrgCheckedUsername] = useState<string>("");

  const [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Usernames generados automáticamente a partir del nombre profesional
  const businessGeneratedUsername = useMemo(() => generateUsername(brandName), [brandName]);
  const govGeneratedUsername = useMemo(() => generateUsername(entityName), [entityName]);
  const orgGeneratedUsername = useMemo(() => generateUsername(organizerDisplayName), [organizerDisplayName]);

  // Status derivado — sin setState síncrono en efectos
  const businessUsernameStatus = useMemo<"idle" | "checking" | "available" | "taken">(() => {
    if (!businessGeneratedUsername || businessGeneratedUsername.length < 3) return "idle";
    if (businessGeneratedUsername !== bizCheckedUsername || bizCheckResult === null) return "checking";
    return bizCheckResult;
  }, [businessGeneratedUsername, bizCheckedUsername, bizCheckResult]);

  const govUsernameStatus = useMemo<"idle" | "checking" | "available" | "taken">(() => {
    if (!govGeneratedUsername || govGeneratedUsername.length < 3) return "idle";
    if (govGeneratedUsername !== govCheckedUsername || govCheckResult === null) return "checking";
    return govCheckResult;
  }, [govGeneratedUsername, govCheckedUsername, govCheckResult]);

  const orgUsernameStatus = useMemo<"idle" | "checking" | "available" | "taken">(() => {
    if (!orgGeneratedUsername || orgGeneratedUsername.length < 3) return "idle";
    if (orgGeneratedUsername !== orgCheckedUsername || orgCheckResult === null) return "checking";
    return orgCheckResult;
  }, [orgGeneratedUsername, orgCheckedUsername, orgCheckResult]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const response = await fetch("/api/categories");
        const data: unknown = await response.json();
        if (!mounted || !Array.isArray(data)) return;
        setCategoryOptions(
          (data as { slug: string; title: string }[]).map((c) => ({
            value: c.slug,
            label: c.title,
          })),
        );
      } catch {
        // Si falla, el multiselect queda sin opciones cargadas
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Disponibilidad de username generado — debounce 500 ms
  useEffect(() => {
    if (professionalType !== "business") return;
    if (!businessGeneratedUsername || businessGeneratedUsername.length < 3) return;
    const timer = setTimeout(() => {
      void checkUsernameAvailabilityAction(businessGeneratedUsername, uid).then((res) => {
        setBizCheckedUsername(businessGeneratedUsername);
        setBizCheckResult(res.available ? "available" : "taken");
      });
    }, 500);
    return () => clearTimeout(timer);
  }, [businessGeneratedUsername, uid, professionalType]);

  useEffect(() => {
    if (professionalType !== "government") return;
    if (!govGeneratedUsername || govGeneratedUsername.length < 3) return;
    const timer = setTimeout(() => {
      void checkUsernameAvailabilityAction(govGeneratedUsername, uid).then((res) => {
        setGovCheckedUsername(govGeneratedUsername);
        setGovCheckResult(res.available ? "available" : "taken");
      });
    }, 500);
    return () => clearTimeout(timer);
  }, [govGeneratedUsername, uid, professionalType]);

  useEffect(() => {
    if (professionalType !== "organizer") return;
    if (!orgGeneratedUsername || orgGeneratedUsername.length < 3) return;
    const timer = setTimeout(() => {
      void checkUsernameAvailabilityAction(orgGeneratedUsername, uid).then((res) => {
        setOrgCheckedUsername(orgGeneratedUsername);
        setOrgCheckResult(res.available ? "available" : "taken");
      });
    }, 500);
    return () => clearTimeout(timer);
  }, [orgGeneratedUsername, uid, professionalType]);

  // ── Validación inline ─────────────────────────────────────────────────────
  const organizerDisplayNameError = useMemo<string | null>(() => {
    if (professionalType !== "organizer") return null;
    const val = organizerDisplayName.trim();
    if (!val) return "El nombre o identificador es obligatorio.";
    if (val.length < 2) return "Debe tener al menos 2 caracteres.";
    if (val.length > 80) return "Debe tener máximo 80 caracteres.";
    if (!orgGeneratedUsername || orgGeneratedUsername.length < 3)
      return "El nombre no produce un identificador válido. Añade más letras.";
    return null;
  }, [organizerDisplayName, orgGeneratedUsername, professionalType]);

  const descriptionError = useMemo<string | null>(() => {
    const val = description.trim();
    if (!val) return "La descripción es obligatoria.";
    if (val.length < 20) return `Mínimo 20 caracteres (${val.length}/20).`;
    if (val.length > 500) return `Máximo 500 caracteres (${val.length}/500).`;
    return null;
  }, [description]);

  const businessBrandNameError = useMemo<string | null>(() => {
    if (professionalType !== "business") return null;
    const val = brandName.trim();
    if (!val) return "El nombre comercial es obligatorio.";
    if (val.length < 2) return "Debe tener al menos 2 caracteres.";
    if (val.length > 80) return "Debe tener máximo 80 caracteres.";
    return null;
  }, [brandName, professionalType]);

  const websiteError = useMemo<string | null>(() => {
    const val = website.trim();
    if (!val) return null;
    if (!isValidUrl(val)) return "Ingresa una URL válida (ej. https://tusite.com).";
    return null;
  }, [website]);

  const entityNameError = useMemo<string | null>(() => {
    if (professionalType !== "government") return null;
    const val = entityName.trim();
    if (!val) return "El nombre de la entidad es obligatorio.";
    if (val.length < 3) return "Debe tener al menos 3 caracteres.";
    if (val.length > 100) return "Debe tener máximo 100 caracteres.";
    return null;
  }, [entityName, professionalType]);

  const departmentError = useMemo<string | null>(() => {
    if (professionalType !== "government") return null;
    const val = department.trim();
    if (!val) return "La dependencia es obligatoria.";
    if (val.length < 3) return "Debe tener al menos 3 caracteres.";
    if (val.length > 100) return "Debe tener máximo 100 caracteres.";
    return null;
  }, [department, professionalType]);

  const institutionalEmailError = useMemo<string | null>(() => {
    if (professionalType !== "government") return null;
    const val = institutionalEmail.trim();
    if (!val) return "El correo institucional es obligatorio.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) return "Ingresa un correo electrónico válido.";
    return null;
  }, [institutionalEmail, professionalType]);

  const govPhoneError = useMemo<string | null>(() => {
    if (professionalType !== "government") return null;
    if (!phone.trim()) return "El teléfono institucional es obligatorio.";
    return null;
  }, [phone, professionalType]);

  const govMapsLinkError = useMemo<string | null>(() => {
    const val = govMapsLink.trim();
    if (!val) return null;
    if (!isValidUrl(val)) return "Ingresa una URL válida (ej. https://maps.app.goo.gl/...).";
    return null;
  }, [govMapsLink]);

  // ── isValid ───────────────────────────────────────────────────────────────
  const isValid = useMemo(() => {
    if (!professionalType) return false;
    if (isReapply && !reapplyReason.trim()) return false;

    if (professionalType === "organizer") {
      if (organizerDisplayNameError || descriptionError || websiteError) return false;
      if (!organizerType) return false;
      if (organizerType === "organization") {
        if (!organizationName.trim()) return false;
        if (!nit.trim()) return false;
      }
      if (eventCategories.length === 0) return false;
      return true;
    }

    if (professionalType === "business") {
      if (businessBrandNameError || descriptionError) return false;
      if (!businessCategory) return false;
      return true;
    }

    if (professionalType === "government") {
      if (entityNameError || departmentError || institutionalEmailError || govPhoneError) return false;
      if (descriptionError || websiteError || govMapsLinkError) return false;
      return true;
    }

    return false;
  }, [
    professionalType,
    isReapply,
    reapplyReason,
    organizerDisplayNameError,
    descriptionError,
    websiteError,
    organizerType,
    organizationName,
    nit,
    eventCategories,
    businessBrandNameError,
    businessCategory,
    entityNameError,
    departmentError,
    institutionalEmailError,
    govPhoneError,
    govMapsLinkError,
  ]);

  // ── Acordeón de secciones ─────────────────────────────────────────────────
  const [openSections, setOpenSections] = useState<string[]>([]);

  const toggleSection = (id: string) =>
    setOpenSections((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );

  // Abre la sección identity al cambiar de tipo — reemplaza la llamada directa a setProfessionalType
  const handleTypeChange = (value: ProfessionalType) => {
    setProfessionalType(value);
    setOpenSections(["identity"]);
  };

  // ── Envío ─────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!professionalType || !isValid) return;
    setIsSubmitting(true);
    setFormError(null);

    let payload: SubmitProfessionalRequestDto;

    if (professionalType === "organizer") {
      payload = {
        uid,
        username: orgGeneratedUsername || defaultUsername,
        brandName: organizerDisplayName.trim() || orgGeneratedUsername || defaultUsername,
        description: description.trim(),
        phone: defaultPhone || "",
        website: website.trim() || null,
        previousRequestId: null,
        reapplyReason: isReapply ? reapplyReason.trim() : null,
        professionalType: "organizer",
        details: {
          organizerType: organizerType as "natural_person" | "organization",
          organizationName:
            organizerType === "organization" ? organizationName.trim() || null : null,
          nit: organizerType === "organization" ? nit.trim() || null : null,
          eventCategories,
        },
      };
    } else if (professionalType === "business") {
      payload = {
        uid,
        username: businessGeneratedUsername || defaultUsername,
        brandName: brandName.trim(),
        description: description.trim(),
        // Teléfono siempre desde el perfil del usuario, no se recopila en el form
        phone: defaultPhone || "",
        website: website.trim() || null,
        previousRequestId: null,
        reapplyReason: isReapply ? reapplyReason.trim() : null,
        professionalType: "business",
        details: {
          businessCategory: businessCategory as BusinessCategory,
          businessDescription: null,
          mapsLink: mapsLink.trim() || null,
          socialLink: null,
          nit: businessNit.trim() || null,
          businessPhone: businessPhone.trim() || null,
        },
      };
    } else {
      payload = {
        uid,
        username: govGeneratedUsername || defaultUsername,
        brandName: entityName.trim(),
        description: description.trim(),
        phone: phone.trim(),
        website: website.trim() || null,
        previousRequestId: null,
        reapplyReason: isReapply ? reapplyReason.trim() : null,
        professionalType: "government",
        details: {
          entityName: entityName.trim(),
          department: department.trim(),
          institutionalEmail: institutionalEmail.trim(),
          institutionalPhone: phone.trim(),
          mapsLink: govMapsLink.trim() || null,
          nit: govNit.trim() || null,
        },
      };
    }

    const result = await submitProfessionalRequestAction(payload);

    if (!result.success) {
      setFormError(result.error ?? "No se pudo enviar la solicitud.");
      notify.error(result.error ?? "No se pudo enviar la solicitud.");
      setIsSubmitting(false);
      return;
    }

    notify.success("¡Solicitud enviada! Te avisaremos cuando sea revisada.");
    setIsSubmitting(false);
    onSubmitted();
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-3">

      {/* ── Banner de re-solicitud (ámbar) ── */}
      {isReapply && (
        <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50/60 p-4 dark:border-amber-900/40 dark:bg-amber-950/20">
          <TriangleAlert
            className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400"
            aria-hidden
          />
          <div className="text-sm">
            <p className="font-semibold text-amber-900 dark:text-amber-300">
              Tu solicitud anterior fue rechazada
            </p>
            <p className="mt-1 text-amber-700 dark:text-amber-400">
              {previousRequest?.rejectionReason ??
                "Revisa la información, corrígela y explica al final qué cambiaste."}
            </p>
          </div>
        </div>
      )}

      {/* ── Tipo de cuenta profesional ── */}
      <AccordionSection
        id="type"
        formId={formId}
        icon={<Tag className="size-3.5" />}
        title="Tipo de cuenta profesional"
        isOpen={openSections.includes("type") || !professionalType}
        isComplete={!!professionalType}
        summary={
          professionalType === "organizer"
            ? "Organizador"
            : professionalType === "business"
              ? "Negocio"
              : professionalType === "government"
                ? "Entidad gubernamental"
                : ""
        }
        onToggle={() => toggleSection("type")}
      >
        <RadioGroup
          value={professionalType}
          onValueChange={(value) => handleTypeChange(value as ProfessionalType)}
          aria-label="Tipo de cuenta profesional"
          className="gap-2"
        >
          {PROFESSIONAL_TYPE_OPTIONS.map((option) => {
            const Icon = option.icon;
            const isSelected = professionalType === option.value;
            return (
              <label
                key={option.value}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-xl border-2 p-3.5 transition-all",
                  isSelected
                    ? "border-primary bg-primary/4"
                    : "border-border hover:bg-muted/40",
                )}
              >
                <RadioGroupItem value={option.value} className="sr-only" />
                <div
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors",
                    isSelected
                      ? "bg-primary/12 text-primary"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  <Icon className="size-4" aria-hidden />
                </div>
                <div className="min-w-0">
                  <p
                    className={cn(
                      "text-sm font-medium",
                      isSelected ? "text-foreground" : "text-foreground/80",
                    )}
                  >
                    {option.label}
                  </p>
                  <p className="text-xs text-muted-foreground">{option.description}</p>
                </div>
              </label>
            );
          })}
        </RadioGroup>
      </AccordionSection>

      {/* ════════════════════════════════════════════════════════════════════
          ORGANIZADOR
      ════════════════════════════════════════════════════════════════════ */}
      {professionalType === "organizer" && (
        <>
          {/* Progreso */}
          <SectionProgress
            completed={
              [
                organizerDisplayName.trim().length >= 2 &&
                  organizerDisplayNameError === null &&
                  description.trim().length >= 20 &&
                  descriptionError === null,
                organizerType !== "" &&
                  (organizerType !== "organization" ||
                    (organizationName.trim().length > 0 && nit.trim().length > 0)) &&
                  eventCategories.length > 0,
              ].filter(Boolean).length
            }
            total={2}
          />

          {/* 1. Identidad profesional */}
          <AccordionSection
            id="identity"
            formId={formId}
            icon={<UserCircle className="size-3.5" />}
            title="Identidad profesional"
            isOpen={openSections.includes("identity")}
            isComplete={
              organizerDisplayName.trim().length >= 2 &&
              organizerDisplayNameError === null &&
              description.trim().length >= 20 &&
              descriptionError === null
            }
            summary={
              orgGeneratedUsername
                ? `@${orgGeneratedUsername} · ${organizerDisplayName.trim()}`
                : organizerDisplayName.trim()
            }
            onToggle={() => toggleSection("identity")}
          >

            {/* Nombre del organizador → genera el @handle automáticamente */}
            <FieldRow
              id={`${formId}-organizer-name`}
              label="Nombre o Nombre comercial"
              hint="Tu nombre como organizador: cómo aparecerás en la plataforma. De aquí se genera tu @handle."
              required
              error={organizerDisplayName.trim().length > 0 ? organizerDisplayNameError : null}
              counter={{ current: organizerDisplayName.trim().length, max: 80 }}
            >
              <Input
                id={`${formId}-organizer-name`}
                value={organizerDisplayName}
                onChange={(e) => setOrganizerDisplayName(e.target.value)}
                className="h-11"
                placeholder="Eventos Ibagué"
                autoComplete="organization"
                aria-required
                aria-invalid={
                  organizerDisplayName.trim().length > 0 && organizerDisplayNameError !== null
                }
                aria-describedby={
                  [
                    `${formId}-organizer-name-hint`,
                    organizerDisplayName.trim().length > 0 && organizerDisplayNameError
                      ? `${formId}-organizer-name-err`
                      : "",
                  ]
                    .filter(Boolean)
                    .join(" ") || undefined
                }
              />
            </FieldRow>

            {orgGeneratedUsername.length >= 3 && (
              <UsernamePreview
                username={orgGeneratedUsername}
                status={orgUsernameStatus}
                hint="Se genera automáticamente a partir de tu nombre."
              />
            )}

            {/* Descripción profesional */}
            <FieldRow
              id={`${formId}-description`}
              label="Descripción profesional"
              hint="Cuéntanos qué tipo de eventos organizas. Esta información aparecerá en tu perfil público."
              required
              error={description.trim().length > 0 ? descriptionError : null}
              counter={{ current: description.trim().length, max: 500 }}
            >
              <Textarea
                id={`${formId}-description`}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Organizamos eventos de música, entretenimiento y experiencias culturales en Ibagué."
                className="resize-none"
                aria-required
                aria-invalid={description.trim().length > 0 && descriptionError !== null}
                aria-describedby={
                  [
                    `${formId}-description-hint`,
                    description.trim().length > 0 && descriptionError
                      ? `${formId}-description-err`
                      : "",
                  ]
                    .filter(Boolean)
                    .join(" ") || undefined
                }
              />
            </FieldRow>
          </AccordionSection>

          {/* 2. Sobre tu actividad */}
          <AccordionSection
            id="activity"
            formId={formId}
            icon={<CalendarDays className="size-3.5" />}
            title="Sobre tu actividad"
            isOpen={openSections.includes("activity")}
            isComplete={
              organizerType !== "" &&
              (organizerType !== "organization" ||
                (organizationName.trim().length > 0 && nit.trim().length > 0)) &&
              eventCategories.length > 0
            }
            summary={
              [
                organizerType === "natural_person"
                  ? "Persona natural"
                  : organizerType === "organization"
                    ? "Organización"
                    : "",
                eventCategories.length > 0
                  ? `${eventCategories.length} ${eventCategories.length === 1 ? "categoría" : "categorías"}`
                  : "",
              ]
                .filter(Boolean)
                .join(" · ")
            }
            onToggle={() => toggleSection("activity")}
          >
            <div className="space-y-1.5">
              <p
                id={`${formId}-org-type-label`}
                className="text-sm font-medium text-foreground"
              >
                Tipo de organizador{" "}
                <span className="text-primary" aria-hidden>
                  *
                </span>
              </p>
              <div
                className="grid grid-cols-2 gap-3"
                role="radiogroup"
                aria-labelledby={`${formId}-org-type-label`}
              >
                {(
                  [
                    {
                      value: "natural_person" as const,
                      label: "Persona natural",
                      description: "Organizas a título personal",
                      icon: UserCircle,
                    },
                    {
                      value: "organization" as const,
                      label: "Empresa u organización",
                      description: "Tiene razón social o NIT",
                      icon: Building2,
                    },
                  ] as const
                ).map(({ value, label, description: desc, icon: Icon }) => {
                  const isSelected = organizerType === value;
                  return (
                    <label
                      key={value}
                      className={cn(
                        "flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 p-4 text-center transition-all",
                        isSelected
                          ? "border-primary bg-primary/4"
                          : "border-border hover:bg-muted/40",
                      )}
                    >
                      <input
                        type="radio"
                        name={`${formId}-org-type`}
                        value={value}
                        checked={isSelected}
                        onChange={() => setOrganizerType(value)}
                        className="sr-only"
                        aria-label={label}
                      />
                      <div
                        className={cn(
                          "flex h-9 w-9 items-center justify-center rounded-lg",
                          isSelected
                            ? "bg-primary/12 text-primary"
                            : "bg-muted text-muted-foreground",
                        )}
                      >
                        <Icon className="size-5" aria-hidden />
                      </div>
                      <span className="text-sm font-medium leading-tight">{label}</span>
                      <span className="text-xs leading-tight text-muted-foreground">{desc}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Datos adicionales cuando es organización */}
            {organizerType === "organization" && (
              <div className="space-y-3 rounded-xl border border-border bg-muted/30 p-4">
                <FieldRow
                  id={`${formId}-org-name`}
                  label="Nombre de la organización"
                  hint="Nombre oficial o razón social de la empresa."
                  required
                >
                  <Input
                    id={`${formId}-org-name`}
                    value={organizationName}
                    onChange={(e) => setOrganizationName(e.target.value)}
                    className="h-11"
                    placeholder="Ej. Eventos Ibagué S.A.S."
                    aria-required
                    aria-describedby={`${formId}-org-name-hint`}
                  />
                </FieldRow>

                <FieldRow id={`${formId}-nit`} label="NIT" required>
                  <Input
                    id={`${formId}-nit`}
                    value={nit}
                    onChange={(e) => setNit(e.target.value)}
                    className="h-11"
                    placeholder="Ej. 900123456-7"
                    aria-required
                  />
                </FieldRow>
              </div>
            )}

            {/* Categorías de eventos */}
            <FieldRow
              id={`${formId}-categories`}
              label="Categorías de eventos"
              hint="Selecciona todas las categorías que describan los eventos que organizas."
              required
            >
              <MultiSelect
                options={categoryOptions}
                value={eventCategories}
                onValueChange={setEventCategories}
                placeholder="Selecciona categorías..."
              />
            </FieldRow>
          </AccordionSection>

          {/* 3. Referencia pública */}
          <AccordionSection
            id="contact"
            formId={formId}
            icon={<Globe className="size-3.5" />}
            title="Referencia pública"
            isOpen={openSections.includes("contact")}
            isComplete={false}
            summary={website.trim() || "Opcional"}
            onToggle={() => toggleSection("contact")}
          >
            <FieldRow
              id={`${formId}-website`}
              label="Sitio web o enlace público"
              hint="Opcional. Tu sitio web, Instagram, Facebook, Linktree o cualquier página pública."
              error={websiteError}
            >
              <div className="space-y-1.5">
                <Input
                  id={`${formId}-website`}
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="h-11"
                  placeholder="https://tusite.com"
                  type="url"
                  inputMode="url"
                  aria-invalid={websiteError !== null}
                  aria-describedby={
                    [
                      `${formId}-website-hint`,
                      websiteError ? `${formId}-website-err` : "",
                    ]
                      .filter(Boolean)
                      .join(" ") || undefined
                  }
                />
                {/* Indicador: valor proviene del perfil del usuario */}
                {website === defaultWebsite && defaultWebsite && (
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Info className="size-3 shrink-0" aria-hidden />
                    Este enlace proviene de tu perfil. Puedes modificarlo si lo deseas.
                  </p>
                )}
              </div>
            </FieldRow>
          </AccordionSection>

          {/* ¿Qué pasa después? */}
          <div className="rounded-xl border border-border bg-muted/40 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-background">
                <Clock className="size-4 text-muted-foreground" aria-hidden />
              </div>
              <div className="text-sm">
                <p className="font-medium text-foreground">¿Qué pasa después?</p>
                <p className="mt-1 text-muted-foreground">
                  Revisaremos tu solicitud para comprobar que la información esté completa.
                  Mientras esté en revisión podrás seguir usando tu cuenta normalmente.
                </p>
                <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="inline-flex h-2 w-2 rounded-full bg-amber-400" aria-hidden />
                  Estado inicial: En revisión
                </p>
              </div>
            </div>
          </div>
        </>
      )}
      {/* ════════════════════════════════════════════════════════════════════
          NEGOCIO
      ════════════════════════════════════════════════════════════════════ */}
      {professionalType === "business" && (
        <>
          {/* Progreso */}
          <SectionProgress
            completed={
              [
                brandName.trim().length >= 2 &&
                  businessBrandNameError === null &&
                  description.trim().length >= 20 &&
                  descriptionError === null,
                businessCategory !== "",
              ].filter(Boolean).length
            }
            total={2}
          />

          {/* 1. Información pública */}
          <AccordionSection
            id="identity"
            formId={formId}
            icon={<Building2 className="size-3.5" />}
            title="Información pública"
            isOpen={openSections.includes("identity")}
            isComplete={
              brandName.trim().length >= 2 &&
              businessBrandNameError === null &&
              description.trim().length >= 20 &&
              descriptionError === null
            }
            summary={
              businessGeneratedUsername
                ? `@${businessGeneratedUsername} · ${brandName.trim()}`
                : brandName.trim()
            }
            onToggle={() => toggleSection("identity")}
          >
            <FieldRow
              id={`${formId}-biz-brand`}
              label="Nombre comercial"
              hint="Es el nombre con el que las personas reconocerán tu negocio."
              required
              error={brandName.trim().length > 0 ? businessBrandNameError : null}
              counter={{ current: brandName.trim().length, max: 80 }}
            >
              <Input
                id={`${formId}-biz-brand`}
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                className="h-11"
                placeholder="Ej. Café El Portal, Restaurante Tolimense..."
                aria-required
                aria-invalid={brandName.trim().length > 0 && businessBrandNameError !== null}
                aria-describedby={`${formId}-biz-brand-hint`}
              />
            </FieldRow>

            {businessGeneratedUsername.length >= 3 && (
              <UsernamePreview
                username={businessGeneratedUsername}
                status={businessUsernameStatus}
                hint="Se genera automáticamente a partir del nombre comercial."
              />
            )}

            <FieldRow
              id={`${formId}-biz-desc`}
              label="¿Qué hace tu negocio?"
              hint="Cuéntanos brevemente qué ofreces y a qué te dedicas."
              required
              error={description.trim().length > 0 ? descriptionError : null}
              counter={{ current: description.trim().length, max: 500 }}
            >
              <Textarea
                id={`${formId}-biz-desc`}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Ej. Somos un restaurante especializado en comida típica del Tolima, con más de 10 años de tradición..."
                className="resize-none"
                aria-required
                aria-invalid={description.trim().length > 0 && descriptionError !== null}
                aria-describedby={`${formId}-biz-desc-hint`}
              />
            </FieldRow>
          </AccordionSection>

          {/* 2. Información del negocio */}
          <AccordionSection
            id="category"
            formId={formId}
            icon={<Tag className="size-3.5" />}
            title="Información del negocio"
            isOpen={openSections.includes("category")}
            isComplete={businessCategory !== ""}
            summary={businessCategory ? BUSINESS_CATEGORY_LABEL[businessCategory] : ""}
            onToggle={() => toggleSection("category")}
          >
            <div className="space-y-1.5">
              <p id={`${formId}-biz-cat-label`} className="text-sm font-medium text-foreground">
                Categoría del negocio{" "}
                <span className="text-primary" aria-hidden>
                  *
                </span>
              </p>
              <div
                className="grid grid-cols-3 gap-2 sm:grid-cols-4"
                role="radiogroup"
                aria-labelledby={`${formId}-biz-cat-label`}
              >
                {BUSINESS_CATEGORY_OPTIONS.map(({ value, label, icon: Icon }) => {
                  const isSelected = businessCategory === value;
                  return (
                    <label
                      key={value}
                      className={cn(
                        "flex cursor-pointer flex-col items-center gap-1.5 rounded-xl border-2 p-3 text-center transition-all",
                        isSelected
                          ? "border-primary bg-primary/4"
                          : "border-border hover:bg-muted/40",
                      )}
                    >
                      <input
                        type="radio"
                        name={`${formId}-biz-cat`}
                        value={value}
                        checked={isSelected}
                        onChange={() => setBusinessCategory(value)}
                        className="sr-only"
                        aria-label={label}
                      />
                      <Icon
                        className={cn(
                          "size-5",
                          isSelected ? "text-primary" : "text-muted-foreground",
                        )}
                        aria-hidden
                      />
                      <span className="text-xs font-medium leading-tight">{label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <FieldRow
              id={`${formId}-biz-maps`}
              label="Ubicación del negocio"
              hint="Opcional. Puedes agregar la ubicación ahora o completar el Sitio después."
            >
              <Input
                id={`${formId}-biz-maps`}
                value={mapsLink}
                onChange={(e) => setMapsLink(e.target.value)}
                className="h-11"
                placeholder="https://maps.app.goo.gl/..."
                type="url"
                inputMode="url"
                aria-describedby={`${formId}-biz-maps-hint`}
              />
            </FieldRow>
          </AccordionSection>

          {/* 3. Información adicional */}
          <AccordionSection
            id="additional"
            formId={formId}
            icon={<Globe className="size-3.5" />}
            title="Información adicional"
            isOpen={openSections.includes("additional")}
            isComplete={false}
            summary={website.trim() || "Opcional"}
            onToggle={() => toggleSection("additional")}
          >
            <FieldRow
              id={`${formId}-biz-web`}
              label="Sitio web"
              hint="Opcional. Puedes agregarlo ahora o hacerlo después desde tu perfil."
              error={websiteError}
            >
              <div className="space-y-1.5">
                <Input
                  id={`${formId}-biz-web`}
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="h-11"
                  placeholder="https://tunegocio.com"
                  type="url"
                  inputMode="url"
                  aria-invalid={websiteError !== null}
                  aria-describedby={`${formId}-biz-web-hint`}
                />
                {website === defaultWebsite && defaultWebsite && (
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Info className="size-3 shrink-0" aria-hidden />
                    Este enlace proviene de tu perfil. Puedes modificarlo si lo deseas.
                  </p>
                )}
              </div>
            </FieldRow>

            <FieldRow
              id={`${formId}-biz-phone`}
              label="Teléfono comercial"
              hint="Opcional. Número público del negocio. No se copia tu teléfono personal."
            >
              <Input
                id={`${formId}-biz-phone`}
                type="tel"
                inputMode="tel"
                value={businessPhone}
                onChange={(e) => setBusinessPhone(e.target.value)}
                className="h-11"
                placeholder="+57 310 000 0000"
                aria-describedby={`${formId}-biz-phone-hint`}
              />
            </FieldRow>
          </AccordionSection>

          {/* 4. Verificación */}
          <AccordionSection
            id="verification"
            formId={formId}
            icon={<ShieldCheck className="size-3.5" />}
            title="Verificación"
            isOpen={openSections.includes("verification")}
            isComplete={false}
            summary={businessNit.trim() || "Opcional"}
            onToggle={() => toggleSection("verification")}
          >
            <FieldRow
              id={`${formId}-biz-nit`}
              label="NIT"
              hint="Lo utilizaremos únicamente para comprobar la información del negocio. No aparecerá en tu perfil público."
            >
              <Input
                id={`${formId}-biz-nit`}
                value={businessNit}
                onChange={(e) => setBusinessNit(e.target.value)}
                className="h-11"
                placeholder="Ej. 900123456-7"
                aria-describedby={`${formId}-biz-nit-hint`}
              />
            </FieldRow>
          </AccordionSection>

          {/* ¿Qué pasa después? */}
          <div className="rounded-xl border border-border bg-muted/40 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-background">
                <Clock className="size-4 text-muted-foreground" aria-hidden />
              </div>
              <div className="text-sm">
                <p className="font-medium text-foreground">¿Qué pasa después?</p>
                <p className="mt-1 text-muted-foreground">
                  Revisaremos tu solicitud para comprobar que la información esté completa.
                  Mientras esté en revisión podrás seguir usando tu cuenta normalmente.
                </p>
                <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="inline-flex h-2 w-2 rounded-full bg-amber-400" aria-hidden />
                  Estado inicial: En revisión
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          ENTIDAD GUBERNAMENTAL
      ════════════════════════════════════════════════════════════════════ */}
      {professionalType === "government" && (
        <>
          {/* Progreso */}
          <SectionProgress
            completed={
              [
                entityName.trim().length >= 3 &&
                  entityNameError === null &&
                  department.trim().length >= 3 &&
                  departmentError === null &&
                  description.trim().length >= 20 &&
                  descriptionError === null,
                institutionalEmail.trim().length > 0 &&
                  institutionalEmailError === null &&
                  phone.trim().length > 0 &&
                  govPhoneError === null,
              ].filter(Boolean).length
            }
            total={2}
          />

          {/* 1. Identidad institucional */}
          <AccordionSection
            id="identity"
            formId={formId}
            icon={<Landmark className="size-3.5" />}
            title="Identidad institucional"
            isOpen={openSections.includes("identity")}
            isComplete={
              entityName.trim().length >= 3 &&
              entityNameError === null &&
              department.trim().length >= 3 &&
              departmentError === null &&
              description.trim().length >= 20 &&
              descriptionError === null
            }
            summary={
              entityName.trim()
                ? `${entityName.trim()}${department.trim() ? ` · ${department.trim()}` : ""}`
                : ""
            }
            onToggle={() => toggleSection("identity")}
          >
            <FieldRow
              id={`${formId}-entity-name`}
              label="Nombre de la entidad"
              hint='Nombre oficial. Ej. "Alcaldía de Ibagué", "Gobernación del Tolima".'
              required
              error={entityName.trim().length > 0 ? entityNameError : null}
              counter={{ current: entityName.length, max: 100 }}
            >
              <Input
                id={`${formId}-entity-name`}
                value={entityName}
                onChange={(e) => setEntityName(e.target.value)}
                className="h-11"
                placeholder="Alcaldía de Ibagué"
                autoComplete="organization"
                aria-required
                aria-invalid={entityName.trim().length > 0 && entityNameError !== null}
                aria-describedby={
                  [
                    `${formId}-entity-name-hint`,
                    entityName.trim().length > 0 && entityNameError ? `${formId}-entity-name-err` : "",
                  ].filter(Boolean).join(" ") || undefined
                }
              />
            </FieldRow>

            {govGeneratedUsername.length >= 3 && (
              <UsernamePreview
                username={govGeneratedUsername}
                status={govUsernameStatus}
                hint="Se genera automáticamente a partir del nombre de la entidad."
              />
            )}

            <FieldRow
              id={`${formId}-department`}
              label="Dependencia o área"
              hint='El área que representas. Ej. "Secretaría de Cultura", "IDCT".'
              required
              error={department.trim().length > 0 ? departmentError : null}
              counter={{ current: department.length, max: 100 }}
            >
              <Input
                id={`${formId}-department`}
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="h-11"
                placeholder="Secretaría de Cultura"
                aria-required
                aria-invalid={department.trim().length > 0 && departmentError !== null}
                aria-describedby={
                  [
                    `${formId}-department-hint`,
                    department.trim().length > 0 && departmentError ? `${formId}-department-err` : "",
                  ].filter(Boolean).join(" ") || undefined
                }
              />
            </FieldRow>

            <FieldRow
              id={`${formId}-gov-description`}
              label="¿Qué hace esta entidad o dependencia?"
              hint="Describe brevemente sus funciones, servicios o propósito."
              required
              error={description.trim().length > 0 ? descriptionError : null}
              counter={{ current: description.length, max: 500 }}
            >
              <Textarea
                id={`${formId}-gov-description`}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Cuéntanos qué hace esta entidad o dependencia..."
                className="resize-none"
                aria-required
                aria-invalid={description.trim().length > 0 && descriptionError !== null}
                aria-describedby={
                  [
                    `${formId}-gov-description-hint`,
                    description.trim().length > 0 && descriptionError
                      ? `${formId}-gov-description-err`
                      : "",
                  ].filter(Boolean).join(" ") || undefined
                }
              />
            </FieldRow>
          </AccordionSection>

          {/* 2. Contacto institucional */}
          <AccordionSection
            id="gov-contact"
            formId={formId}
            icon={<Mail className="size-3.5" />}
            title="Contacto institucional"
            isOpen={openSections.includes("gov-contact")}
            isComplete={
              institutionalEmail.trim().length > 0 &&
              institutionalEmailError === null &&
              phone.trim().length > 0 &&
              govPhoneError === null
            }
            summary={institutionalEmail.trim() || ""}
            onToggle={() => toggleSection("gov-contact")}
          >
            <FieldRow
              id={`${formId}-inst-email`}
              label="Correo institucional"
              hint="Será utilizado para verificar y contactar a la entidad."
              required
              error={institutionalEmail.trim().length > 0 ? institutionalEmailError : null}
            >
              <Input
                id={`${formId}-inst-email`}
                type="email"
                value={institutionalEmail}
                onChange={(e) => setInstitutionalEmail(e.target.value)}
                className="h-11"
                placeholder="nombre@ibague.gov.co"
                autoComplete="email"
                inputMode="email"
                aria-required
                aria-invalid={institutionalEmail.trim().length > 0 && institutionalEmailError !== null}
                aria-describedby={
                  [
                    `${formId}-inst-email-hint`,
                    institutionalEmail.trim().length > 0 && institutionalEmailError
                      ? `${formId}-inst-email-err`
                      : "",
                  ].filter(Boolean).join(" ") || undefined
                }
              />
            </FieldRow>

            <FieldRow
              id={`${formId}-inst-phone`}
              label="Teléfono institucional"
              hint="Número de contacto oficial de la entidad."
              required
              error={phone.trim().length > 0 ? govPhoneError : null}
            >
              <Input
                id={`${formId}-inst-phone`}
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="h-11"
                placeholder="+57 608 261 0000"
                autoComplete="tel"
                inputMode="tel"
                aria-required
                aria-invalid={phone.trim().length > 0 && govPhoneError !== null}
                aria-describedby={
                  [
                    `${formId}-inst-phone-hint`,
                    phone.trim().length > 0 && govPhoneError ? `${formId}-inst-phone-err` : "",
                  ].filter(Boolean).join(" ") || undefined
                }
              />
            </FieldRow>

            <FieldRow
              id={`${formId}-gov-website`}
              label="Sitio web oficial"
              hint="Opcional. Se mostrará en tu perfil profesional."
              error={websiteError}
            >
              <Input
                id={`${formId}-gov-website`}
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="h-11"
                placeholder="https://www.ibague.gov.co"
                autoComplete="url"
                inputMode="url"
                aria-describedby={
                  [
                    `${formId}-gov-website-hint`,
                    websiteError ? `${formId}-gov-website-err` : "",
                  ].filter(Boolean).join(" ") || undefined
                }
              />
            </FieldRow>

            <FieldRow
              id={`${formId}-gov-maps`}
              label="Ubicación oficial"
              hint="Opcional. Enlace de Google Maps de la sede principal."
              error={govMapsLinkError}
            >
              <Input
                id={`${formId}-gov-maps`}
                type="url"
                value={govMapsLink}
                onChange={(e) => setGovMapsLink(e.target.value)}
                className="h-11"
                placeholder="https://maps.app.goo.gl/..."
                inputMode="url"
                aria-describedby={
                  [
                    `${formId}-gov-maps-hint`,
                    govMapsLinkError ? `${formId}-gov-maps-err` : "",
                  ].filter(Boolean).join(" ") || undefined
                }
              />
            </FieldRow>

            <FieldRow
              id={`${formId}-gov-nit`}
              label="NIT"
              hint="Opcional. Número de Identificación Tributaria de la entidad."
            >
              <Input
                id={`${formId}-gov-nit`}
                value={govNit}
                onChange={(e) => setGovNit(e.target.value)}
                className="h-11"
                placeholder="900.123.456-7"
              />
            </FieldRow>
          </AccordionSection>

          {/* ¿Qué pasa después? */}
          <div className="rounded-xl border border-border bg-muted/40 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-background">
                <Clock className="size-4 text-muted-foreground" aria-hidden />
              </div>
              <div className="text-sm">
                <p className="font-medium text-foreground">¿Qué pasa después?</p>
                <p className="mt-1 text-muted-foreground">
                  Revisaremos la información para verificar que la entidad y la dependencia son reales.
                  Te notificaremos cuando el proceso termine.
                </p>
                <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="inline-flex h-2 w-2 rounded-full bg-amber-400" aria-hidden />
                  Estado inicial: En revisión
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Motivo de re-solicitud ── */}
      {isReapply && (
        <AccordionSection
          id="reapply"
          formId={formId}
          icon={<TriangleAlert className="size-3.5" />}
          title="¿Qué corregiste?"
          isOpen={openSections.includes("reapply")}
          isComplete={reapplyReason.trim().length > 0}
          summary={reapplyReason.trim().slice(0, 60) || ""}
          onToggle={() => toggleSection("reapply")}
        >
          <FieldRow
            id={`${formId}-reapply`}
            label="Explica qué cambiaste"
            hint="Describe qué información corregiste respecto a tu solicitud anterior."
            required
          >
            <Textarea
              id={`${formId}-reapply`}
              value={reapplyReason}
              onChange={(e) => setReapplyReason(e.target.value)}
              rows={3}
              placeholder="Ej. Actualicé el nombre comercial y la descripción de mis eventos"
              className="resize-none"
              aria-required
              aria-describedby={`${formId}-reapply-hint`}
            />
          </FieldRow>
        </AccordionSection>
      )}

      {/* ── Error global ── */}
      {formError && (
        <div
          role="alert"
          className="flex gap-2.5 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
        >
          <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
          {formError}
        </div>
      )}

      {/* ── Footer de acciones ── */}
      {professionalType && (
        <div className="flex items-center justify-between border-t border-border pt-4">
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            disabled={isSubmitting}
            className="text-muted-foreground"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={!isValid || isSubmitting}
            className="min-w-36 font-semibold"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
                Enviando...
              </>
            ) : isReapply ? (
              "Volver a solicitar"
            ) : (
              "Enviar solicitud"
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Sub-componentes internos ──────────────────────────────────────────────────

function SectionProgress({ completed, total }: { completed: number; total: number }) {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3 px-1">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-border">
        <div
          className="h-full rounded-full bg-primary transition-all duration-300"
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={completed}
          aria-valuemin={0}
          aria-valuemax={total}
          aria-label={`${completed} de ${total} secciones completadas`}
        />
      </div>
      <span className="shrink-0 text-xs text-muted-foreground">
        {completed} de {total}
      </span>
    </div>
  );
}

function AccordionSection({
  id,
  formId,
  icon,
  title,
  summary,
  isOpen,
  isComplete,
  onToggle,
  children,
}: {
  id: string;
  formId: string;
  icon: React.ReactNode;
  title: string;
  summary?: string;
  isOpen: boolean;
  isComplete?: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border transition-colors",
        isOpen ? "border-primary/25" : "border-border",
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          "flex w-full items-center gap-3 p-4 text-left transition-colors",
          isOpen
            ? "rounded-t-xl bg-primary/[0.02] hover:bg-primary/[0.04]"
            : "rounded-xl hover:bg-muted/40",
        )}
        aria-expanded={isOpen}
        aria-controls={`${formId}-section-${id}`}
      >
        <div
          className={cn(
            "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors",
            isComplete
              ? "bg-emerald-600 text-white"
              : isOpen
                ? "bg-primary/10 text-primary"
                : "bg-muted text-muted-foreground",
          )}
          aria-hidden
        >
          {isComplete ? <Check className="size-3.5" /> : icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">{title}</p>
          {!isOpen && summary && (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{summary}</p>
          )}
        </div>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform duration-200",
            isOpen && "rotate-180",
          )}
          aria-hidden
        />
      </button>
      <div
        id={`${formId}-section-${id}`}
        hidden={!isOpen}
        className={cn(isOpen && "space-y-4 rounded-b-xl border-t border-border p-4")}
      >
        {children}
      </div>
    </div>
  );
}

function FieldRow({
  id,
  label,
  hint,
  required,
  error,
  counter,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  required?: boolean;
  error?: string | null;
  counter?: { current: number; max: number };
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="text-sm font-medium text-foreground">
          {label}
          {required && (
            <span className="ml-0.5 text-primary" aria-hidden>
              *
            </span>
          )}
        </label>
        {counter && (
          <span className="text-xs tabular-nums text-muted-foreground" aria-live="polite">
            {counter.current}/{counter.max}
          </span>
        )}
      </div>
      {hint && (
        <p id={`${id}-hint`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}
      {children}
      {error && (
        <p id={`${id}-err`} role="alert" className="text-xs font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

function UsernamePreview({
  username,
  status,
  hint,
}: {
  username: string;
  status: "idle" | "checking" | "available" | "taken";
  hint: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-3.5 py-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-background">
        <UserCircle className="size-4 text-muted-foreground" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-mono text-sm font-semibold text-foreground">
          @{username || "…"}
        </p>
        {status === "idle" && (
          <p className="text-xs text-muted-foreground">{hint}</p>
        )}
        {status === "checking" && (
          <p className="flex items-center gap-1 text-xs text-muted-foreground" aria-live="polite">
            <Loader2 className="size-3 animate-spin" aria-hidden />
            Verificando disponibilidad…
          </p>
        )}
        {status === "available" && (
          <p className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400" aria-live="polite">
            <Check className="size-3" aria-hidden />
            Disponible
          </p>
        )}
        {status === "taken" && (
          <p className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400" aria-live="polite">
            <TriangleAlert className="size-3" aria-hidden />
            En uso — se asignará una alternativa automáticamente.
          </p>
        )}
      </div>
    </div>
  );
}
