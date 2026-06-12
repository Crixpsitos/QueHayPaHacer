/**
 * Converts a string to a URL-safe slug using only native JS (no external deps).
 * Normalizes NFD to remove accents, strips non-alphanumeric chars, lowercases.
 */
export function toSlug(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}
