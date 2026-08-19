import { Mail, MapPin, Link as LinkIcon, Globe, Award, Briefcase, Landmark, Phone, Tag } from "lucide-react";
import type {
  ProfessionalRequestDetails,
  ProfessionalType,
  BusinessDetails,
  GovernmentDetails,
  OrganizerDetails,
} from "@/domain/entities/professional/ProfessionalRequest";
import { BUSINESS_CATEGORY_LABEL } from "../lib/professionalType";

interface ProfessionalDetailsCardProps {
  details?: ProfessionalRequestDetails;
  professionalType: ProfessionalType | null;
  brandName?: string;
  website?: string;
  mapsLink?: string;
  socialLink?: string;
}

const TYPE_BADGE: Record<
  ProfessionalType,
  { icon: typeof Award; label: string; className: string }
> = {
  organizer: {
    icon: Award,
    label: "Organizador",
    className:
      "bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300",
  },
  business: {
    icon: Briefcase,
    label: "Negocio",
    className:
      "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
  },
  government: {
    icon: Landmark,
    label: "Entidad Gubernamental",
    className:
      "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
  },
};

export function ProfessionalDetailsCard({
  details,
  professionalType,
  brandName,
  website,
  mapsLink,
  socialLink,
}: ProfessionalDetailsCardProps) {
  if (!details && !brandName) return null;

  const businessDetails =
    professionalType === "business" ? (details as BusinessDetails | undefined) : null;
  const organizerDetails =
    professionalType === "organizer" ? (details as OrganizerDetails | undefined) : null;
  const governmentDetails =
    professionalType === "government" ? (details as GovernmentDetails | undefined) : null;

  const categoryLabel = businessDetails
    ? BUSINESS_CATEGORY_LABEL[businessDetails.businessCategory]
    : null;
  const eventCategoriesCount = organizerDetails?.eventCategories?.length ?? 0;

  const links: { icon: typeof MapPin; url: string; label: string; color: string }[] = [];

  if (mapsLink) {
    links.push({ icon: MapPin, url: mapsLink, label: "Ubicación", color: "text-red-500" });
  }

  if (socialLink) {
    const isFacebook = socialLink.includes("facebook");
    links.push({
      icon: LinkIcon,
      url: socialLink,
      label: isFacebook ? "Facebook" : "Instagram",
      color: isFacebook ? "text-blue-600" : "text-pink-500",
    });
  }

  if (website) {
    links.push({ icon: Globe, url: website, label: "Sitio web", color: "text-violet-500" });
  }

  const badge = professionalType ? TYPE_BADGE[professionalType] : null;

  return (
    <div className="rounded-2xl border border-border/40 bg-linear-to-br from-brand-violet/5 via-transparent to-brand-orange/5 p-4 sm:p-5">
      <div className="flex flex-col gap-4">
        {/* Encabezado: marca + badge de tipo */}
        <div className="flex flex-wrap items-center gap-2">
          {badge && (
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${badge.className}`}
            >
              <badge.icon className="h-3.5 w-3.5" />
              {badge.label}
            </span>
          )}
          {categoryLabel && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/60 px-3 py-1.5 text-xs font-medium text-muted-foreground">
              <Tag className="h-3.5 w-3.5" />
              {categoryLabel}
            </span>
          )}
          {eventCategoriesCount > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/60 px-3 py-1.5 text-xs font-medium text-muted-foreground">
              <Tag className="h-3.5 w-3.5" />
              {eventCategoriesCount}{" "}
              {eventCategoriesCount === 1 ? "categoría" : "categorías"} de eventos
            </span>
          )}
        </div>

        {brandName && (
          <p className="text-sm font-semibold text-foreground">{brandName}</p>
        )}

        {/* Detalle de gobierno: dependencia, correo, teléfono */}
        {governmentDetails && (
          <div className="flex flex-col gap-1.5">
            {governmentDetails.department && (
              <span className="text-xs text-muted-foreground">{governmentDetails.department}</span>
            )}
            <div className="flex flex-wrap gap-2 mt-0.5">
              {governmentDetails.institutionalEmail && (
                <a
                  href={`mailto:${governmentDetails.institutionalEmail}`}
                  className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Mail className="size-3.5 shrink-0" aria-hidden />
                  {governmentDetails.institutionalEmail}
                </a>
              )}
              {governmentDetails.institutionalPhone && (
                <a
                  href={`tel:${governmentDetails.institutionalPhone}`}
                  className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Phone className="size-3.5 shrink-0" aria-hidden />
                  {governmentDetails.institutionalPhone}
                </a>
              )}
            </div>
          </div>
        )}

        {/* Enlaces */}
        {links.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {links.map((link, idx) => (
              <a
                key={idx}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-border/40 bg-background/50 px-3 py-2 text-xs font-medium transition-colors hover:border-border hover:bg-background"
              >
                <link.icon className={`h-4 w-4 ${link.color}`} />
                {link.label}
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
