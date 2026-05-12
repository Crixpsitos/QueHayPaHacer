interface BaseCTA {
  id: string;

  label: string;

  variant?: "default" | "outline" | "ghost";

  disabled?: boolean;

  icon?: string;
}

export interface CtaNavigateEntity {
    resource: string;
    path: string;
    params?: Record<string, string | number | boolean>;
}

export type CtaExternalLinkEntity = CtaNavigateEntity & {
  target: "_blank" | "_self" | "_parent" | "_top";
  rel?: string;
};

interface NavigateCTA extends BaseCTA {
  type: "navigate";
  entity: CtaNavigateEntity;
}

interface ExternalLinkCTA extends BaseCTA {
  type: "external_link";
  entity: CtaExternalLinkEntity;
}

export type CTA = NavigateCTA | ExternalLinkCTA;
