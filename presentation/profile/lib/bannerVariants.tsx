"use client";

// ─────────────────────────────────────────────────────────────────────────────
//  Sistema de variantes visuales para el banner del perfil
//
//  Prioridad: bannerUrl del usuario → variante persistida → nueva aleatoria
//  La variante sólo afecta el fondo decorativo, nunca el layout del perfil.
// ─────────────────────────────────────────────────────────────────────────────

export type BannerVariant =
  | "soft-gradient"
  | "geometric"
  | "mesh"
  | "svg-pattern"
  | "editorial"
  | "abstract";

export const BANNER_VARIANTS: readonly BannerVariant[] = [
  "soft-gradient",
  "geometric",
  "mesh",
  "svg-pattern",
  "editorial",
  "abstract",
];

export const VARIANT_STORAGE_KEY = "qhph_banner_v";

/** Ratio oficial del banner — 3:1 (ancho × alto). Usar en ProfileBanner e ImageCropDialog. */
export const BANNER_ASPECT_RATIO = 3;
/** Dimensiones de salida del crop en píxeles */
export const BANNER_OUTPUT_WIDTH = 1500;
export const BANNER_OUTPUT_HEIGHT = 500;

/** Clave per-usuario para evitar que sesiones distintas en el mismo navegador compartan variante */
function getStorageKey(uid?: string): string {
  return uid ? `qhph_banner_v:${uid}` : VARIANT_STORAGE_KEY;
}

// ── Selección de variante ────────────────────────────────────────────────────

function uidToIndex(uid: string): number {
  let h = 0;
  for (let i = 0; i < uid.length; i++) {
    h = (Math.imul(31, h) + uid.charCodeAt(i)) | 0;
  }
  return Math.abs(h) % BANNER_VARIANTS.length;
}

/**
 * Recupera la variante almacenada, o genera+persiste una nueva.
 * Sólo llamar desde el cliente (useState initializer en ProfileBanner).
 */
export function resolveVariant(uid?: string): BannerVariant {
  const key = getStorageKey(uid);
  try {
    const stored = localStorage.getItem(key);
    if (stored && (BANNER_VARIANTS as readonly string[]).includes(stored)) {
      return stored as BannerVariant;
    }
  } catch {}

  // Determinística por uid como fallback; si no hay uid, aleatoria
  const chosen = uid
    ? BANNER_VARIANTS[uidToIndex(uid)]
    : BANNER_VARIANTS[Math.floor(Math.random() * BANNER_VARIANTS.length)];

  try {
    localStorage.setItem(key, chosen);
  } catch {}

  return chosen;
}

// ── Variante 1 — Soft Gradient ───────────────────────────────────────────────
// Gradiente rosa cálido con orbs y anillos concéntricos — identidad suave de marca.

function SoftGradientVariant() {
  return (
    <>
      {/* Gradiente rosa visible */}
      <div className="absolute inset-0 bg-linear-to-br from-rose-100 via-rose-50 to-white" />
      {/* Orb primario top-right */}
      <div
        className="pointer-events-none absolute -right-12 -top-12 h-72 w-72 rounded-full bg-primary/30 blur-[60px]"
        aria-hidden
      />
      {/* Orb secundario rose bottom-left */}
      <div
        className="pointer-events-none absolute -left-8 -bottom-8 h-56 w-56 rounded-full bg-rose-400/30 blur-[50px]"
        aria-hidden
      />
      {/* Orb de acento central */}
      <div
        className="pointer-events-none absolute right-1/3 top-1/4 h-32 w-32 rounded-full bg-primary/18 blur-3xl"
        aria-hidden
      />
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        {/* Anillos concéntricos top-right */}
        <circle cx="95%" cy="-8%" r="95"  fill="none" stroke="var(--primary)" strokeWidth="2.5" opacity="0.28" />
        <circle cx="95%" cy="-8%" r="158" fill="none" stroke="var(--primary)" strokeWidth="1.5" opacity="0.16" />
        <circle cx="95%" cy="-8%" r="228" fill="none" stroke="var(--primary)" strokeWidth="0.8" opacity="0.09" />
        {/* Trama de puntos 3×3 zona centro-izquierda */}
        <circle cx="22%" cy="22%" r="2"   fill="var(--primary)" opacity="0.30" />
        <circle cx="27%" cy="22%" r="2"   fill="var(--primary)" opacity="0.30" />
        <circle cx="32%" cy="22%" r="2"   fill="var(--primary)" opacity="0.30" />
        <circle cx="22%" cy="40%" r="2"   fill="var(--primary)" opacity="0.20" />
        <circle cx="27%" cy="40%" r="2"   fill="var(--primary)" opacity="0.20" />
        <circle cx="32%" cy="40%" r="2"   fill="var(--primary)" opacity="0.20" />
        <circle cx="22%" cy="58%" r="2"   fill="var(--primary)" opacity="0.12" />
        <circle cx="27%" cy="58%" r="2"   fill="var(--primary)" opacity="0.12" />
        <circle cx="32%" cy="58%" r="2"   fill="var(--primary)" opacity="0.12" />
        {/* Línea diagonal sutil */}
        <line x1="0" y1="95%" x2="52%" y2="0" stroke="var(--primary)" strokeWidth="1" opacity="0.12" />
      </svg>
    </>
  );
}

