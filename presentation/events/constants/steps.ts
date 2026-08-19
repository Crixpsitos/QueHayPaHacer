export const STEPS = [
  { number: 1, label: "Información básica", icon: "FileText" },
  { number: 2, label: "Medios", icon: "Image" },
  { number: 3, label: "Clasificación", icon: "Tag" },
  { number: 4, label: "Ubicación", icon: "MapPin" },
  { number: 5, label: "Fechas", icon: "Calendar" },
  { number: 6, label: "Registro", icon: "Users" },
  { number: 7, label: "Precios", icon: "DollarSign" },
  { number: 8, label: "Revisión", icon: "CheckCircle" },
] as const;

/** Pasos del formulario de encabezado para eventos multi-fecha (solo profesionales). */
export const MULTI_DATE_HEADER_STEPS = [
  { number: 1, label: "Información básica", icon: "FileText" },
  { number: 2, label: "Portada principal", icon: "Image" },
  { number: 3, label: "Clasificación", icon: "Tag" },
  { number: 4, label: "Sesiones", icon: "Calendar" },
  { number: 5, label: "Promoción", icon: "Star" },
] as const;