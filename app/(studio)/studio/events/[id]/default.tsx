/**
 * Fallback del slot implícito `children`. Necesario para `/studio/events/{id}/
 * session/{sid}`: esa ruta la sirve el slot `@multidate`, así que `children` no
 * tiene match y sin este archivo Next devolvería 404.
 */
export default function EventDetailDefault() {
  return null;
}
