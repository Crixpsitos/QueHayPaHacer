import { customAlphabet } from "nanoid";
import { toSlug } from "./slug";

const generateSuffix = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 6);

export function generateUsername(name: string, maxLength = 30): string {
  return toSlug(name)
    .replace(/-/g, "")
    .slice(0, maxLength);
}

export function generateUniqueUsernameCandidate(baseUsername: string, maxLength = 30): string {
  const suffix = generateSuffix();
  const normalizedBase = generateUsername(baseUsername, maxLength - suffix.length);
  return `${normalizedBase}${suffix}`;
}
