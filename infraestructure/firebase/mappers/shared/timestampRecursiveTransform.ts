import { Timestamp } from "firebase-admin/firestore";

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Object.prototype.toString.call(value) === "[object Object]";
}

function isTimestampLike(value: unknown): value is { toDate: () => Date } {
  return (
    !!value &&
    typeof value === "object" &&
    typeof (value as { toDate?: unknown }).toDate === "function"
  );
}

export function transformTimestampsToDatesRecursively<T>(input: T): T {
  if (input == null) return input;

  if (isTimestampLike(input)) {
    return input.toDate() as T;
  }

  if (Array.isArray(input)) {
    return input.map((item) =>
      transformTimestampsToDatesRecursively(item),
    ) as T;
  }

  if (isPlainObject(input)) {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input)) {
      result[key] = transformTimestampsToDatesRecursively(value);
    }
    return result as T;
  }

  return input;
}

export function transformDatesToTimestampsRecursively<T>(input: T): T {
  if (input == null) return input;

  if (input instanceof Date) {
    return Timestamp.fromDate(input) as T;
  }

  if (Array.isArray(input)) {
    return input.map((item) =>
      transformDatesToTimestampsRecursively(item),
    ) as T;
  }

  if (isPlainObject(input)) {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input)) {
      result[key] = transformDatesToTimestampsRecursively(value);
    }
    return result as T;
  }

  return input;
}
