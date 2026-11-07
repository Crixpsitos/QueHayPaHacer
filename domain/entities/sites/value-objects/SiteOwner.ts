/**
 * Dueño de un sitio administrado por QHPA (la ficha la mantiene QHPA con su autorización).
 * Copia de un perfil externo de la red de colaboradores; solo lo fijan cuentas de QHPA.
 */
export interface SiteOwner {
  id: string
  displayName: string
  photoURL: string
}
