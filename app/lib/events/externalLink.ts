export const EXTERNAL_BUTTON_LABEL_MAX = 30;
export const EXTERNAL_NOTICE_MAX = 400;
export const DEFAULT_EXTERNAL_BUTTON_LABEL = "Inscribirme";
export const DEFAULT_EXTERNAL_NOTICE =
  "Este evento lo organiza un tercero y lo publicamos solo para informar. Qué Hay Pa Hacer no es socio ni responsable del evento: la inscripción, el pago y cualquier reclamo se atienden directamente en el sitio del organizador.";

const HEX = /^#[0-9a-fA-F]{6}$/;

/** El color llega del cliente: solo se usa si es `#RRGGBB` (evita inyectar CSS arbitrario). */
export function safeHexColor(value?: string): string | undefined {
  const v = value?.trim();
  return v && HEX.test(v) ? v : undefined;
}

/** Texto blanco u oscuro según el contraste WCAG contra el fondo, para que el botón nunca quede ilegible. */
export function readableTextColor(hex: string): "#FFFFFF" | "#09090B" {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  // Contraste con blanco, 1.05 / (L + 0.05), contra el de #09090B (luminancia ≈ 0.0028): gana el mayor.
  return 1.05 / (luminance + 0.05) >= (luminance + 0.05) / 0.0528 ? "#FFFFFF" : "#09090B";
}
