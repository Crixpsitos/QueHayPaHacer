import type { RegistrationType } from "@/domain/entities/studio/Studio";

export const REGISTRATION_TYPE_LABEL: Record<RegistrationType, string> = {
  none: "Informativo",
  internal: "Interno",
  external: "Externo",
  form: "Formulario",
};

export const REGISTRATION_TYPE_DESCRIPTION: Record<RegistrationType, string> = {
  none: "Evento solo informativo, sin registro.",
  internal: "Registro dentro de la plataforma.",
  external: "El registro se hace en una URL externa.",
  form: "Registro con formulario personalizado (exclusivo profesional).",
};
