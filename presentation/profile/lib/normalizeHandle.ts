/** `%40User`, `@User`, espacios… → handle limpio (clave de caché y de invalidación). */
export const normalizeHandle = (rawHandle: string): string => {
  let handle = rawHandle.trim();
  for (let pass = 0; pass < 2; pass += 1) {
    try {
      const decoded = decodeURIComponent(handle);
      if (decoded === handle) break;
      handle = decoded;
    } catch {
      break;
    }
  }
  return handle.replace(/^@/, "");
};
