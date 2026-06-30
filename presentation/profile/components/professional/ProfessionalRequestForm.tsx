"use client";

import { useEffect, useMemo, useState } from "react";
import { Briefcase, Building2, Landmark, Phone } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/app/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { MultiSelect } from "@/app/components/ui/multi-select";
import { submitProfessionalRequestAction } from "@/app/actions/professional/submit-professional-request.action";
import { notify } from "@/presentation/shared/lib/notify";
import type { BusinessCategory, ProfessionalRequest, ProfessionalType } from "@/domain/entities/professional/ProfessionalRequest";
import type { SubmitProfessionalRequestDto } from "@/application/dto/professional/ProfessionalRequestDto";

interface ProfessionalRequestFormProps {
  uid: string;
  defaultUsername: string;
  defaultPhone: string;
  isReapply: boolean;
  previousRequest: ProfessionalRequest | null;
  onCancel: () => void;
  onSubmitted: () => void;
}

const PROFESSIONAL_TYPE_OPTIONS: { value: ProfessionalType; label: string; description: string; icon: typeof Briefcase }[] = [
  { value: "organizer", label: "Organizador", description: "Personas o empresas que organizan eventos", icon: Briefcase },
  { value: "business", label: "Negocio", description: "Bares, cafés, restaurantes y similares", icon: Building2 },
  { value: "government", label: "Entidad gubernamental", description: "Alcaldías, gobernaciones, dependencias", icon: Landmark },
];

const BUSINESS_CATEGORY_OPTIONS: { value: BusinessCategory; label: string }[] = [
  { value: "bar", label: "Bar" },
  { value: "cafe", label: "Café" },
  { value: "restaurante", label: "Restaurante" },
  { value: "discoteca", label: "Discoteca / Club nocturno" },
  { value: "hotel", label: "Hotel" },
  { value: "teatro_cine", label: "Teatro / Cine" },
  { value: "museo_galeria", label: "Museo / Galería" },
  { value: "parque_tematico", label: "Parque temático" },
  { value: "gimnasio", label: "Gimnasio" },
  { value: "spa_bienestar", label: "Spa / Bienestar" },
  { value: "salon_eventos", label: "Salón de eventos" },
  { value: "tienda", label: "Tienda" },
  { value: "otro", label: "Otro" },
];

interface CategoryOption {
  value: string;
  label: string;
}

