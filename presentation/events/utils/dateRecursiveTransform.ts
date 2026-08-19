function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Object.prototype.toString.call(value) === "[object Object]";
}

function isIsoDateString(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return false;
  // Evita convertir textos arbitrarios como "mayo".
  return /\d{4}-\d{2}-\d{2}T/.test(value);
}

function isFirestoreTimestampLike(
  value: unknown,
): value is { toDate: () => Date } {
  return (
    typeof value === "object" &&
    value !== null &&
    "toDate" in value &&
    typeof (value as { toDate?: unknown }).toDate === "function"
  );
}

function isFirestoreTimestampLiteral(
  value: unknown,
): value is { _seconds?: number; _nanoseconds?: number; seconds?: number; nanoseconds?: number } {
  if (!isPlainObject(value)) return false;
  const hasPrivate = "_seconds" in value || "_nanoseconds" in value;
  const hasPublic = "seconds" in value || "nanoseconds" in value;
  return hasPrivate || hasPublic;
}

export function transformDatesToIsoStringsRecursively<T>(input: T): T {
  if (input == null) return input;

  if (input instanceof Date) {
    return input.toISOString() as T;
  }

  if (isFirestoreTimestampLike(input)) {
    return input.toDate().toISOString() as T;
  }

  if (isFirestoreTimestampLiteral(input)) {
    const seconds =
      typeof input.seconds === "number"
        ? input.seconds
        : typeof input._seconds === "number"
          ? input._seconds
          : 0;
    const nanoseconds =
      typeof input.nanoseconds === "number"
        ? input.nanoseconds
        : typeof input._nanoseconds === "number"
          ? input._nanoseconds
          : 0;

    const millis = seconds * 1000 + Math.floor(nanoseconds / 1_000_000);
    return new Date(millis).toISOString() as T;
  }

  if (Array.isArray(input)) {
    return input.map((item) => transformDatesToIsoStringsRecursively(item)) as T;
  }

  if (isPlainObject(input)) {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input)) {
      result[key] = transformDatesToIsoStringsRecursively(value);
    }
    return result as T;
  }

  return input;
}

export function transformIsoStringsToDatesRecursively<T>(input: T): T {
  if (input == null) return input;

  if (isIsoDateString(input)) {
    return new Date(input) as T;
  }

  if (Array.isArray(input)) {
    return input.map((item) => transformIsoStringsToDatesRecursively(item)) as T;
  }

  if (isPlainObject(input)) {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input)) {
      result[key] = transformIsoStringsToDatesRecursively(value);
    }
    return result as T;
  }

  return input;
}
