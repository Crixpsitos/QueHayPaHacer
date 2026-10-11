export function removeUndefinedProperties<T>(obj: T): T {
  if (obj === null || typeof obj !== "object") {
    return obj;
  }

  if (obj instanceof Date) {
    return obj as unknown as T;
  }
   // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (typeof (obj as any).toDate === "function" && "_seconds" in (obj as any)) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => removeUndefinedProperties(item)) as unknown as T;
  }

  // Solo se recorren objetos planos. Instancias de clase (GeoPoint, FieldValue,
  // DocumentReference…) se devuelven intactas: copiarlas a `{}` las convierte en
  // un map `{_latitude,_longitude}` y Firestore deja de reconocerlas.
  if (Object.getPrototypeOf(obj) !== Object.prototype && Object.getPrototypeOf(obj) !== null) {
    return obj;
  }
// eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cleanObj: any = {};
  
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];
      if (value !== undefined) {
        cleanObj[key] = removeUndefinedProperties(value);
      }
    }
  }

  return cleanObj as T;
}