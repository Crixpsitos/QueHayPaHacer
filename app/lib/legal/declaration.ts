export const DECLARATION_ERROR = "Debes aceptar la declaración de responsabilidad para publicar.";

/** La declaración solo vale si llega exactamente `true` (nada de "true", 1, undefined). */
export const hasDeclared = (declaration: unknown): declaration is true => declaration === true;

/** Un doc por contenido: republicar lo sobrescribe (merge). */
export const declarationDocId = (targetType: "event" | "site", targetId: string) =>
  `${targetType}_${targetId}`;

export type DeclarationVariant = "owner" | "proposer" | "qhpa";

/** Variante efectiva de la declaración: "owner" se respeta; si no, una cuenta admin publica como QHPA. */
export const declarationVariant = (publishedAs: unknown, isAdmin: boolean): DeclarationVariant =>
  publishedAs === "owner" ? "owner" : isAdmin ? "qhpa" : "proposer";
