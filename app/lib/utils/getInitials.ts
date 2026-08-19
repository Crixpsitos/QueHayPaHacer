/** Returns up to 2 uppercase initials from a display name or first/last name. */
export function getInitials(
  name: string | null | undefined,
  opts?: { firstName?: string | null; lastName?: string | null },
): string {
  if (opts?.firstName || opts?.lastName) {
    const first = opts.firstName?.trim()?.[0] ?? "";
    const last = opts.lastName?.trim()?.[0] ?? "";
    return `${first}${last}`.toUpperCase();
  }
  return (name ?? "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}