// ── Variante 2 — Geometric ───────────────────────────────────────────────────
// Bauhaus: formas geométricas angulares en primario sobre fondo gris.

function GeometricVariant() {
  return (
    <>
      {/* Fondo gris neutro */}
      <div className="absolute inset-0 bg-zinc-100" />
      {/* Paralelogramo central — banda diagonal de marca */}
      <div
        className="pointer-events-none absolute inset-0 bg-primary/[0.16]"
        style={{ clipPath: "polygon(42% 0%, 100% 0%, 72% 100%, 30% 100%)" }}
        aria-hidden
      />
      {/* Banda de acento right */}
      <div
        className="pointer-events-none absolute inset-0 bg-primary/[0.26]"
        style={{ clipPath: "polygon(78% 0%, 100% 0%, 100% 100%, 86% 100%)" }}
        aria-hidden
      />
      {/* Triángulo esquina top-left */}
      <div
        className="pointer-events-none absolute inset-0 bg-primary/[0.18]"
        style={{ clipPath: "polygon(0% 0%, 16% 0%, 0% 42%)" }}
        aria-hidden
      />
      {/* Triángulo bottom-left oscuro */}
      <div
        className="pointer-events-none absolute inset-0 bg-foreground/[0.10]"
        style={{ clipPath: "polygon(0% 68%, 26% 100%, 0% 100%)" }}
        aria-hidden
      />
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        {/* Líneas diagonales de acento fuertes */}
        <line x1="0" y1="56%" x2="52%" y2="0" stroke="var(--primary)" strokeWidth="3"   opacity="0.26" />
        <line x1="0" y1="66%" x2="44%" y2="0" stroke="var(--primary)" strokeWidth="1.5" opacity="0.14" />
        {/* Divisores verticales de rejilla */}
        <line x1="30%" y1="0" x2="30%" y2="100%" stroke="var(--border)" strokeWidth="0.8" opacity="0.60" />
        <line x1="60%" y1="0" x2="60%" y2="100%" stroke="var(--border)" strokeWidth="0.5" opacity="0.38" />
        {/* Puntos de acento zona izquierda */}
        <circle cx="10%" cy="28%" r="4.5" fill="var(--primary)" opacity="0.28" />
        <circle cx="18%" cy="57%" r="3"   fill="var(--primary)" opacity="0.20" />
        <circle cx="24%" cy="40%" r="2"   fill="var(--primary)" opacity="0.14" />
      </svg>
    </>
  );
}

// ── Variante 3 — SVG Pattern ─────────────────────────────────────────────────
// Patrón de cruces repetido con fundido radial — textura limpia y artesanal.

