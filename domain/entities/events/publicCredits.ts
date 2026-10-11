import type { TeamRole } from "./teamAccess";

/** Roles que se acreditan públicamente. `viewer` y `checkin` son personal interno: nunca se muestran. */
const PUBLIC_CREDIT_ROLES: readonly TeamRole[] = ["editor", "credit"];

export const isPublicCreditRole = (role: unknown): boolean =>
  (PUBLIC_CREDIT_ROLES as readonly unknown[]).includes(role);

/** `collaboratorsData` reducido a lo que puede verse en la página pública del evento. */
export function publicCredits<T extends { role?: string }>(
  collaboratorsData: Record<string, T> | undefined,
): Record<string, T> {
  return Object.fromEntries(Object.entries(collaboratorsData ?? {}).filter(([, c]) => isPublicCreditRole(c.role)));
}

/** Igual que `publicCredits` pero también depura la lista de referencias. */
export function publicTeam<T extends { role?: string }>(
  collaborators: { refId: string; kind: "user" | "external" }[] | undefined,
  collaboratorsData: Record<string, T> | undefined,
) {
  const data = publicCredits(collaboratorsData);
  return { collaborators: collaborators?.filter((c) => c.refId in data), collaboratorsData: data };
}
