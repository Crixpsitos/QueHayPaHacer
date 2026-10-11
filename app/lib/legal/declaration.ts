export const DECLARATION_ERROR = "Debes aceptar la declaración de responsabilidad para publicar.";

/** La declaración solo vale si llega exactamente `true` (nada de "true", 1, undefined). */
export const hasDeclared = (declaration: unknown): declaration is true => declaration === true;

/** Un doc por contenido: republicar lo sobrescribe (merge). */
export const declarationDocId = (targetType: "event" | "site", targetId: string) =>
  `${targetType}_${targetId}`;