function SvgPatternVariant() {
  return (
    <>
      {/* Fondo neutro cálido */}
      <div className="absolute inset-0 bg-stone-50" />
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <defs>
          {/* Cruz / plus repetida */}
          <pattern id="qhph-cross" patternUnits="userSpaceOnUse" width="30" height="30">
            <line x1="15" y1="4"  x2="15" y2="26" stroke="var(--primary)" strokeWidth="2.5" opacity="0.30" strokeLinecap="round" />
            <line x1="4"  y1="15" x2="26" y2="15" stroke="var(--primary)" strokeWidth="2.5" opacity="0.30" strokeLinecap="round" />
          </pattern>
          {/* Fundido radial desde centro-derecha hacia bordes */}
          <radialGradient id="qhph-cross-fade" cx="62%" cy="38%" r="65%">
            <stop offset="20%" stopColor="var(--background)" stopOpacity="0" />
            <stop offset="100%" stopColor="var(--background)" stopOpacity="0.65" />
          </radialGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#qhph-cross)" />
        <rect width="100%" height="100%" fill="url(#qhph-cross-fade)" />
      </svg>
      {/* Orb de acento top-right */}
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-56 w-56 rounded-full bg-primary/24 blur-[55px]"
        aria-hidden
      />
    </>
  );
}

// ── Variante 4 — Mesh ────────────────────────────────────────────────────────
// Aurora / malla de color: múltiples orbs superpuestos en tonos rose y primario.

function MeshVariant() {
  return (
    <>
      {/* Base rose claramente visible */}
      <div className="absolute inset-0 bg-rose-50" />
      {/* Orb primario fuerte top-right */}
      <div
        className="pointer-events-none absolute -right-10 -top-8 h-72 w-72 rounded-full bg-primary/40 blur-[55px]"
        aria-hidden
      />
      {/* Orb rose top-left */}
      <div
        className="pointer-events-none absolute -left-10 -top-4 h-60 w-60 rounded-full bg-rose-400/40 blur-[50px]"
        aria-hidden
      />
      {/* Orb primario bottom-right */}
      <div
        className="pointer-events-none absolute bottom-0 right-1/4 h-52 w-52 rounded-full bg-primary/28 blur-[45px]"
        aria-hidden
      />
      {/* Orb rose accent mid */}
      <div
        className="pointer-events-none absolute left-1/4 top-1/3 h-40 w-40 rounded-full bg-rose-500/32 blur-[38px]"
        aria-hidden
      />
      {/* Orb terciario bottom-center */}
      <div
        className="pointer-events-none absolute bottom-1/4 left-1/2 h-32 w-32 rounded-full bg-primary/32 blur-[30px]"
        aria-hidden
      />
    </>
  );
}

// ── Variante 5 — Editorial ───────────────────────────────────────────────────
// Composición editorial: columna derecha en primario + estructura de rejilla en zona izquierda.
// La columna está en el RIGHT para no conflictuar con el avatar (bottom-left del banner).

