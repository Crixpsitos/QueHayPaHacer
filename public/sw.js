/*
 * Service worker de Que Hay Pa Hacer? — escrito a mano, sin dependencias.
 *
 * Objetivo: mitigar el cold start de Cloud Run (minInstances: 0). La primera
 * visita va a la red; las siguientes pintan al instante desde caché mientras se
 * revalida en segundo plano (stale-while-revalidate).
 *
 * Versión: llega en la URL de registro (`/sw.js?v=<build>`, ver
 * app/components/pwa/ServiceWorkerRegister.tsx). Cada deploy = nombres de caché
 * nuevos; en `activate` se borran los de builds anteriores.
 */
const VERSION = new URL(self.location.href).searchParams.get("v") || "dev";
const STATIC_CACHE = `qhpa-static-${VERSION}`;
const PAGES_CACHE = `qhpa-pages-${VERSION}`;
const IMAGES_CACHE = `qhpa-images-${VERSION}`;
const CURRENT_CACHES = [STATIC_CACHE, PAGES_CACHE, IMAGES_CACHE];

const OFFLINE_URL = "/offline";
const MAX_IMAGES = 150;
const IMAGE_HOSTS = ["firebasestorage.googleapis.com", "images.unsplash.com"];

// Rutas privadas o con estado de sesión: nunca se cachean.
// Mantener en sincronía con proxy.ts (PRIVATE_PATHS / PRIVATE_EVENT_PATH / PUBLIC_PATHS).
const NO_CACHE_PREFIXES = [
  "/api",
  "/studio",
  "/mis-eventos",
  "/mis-inscripciones",
  "/mis-invitaciones",
  "/sites",
  "/eventos/create",
  "/login",
  "/register",
  "/reset-password",
  "/dev",
  "/__",
];
// Editor y gestor de sesiones. /eventos/:id/sessions/:sessionId es público.
const PRIVATE_EVENT_PATH = /^\/eventos\/[^/]+\/(edit(\/.*)?|sessions\/?)$/;

function isPrivatePath(pathname) {
  return (
    pathname === "/profile" ||
    PRIVATE_EVENT_PATH.test(pathname) ||
    NO_CACHE_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))
  );
}

/** Clave de caché de una navegación pública, o null si no se debe cachear. */
function pageCacheKey(url) {
  if (isPrivatePath(url.pathname)) return null;
  // Solo se tolera ?source=pwa (start_url / shortcuts); comparte caché con la URL limpia.
  const params = new URLSearchParams(url.search);
  if (params.get("source") === "pwa") params.delete("source");
  if ([...params.keys()].length > 0) return null;
  return url.origin + url.pathname;
}

// Solo 200 "basic" (mismo origen, sin redirección). El SW no ve Set-Cookie
// (el navegador lo filtra), así que la defensa ante sesiones es la lista de rutas.
function isCacheablePage(res) {
  return res && res.status === 200 && res.type === "basic" && !res.redirected;
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE) // no en PAGES_CACHE: esa se vacía al cerrar sesión
      .then((cache) => cache.add(OFFLINE_URL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k.startsWith("qhpa-") && !CURRENT_CACHES.includes(k)).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  // Peticiones RSC / del router de Next: siempre a la red.
  if (request.headers.get("RSC") || request.headers.has("Next-Router-State-Tree") || request.headers.has("Next-Router-Prefetch")) return;

  const url = new URL(request.url);
  const sameOrigin = url.origin === self.location.origin;

  if (request.mode === "navigate") {
    if (!sameOrigin) return;
    const key = pageCacheKey(url);
    if (key) event.respondWith(staleWhileRevalidatePage(event, request, key));
    else event.respondWith(fetch(request).catch(() => offlineFallback()));
    return;
  }

  if (sameOrigin && url.searchParams.has("_rsc")) return;

  // Assets con hash e íconos: inmutables → cache-first. Las fuentes de next/font
  // viven en /_next/static/media.
  if (sameOrigin && (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/"))) {
    event.respondWith(cacheFirst(request));
    return;
  }

  if ((sameOrigin && url.pathname === "/_next/image") || IMAGE_HOSTS.includes(url.hostname)) {
    event.respondWith(staleWhileRevalidateImage(event, request));
  }
});

async function cacheFirst(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;
  const res = await fetch(request);
  if (res.ok) cache.put(request, res.clone());
  return res;
}

async function staleWhileRevalidatePage(event, request, key) {
  const cache = await caches.open(PAGES_CACHE);
  const cached = await cache.match(key);
  const network = fetch(request).then(async (res) => {
    // Si la página dejó de ser cacheable (redirect a login, 404, error) se descarta la copia.
    if (isCacheablePage(res)) await cache.put(key, res.clone());
    else await cache.delete(key);
    return res;
  });

  if (cached) {
    event.waitUntil(network.catch(() => {}));
    return cached;
  }
  return network.catch(() => offlineFallback());
}

async function staleWhileRevalidateImage(event, request) {
  const cache = await caches.open(IMAGES_CACHE);
  const cached = await cache.match(request);
  // ponytail: las <img> cross-origin sin CORS son opacas (status 0) y no se guardan:
  // Chrome les asigna ~7 MB de cuota a cada una. Las de /_next/image sí se cachean.
  const network = fetch(request).then(async (res) => {
    if (res.ok) {
      await cache.put(request, res.clone());
      await trimCache(cache, MAX_IMAGES);
    }
    return res;
  });

  if (cached) {
    event.waitUntil(network.catch(() => {}));
    return cached;
  }
  return network;
}

// cache.keys() devuelve en orden de inserción: se borran las más viejas.
async function trimCache(cache, max) {
  const keys = await cache.keys();
  await Promise.all(keys.slice(0, Math.max(0, keys.length - max)).map((k) => cache.delete(k)));
}

async function offlineFallback() {
  return (await caches.match(OFFLINE_URL)) || Response.error();
}
