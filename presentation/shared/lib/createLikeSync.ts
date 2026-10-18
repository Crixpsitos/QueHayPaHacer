export interface LikeState {
  liked: boolean;
  count: number;
}

interface LikeSyncOptions {
  initial: LikeState;
  /** Envía el estado deseado al servidor. `false` = rechazado (sin sesión, error): se revierte al último confirmado. */
  commit: (liked: boolean) => Promise<boolean>;
  /** Se llama con el estado visible tras cada cambio. */
  onChange: (state: LikeState) => void;
}

/**
 * "Me gusta" optimista: el estado visible cambia al instante y el servidor se entera después.
 * - Varios toques seguidos no disparan varias peticiones: solo se envía el estado final (un envío en vuelo a la vez).
 * - Si el servidor rechaza, vuelve al último estado confirmado (corazón y contador).
 * - El contador visible se deriva del confirmado, así que nunca se desfasa por toques intermedios.
 */
export function createLikeSync({ initial, commit, onChange }: LikeSyncOptions) {
  let confirmed: LikeState = { ...initial };
  let wanted = initial.liked;
  let running = false;
  let touched = false;

  const view = (): LikeState => ({
    liked: wanted,
    count: Math.max(0, confirmed.count + (wanted === confirmed.liked ? 0 : wanted ? 1 : -1)),
  });

  const run = async () => {
    running = true;
    try {
      while (wanted !== confirmed.liked) {
        const target = wanted;
        let ok = false;
        try {
          ok = await commit(target);
        } catch {
          ok = false;
        }
        if (ok) {
          confirmed = { liked: target, count: Math.max(0, confirmed.count + (target ? 1 : -1)) };
        } else {
          wanted = confirmed.liked;
        }
        onChange(view());
      }
    } finally {
      running = false;
    }
  };

  return {
    state: view,
    toggle() {
      touched = true;
      wanted = !wanted;
      onChange(view());
      if (!running) void run();
    },
    /**
     * Datos nuevos del servidor (p. ej. llegó el estado de la sesión). Se ignora si la persona ya tocó el corazón:
     * lo que ella hizo es más reciente que cualquier lectura (que puede venir de una caché atrasada).
     */
    reset(next: LikeState) {
      if (touched) return;
      confirmed = { ...next };
      wanted = next.liked;
      onChange(view());
    },
  };
}
