/** href http(s) seguro para enlaces externos del usuario; null si no es válido (bloquea javascript:, data:, etc.). */
export const normalizeExternalUrl = (value: string) => {
  const candidate = /^https?:\/\//i.test(value.trim()) ? value.trim() : `https://${value.trim()}`;
  try {
    const url = new URL(candidate);
    return url.protocol === "http:" || url.protocol === "https:" ? url.href : null;
  } catch {
    return null;
  }
};