function EditorialVariant() {
  return (
    <>
      {/* Fondo crème / stone */}
      <div className="absolute inset-0 bg-stone-100" />
      {/* Franja horizontal de acento en la parte superior — identidad de marca visible */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 bg-primary"
        style={{ height: "36%" }}
        aria-hidden
      />
      {/* Slice diagonal en el borde inferior de la franja */}
      <div
        className="pointer-events-none absolute inset-0 bg-stone-100"
        style={{ clipPath: "polygon(0% 36%, 100% 28%, 100% 100%, 0% 100%)" }}
        aria-hidden
      />
      {/* Acento strip derecho — sólido */}
      <div
        className="pointer-events-none absolute inset-y-0 right-0 bg-primary/[0.85]"
        style={{ width: "8%" }}
        aria-hidden
      />
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        {/* Barras blancas dentro de la franja roja — tipografía editorial */}
        <rect x="5%"  y="8%"  width="28%" height="5"   fill="white" opacity="0.80" rx="2.5" />
        <rect x="5%"  y="20%" width="20%" height="3.5" fill="white" opacity="0.55" rx="1.5" />
        <rect x="5%"  y="29%" width="24%" height="2.5" fill="white" opacity="0.38" rx="1" />
        {/* Cuadrado decorativo junto a las barras */}
        <rect x="36%" y="7%"  width="8"   height="8"   fill="white" opacity="0.28" rx="1.5" />
        <rect x="39%" y="7%"  width="8"   height="8"   fill="white" opacity="0.18" rx="1.5" />
        {/* Rejilla en la zona inferior (área del avatar y contenido) */}
        <line x1="0"    y1="50%"  x2="90%" y2="50%"  stroke="var(--border)" strokeWidth="0.6" opacity="0.40" />
        <line x1="0"    y1="70%"  x2="90%" y2="70%"  stroke="var(--border)" strokeWidth="0.4" opacity="0.25" />
        <line x1="0"    y1="88%"  x2="90%" y2="88%"  stroke="var(--border)" strokeWidth="0.3" opacity="0.15" />
        <line x1="25%"  y1="40%"  x2="25%" y2="100%" stroke="var(--border)" strokeWidth="0.5" opacity="0.30" />
        <line x1="50%"  y1="40%"  x2="50%" y2="100%" stroke="var(--border)" strokeWidth="0.4" opacity="0.20" />
        <line x1="75%"  y1="40%"  x2="75%" y2="100%" stroke="var(--border)" strokeWidth="0.3" opacity="0.14" />
        {/* Trama de puntos zona centro-derecha inferior */}
        <circle cx="60%" cy="60%" r="2"   fill="var(--primary)" opacity="0.22" />
        <circle cx="65%" cy="60%" r="2"   fill="var(--primary)" opacity="0.22" />
        <circle cx="70%" cy="60%" r="2"   fill="var(--primary)" opacity="0.22" />
        <circle cx="60%" cy="75%" r="2"   fill="var(--primary)" opacity="0.14" />
        <circle cx="65%" cy="75%" r="2"   fill="var(--primary)" opacity="0.14" />
        <circle cx="70%" cy="75%" r="2"   fill="var(--primary)" opacity="0.14" />
      </svg>
    </>
  );
}

// ── Variante 6 — Abstract ────────────────────────────────────────────────────
// Ondas orgánicas curvas multicapa — composición fluida y artística.

function AbstractVariant() {
  return (
    <>
      {/* Fondo gris suave */}
      <div className="absolute inset-0 bg-zinc-100" />
      {/* Ondas principales — viewBox normalizado */}
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-0 h-full w-full"
        aria-hidden
      >
        {/* Onda grande desde abajo */}
        <path
          d="M0,50 C18,30 38,70 58,45 C78,20 92,48 100,35 L100,100 L0,100 Z"
          fill="var(--primary)"
          opacity="0.22"
        />
        {/* Onda media */}
        <path
          d="M0,65 C22,48 45,78 65,60 C82,44 95,62 100,55 L100,100 L0,100 Z"
          fill="var(--primary)"
          opacity="0.16"
        />
        {/* Onda pequeña cerca del fondo */}
        <path
          d="M0,80 C28,68 52,88 72,75 C88,63 96,76 100,70 L100,100 L0,100 Z"
          fill="var(--primary)"
          opacity="0.10"
        />
        {/* Onda invertida desde arriba */}
        <path
          d="M0,0 L100,0 L100,30 C80,44 60,18 40,32 C20,46 10,24 0,34 Z"
          fill="var(--primary)"
          opacity="0.14"
        />
      </svg>
      {/* Orbs de acento sobre las ondas */}
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <circle cx="73%" cy="28%" r="62" fill="var(--primary)" opacity="0.16" />
        <circle cx="83%" cy="60%" r="40" fill="var(--primary)" opacity="0.18" />
        <circle cx="58%" cy="14%" r="22" fill="var(--foreground)" opacity="0.06" />
      </svg>
    </>
  );
}

// ── Dispatcher ───────────────────────────────────────────────────────────────

export function VariantBackground({ variant }: { variant: BannerVariant }) {
  switch (variant) {
    case "geometric":    return <GeometricVariant />;
    case "mesh":         return <MeshVariant />;
    case "svg-pattern":  return <SvgPatternVariant />;
    case "editorial":    return <EditorialVariant />;
    case "abstract":     return <AbstractVariant />;
    default:             return <SoftGradientVariant />;
  }
}
