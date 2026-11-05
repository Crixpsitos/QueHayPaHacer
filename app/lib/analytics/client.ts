import { cleanLocation, isTrackablePath, sanitizeParams, type AnalyticsEventName } from "./events";

/** Parte del SDK de `firebase/analytics` que usamos (inyectable para probar sin navegador). */
export interface AnalyticsSdk {
  isSupported(): Promise<boolean>;
  initializeAnalytics(app: unknown, options: { config: Record<string, unknown> }): unknown;
  setConsent(settings: Record<string, "granted" | "denied">): void;
  logEvent(instance: unknown, name: string, params: Record<string, unknown>): void;
  setUserProperties(instance: unknown, properties: Record<string, string>): void;
}

export type LoginState = "anon" | "logged_in";

interface Options {
  measurementId: string | undefined;
  getApp: () => unknown;
  loadSdk: () => Promise<AnalyticsSdk>;
}

type Job = (sdk: AnalyticsSdk, instance: unknown) => void;

const MAX_QUEUE = 50;

// Publicidad siempre denegada: solo medimos uso (Ley 1581: el usuario decide lo de analítica).
const consentSettings = (analyticsGranted: boolean) => ({
  analytics_storage: analyticsGranted ? ("granted" as const) : ("denied" as const),
  ad_storage: "denied" as const,
  ad_user_data: "denied" as const,
  ad_personalization: "denied" as const,
});

/**
 * Cliente de Google Analytics 4. Carga el SDK recién cuando hay algo que enviar, fija el consentimiento ANTES de
 * inicializar y nunca lanza: sin measurementId, sin soporte o con un SDK que falle, todo queda en no-op.
 */
export function createAnalytics({ measurementId, getApp, loadSdk }: Options) {
  let consent = false;
  let state: "idle" | "loading" | "ready" | "off" = "idle";
  let ready: Promise<void> | null = null;
  let sdk: AnalyticsSdk | undefined;
  let instance: unknown;
  const queue: Job[] = [];

  const run = (job: Job) => {
    try {
      job(sdk!, instance);
    } catch {}
  };

  function start() {
    if (ready || !measurementId) return;
    state = "loading";
    ready = (async () => {
      try {
        const loaded = await loadSdk();
        if (!(await loaded.isSupported())) throw new Error("unsupported");
        loaded.setConsent(consentSettings(consent)); // sin instancia aún: el SDK lo usa como valor por defecto
        instance = loaded.initializeAnalytics(getApp(), { config: { send_page_view: false } });
        sdk = loaded;
        state = "ready";
        queue.splice(0).forEach(run);
      } catch {
        state = "off";
        queue.length = 0;
      }
    })();
  }

  function enqueue(job: Job) {
    if (!measurementId || state === "off") return;
    if (state === "ready") return run(job);
    if (queue.length < MAX_QUEUE) queue.push(job);
    start();
  }

  return {
    /** Decisión del aviso de cookies. Antes de cargar solo se recuerda; después se envía como actualización. */
    setConsent(granted: boolean) {
      consent = granted;
      if (state === "ready") run((s) => s.setConsent(consentSettings(granted)));
    },
    setLoginState(login: LoginState) {
      enqueue((s, i) => s.setUserProperties(i, { login_state: login }));
    },
    track(name: AnalyticsEventName, params: Record<string, unknown> = {}) {
      const clean = sanitizeParams(params);
      enqueue((s, i) => s.logEvent(i, name, clean));
    },
    /** `page_view` solo de rutas públicas, con la URL limpia (UTM sí; tokens y `redirect_to` no). */
    pageView(href: string) {
      try {
        const { pathname } = new URL(href);
        if (!isTrackablePath(pathname)) return;
        const params = { page_location: cleanLocation(href), page_path: pathname };
        enqueue((s, i) => s.logEvent(i, "page_view", params));
      } catch {}
    },
    /** Solo para pruebas: espera a que termine la carga del SDK. */
    flush: () => ready ?? Promise.resolve(),
  };
}
