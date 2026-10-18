import { timingSafeEqual } from "node:crypto";

/** ¿La cabecera `Authorization: Bearer <secreto>` coincide con `expected`? Comparación en tiempo constante. */
export function hasValidBearer(request: Request, expected: string): boolean {
  const supplied = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  const a = Buffer.from(supplied);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
