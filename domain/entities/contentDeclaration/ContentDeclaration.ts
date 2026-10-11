export type DeclarationTargetType = "event" | "site";

/** Evidencia de la declaración del autor al publicar (derechos, permisos, responsabilidad). */
export interface ContentDeclaration {
  uid: string;
  targetType: DeclarationTargetType;
  targetId: string;
  /** LEGAL_VERSION vigente al declarar. */
  termsVersion: string;
}
