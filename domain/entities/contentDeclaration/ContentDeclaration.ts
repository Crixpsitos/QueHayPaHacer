export type DeclarationTargetType = "event" | "site";

/** Evidencia de la declaración del autor al publicar (derechos, permisos, responsabilidad). */
export interface ContentDeclaration {
  uid: string;
  targetType: DeclarationTargetType;
  targetId: string;
  /** LEGAL_VERSION vigente al declarar. */
  termsVersion: string;
  /** Solo sitios: variante efectiva de la declaración y tipo de lugar (ausente en docs antiguos y eventos). */
  variant?: "owner" | "proposer" | "qhpa";
  siteKind?: "public" | "business";
}