export function ProfessionalRequestForm({
  uid,
  defaultUsername,
  defaultPhone,
  isReapply,
  previousRequest,
  onCancel,
  onSubmitted,
}: ProfessionalRequestFormProps) {
  const [username, setUsername] = useState(defaultUsername);
  const [brandName, setBrandName] = useState(previousRequest?.brandName ?? "");
  const [description, setDescription] = useState(previousRequest?.description ?? "");
  const [phone, setPhone] = useState(previousRequest?.phone ?? "");
  const [website, setWebsite] = useState(previousRequest?.website ?? "");
  const [professionalType, setProfessionalType] = useState<ProfessionalType | "">(
    previousRequest?.professionalType ?? "",
  );
  const [reapplyReason, setReapplyReason] = useState("");

  const [organizerType, setOrganizerType] = useState<"persona_natural" | "empresa" | "">(
    previousRequest?.professionalType === "organizer" && "organizerType" in previousRequest.details
      ? previousRequest.details.organizerType
      : "",
  );
  const [nit, setNit] = useState(
    previousRequest?.professionalType === "organizer" && "nit" in previousRequest.details
      ? previousRequest.details.nit ?? ""
      : "",
  );
  const [eventCategories, setEventCategories] = useState<string[]>(
    previousRequest?.professionalType === "organizer" && "eventCategories" in previousRequest.details
      ? previousRequest.details.eventCategories
      : [],
  );

  const [businessCategory, setBusinessCategory] = useState<BusinessCategory | "">(
    previousRequest?.professionalType === "business" && "businessCategory" in previousRequest.details
      ? previousRequest.details.businessCategory
      : "",
  );
  const [businessDescription, setBusinessDescription] = useState(
    previousRequest?.professionalType === "business" && "businessDescription" in previousRequest.details
      ? previousRequest.details.businessDescription ?? ""
      : "",
  );
  const [mapsLink, setMapsLink] = useState(
    previousRequest?.professionalType === "business" && "mapsLink" in previousRequest.details
      ? previousRequest.details.mapsLink ?? ""
      : "",
  );
  const [socialLink, setSocialLink] = useState(
    previousRequest?.professionalType === "business" && "socialLink" in previousRequest.details
      ? previousRequest.details.socialLink ?? ""
      : "",
  );

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
    previousRequest?.professionalType === "government" && "institutionalEmail" in previousRequest.details
      ? previousRequest.details.institutionalEmail
      : "",
  );

  const [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const response = await fetch("/api/categories");
        const data = await response.json();
        if (!mounted || !Array.isArray(data)) return;
        setCategoryOptions(
          data.map((category: { slug: string; title: string }) => ({
            value: category.slug,
            label: category.title,
          })),
        );
      } catch {
        // si falla, el multiselect simplemente queda sin opciones
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const useProfilePhone = () => setPhone(defaultPhone);

  const isValid = useMemo(() => {
    if (!username.trim() || !brandName.trim() || !description.trim() || !phone.trim() || !professionalType) {
      return false;
    }
    if (isReapply && !reapplyReason.trim()) {
      return false;
    }
    if (professionalType === "organizer") {
      if (!organizerType || eventCategories.length === 0) return false;
      if (organizerType === "empresa" && !nit.trim()) return false;
      return true;
    }
    if (professionalType === "business") {
      if (!businessCategory) return false;
      if (businessCategory === "otro" && !businessDescription.trim()) return false;
      return true;
    }
    if (professionalType === "government") {
      return Boolean(entityName.trim() && department.trim() && institutionalEmail.trim());
    }
    return false;
  }, [
    username,
    brandName,
    description,
    phone,
    professionalType,
    isReapply,
    reapplyReason,
    organizerType,
    nit,
    eventCategories,
    businessCategory,
    businessDescription,
    entityName,
    department,
    institutionalEmail,
  ]);

  const handleSubmit = async () => {
    if (!professionalType || !isValid) return;

    setIsSubmitting(true);
    setFormError(null);

    const common = {
      uid,
      username: username.trim(),
      brandName: brandName.trim(),
      description: description.trim(),
      phone: phone.trim(),
      website: website.trim() || null,
      previousRequestId: null,
      reapplyReason: isReapply ? reapplyReason.trim() : null,
    };

    let payload: SubmitProfessionalRequestDto;

    if (professionalType === "organizer") {
      payload = {
        ...common,
        professionalType: "organizer",
        details: {
          organizerType: organizerType as "persona_natural" | "empresa",
          nit: organizerType === "empresa" ? nit.trim() || null : null,
          eventCategories,
        },
      };
    } else if (professionalType === "business") {
      payload = {
        ...common,
        professionalType: "business",
        details: {
          businessCategory: businessCategory as BusinessCategory,
          businessDescription: businessCategory === "otro" ? businessDescription.trim() || null : null,
          mapsLink: mapsLink.trim() || null,
          socialLink: socialLink.trim() || null,
        },
      };
    } else {
      payload = {
        ...common,
        professionalType: "government",
        details: {
          entityName: entityName.trim(),
          department: department.trim(),
          institutionalEmail: institutionalEmail.trim(),
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

    notify.success("Solicitud enviada. Te avisaremos cuando sea revisada.");
    setIsSubmitting(false);
    onSubmitted();
  };

  return (
    <div className="space-y-6">
      {isReapply && (
        <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-4 dark:border-amber-900/50 dark:bg-amber-950/20">
          <p className="text-sm font-medium text-amber-900 dark:text-amber-300">Vuelve a solicitar</p>
          <p className="mt-1 text-sm text-amber-800 dark:text-amber-400">
            Edita lo que necesites corregir y explica qué cambiaste respecto a tu solicitud anterior.
          </p>
        </div>
      )}

      <FormField label="Nombre de usuario">
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">@</span>
          <Input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="h-11 pl-8"
            placeholder="tu_usuario"
          />
        </div>
      </FormField>

      <FormField label="Nombre de la marca o entidad">
        <Input
          value={brandName}
          onChange={(e) => setBrandName(e.target.value)}
          className="h-11"
          placeholder="Ej. Discoteca La Movida"
        />
      </FormField>

      <FormField label="Descripción breve" description="Qué hacen, qué tipo de eventos organizan">
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="Cuéntanos sobre tu marca o entidad"
        />
      </FormField>

      <FormField label="Teléfono de contacto">
        <div className="flex gap-2">
          <Input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="h-11 flex-1"
            placeholder="Número de contacto"
          />
          {defaultPhone && phone !== defaultPhone && (
            <Button type="button" variant="outline" onClick={useProfilePhone} className="h-11 shrink-0 gap-1.5 px-3 text-xs">
              <Phone className="size-3.5" />
              Usar el de mi perfil
            </Button>
          )}
        </div>
      </FormField>

      <FormField label="Sitio web o red social principal" description="Opcional">
        <Input
          value={website ?? ""}
          onChange={(e) => setWebsite(e.target.value)}
          className="h-11"
          placeholder="https://..."
        />
      </FormField>

      <FormField label="Tipo de cuenta profesional">
        <RadioGroup
          value={professionalType}
          onValueChange={(value) => setProfessionalType(value as ProfessionalType)}
          className="gap-2"
        >
          {PROFESSIONAL_TYPE_OPTIONS.map((option) => (
            <label
              key={option.value}
              className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
                professionalType === option.value ? "border-foreground bg-muted/40" : "border-border hover:bg-muted/30"
              }`}
            >
              <RadioGroupItem value={option.value} />
              <option.icon className="h-4 w-4 shrink-0" />
              <div>
                <p className="text-sm font-medium">{option.label}</p>
                <p className="text-xs text-muted-foreground">{option.description}</p>
              </div>
            </label>
          ))}
        </RadioGroup>
      </FormField>

      {professionalType === "organizer" && (
        <div className="space-y-4 rounded-lg border border-border p-4">
          <FormField label="¿Eres persona natural o empresa?">
            <RadioGroup
              value={organizerType}
              onValueChange={(value) => setOrganizerType(value as "persona_natural" | "empresa")}
              className="grid-cols-2"
            >
              <label className="flex items-center gap-2 rounded-lg border border-border p-3 text-sm">
                <RadioGroupItem value="persona_natural" />
                Persona natural
              </label>
              <label className="flex items-center gap-2 rounded-lg border border-border p-3 text-sm">
                <RadioGroupItem value="empresa" />
                Empresa
              </label>
            </RadioGroup>
          </FormField>

          {organizerType === "empresa" && (
            <FormField label="NIT de la empresa">
              <Input value={nit} onChange={(e) => setNit(e.target.value)} className="h-11" placeholder="Ej. 900123456-7" />
            </FormField>
          )}

          <FormField label="Categorías de eventos que organizas">
            <MultiSelect
              options={categoryOptions}
              value={eventCategories}
              onValueChange={setEventCategories}
              placeholder="Selecciona categorías..."
            />
          </FormField>
        </div>
      )}

      {professionalType === "business" && (
        <div className="space-y-4 rounded-lg border border-border p-4">
          <FormField label="Categoría del negocio">
            <Select value={businessCategory} onValueChange={(value) => setBusinessCategory(value as typeof businessCategory)}>
              <SelectTrigger className="h-11 w-full">
                <SelectValue placeholder="Selecciona una categoría" />
              </SelectTrigger>
              <SelectContent>
                {BUSINESS_CATEGORY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          {businessCategory === "otro" && (
            <FormField label="Describa su negocio">
              <Textarea
                value={businessDescription}
                onChange={(e) => setBusinessDescription(e.target.value)}
                rows={2}
                placeholder="Cuéntanos a qué se dedica tu negocio"
              />
            </FormField>
          )}

          <FormField label="Enlace de Google Maps o ubicación" description="Opcional">
            <Input value={mapsLink} onChange={(e) => setMapsLink(e.target.value)} className="h-11" placeholder="https://maps.app..." />
          </FormField>

          <FormField label="Instagram o Facebook del negocio" description="Opcional">
            <Input value={socialLink} onChange={(e) => setSocialLink(e.target.value)} className="h-11" placeholder="https://instagram.com/..." />
          </FormField>
        </div>
      )}

      {professionalType === "government" && (
        <div className="space-y-4 rounded-lg border border-border p-4">
          <FormField label="Nombre exacto de la entidad" description="Ej. Alcaldía de Ibagué, Gobernación del Tolima">
            <Input value={entityName} onChange={(e) => setEntityName(e.target.value)} className="h-11" />
          </FormField>

          <FormField label="Dependencia" description="Ej. Secretaría de Cultura, IDCT">
            <Input value={department} onChange={(e) => setDepartment(e.target.value)} className="h-11" />
          </FormField>

          <FormField label="Correo institucional" description="Ej. nombre@ibague.gov.co">
            <Input
              type="email"
              value={institutionalEmail}
              onChange={(e) => setInstitutionalEmail(e.target.value)}
              className="h-11"
            />
          </FormField>
        </div>
      )}

      {isReapply && (
        <FormField label="¿Qué corregiste?" description="Explica qué cambiaste respecto a tu solicitud anterior">
          <Textarea
            value={reapplyReason}
            onChange={(e) => setReapplyReason(e.target.value)}
            rows={3}
            placeholder="Ej. Actualicé el teléfono de contacto y corregí el nombre de la entidad"
          />
        </FormField>
      )}

      {formError && <p className="text-sm font-medium text-destructive">{formError}</p>}

      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={onCancel} className="h-11 flex-1" disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button
          type="button"
          onClick={() => void handleSubmit()}
          disabled={!isValid || isSubmitting}
          className="h-11 flex-1 font-semibold"
        >
          {isSubmitting ? "Enviando..." : "Enviar solicitud"}
        </Button>
      </div>
    </div>
  );
}

function FormField({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">{label}</label>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
      {children}
    </div>
  );
}
