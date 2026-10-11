/** Aceptaciones exigidas al crear cuenta: términos (+ mayoría de edad) y autorización de datos. */
export function hasValidAcceptance(acceptedTerms: unknown, acceptedDataPolicy: unknown): boolean {
  return acceptedTerms === true && acceptedDataPolicy === true;
}

export const ACCEPTANCE_REQUIRED_ERROR =
  "Para continuar, acepta los términos y condiciones y la autorización de tratamiento de datos.";
