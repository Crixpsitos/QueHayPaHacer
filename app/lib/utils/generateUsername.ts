import { toSlug } from "./slug";

/**
 * Generates a valid username from a professional/commercial/institutional name.
 * Normalizes accents, converts spaces to "_", lowercases.
 * Output respects [a-z0-9_] and is at most `maxLength` characters.
 */
export function generateUsername(name: string, maxLength = 30): string {
  return toSlug(name)
    .replace(/-/g, "_")        // spaces → _ (toSlug already converts spaces to -)
    .replace(/_+/g, "_")       // collapse consecutive _
    .replace(/^_|_$/g, "")     // strip leading/trailing _
    .slice(0, maxLength);
}
