/**
 * Genera los íconos PWA / Android (TWA) en public/icons/ a partir de un SVG.
 * Monograma "Q" geométrico (estilo Outfit, sin depender de fuentes instaladas)
 * en blanco sobre crimson #E63946.
 *
 * Uso: pnpm exec tsx scripts/generate-pwa-icons.ts
 *
 * `sharp` no es dependencia directa (pnpm estricto): se resuelve desde `next`,
 * que lo trae como dependencia opcional para optimizar imágenes.
 */
import { mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

const requireFromNext = createRequire(require.resolve("next/package.json"));
// ponytail: tipado mínimo de lo que se usa (los tipos de sharp no resuelven desde aquí).
type Sharp = (input: Buffer) => { png(): { toFile(file: string): Promise<unknown> } };
const sharp = requireFromNext("sharp") as Sharp;

const CRIMSON = "#E63946";
const OUT_DIR = path.join(process.cwd(), "public", "icons");

/**
 * @param scale  tamaño del glifo relativo al lienzo (maskable usa menos para
 *               quedar dentro de la zona segura: círculo de 80% del lado).
 * @param radius esquinas redondeadas (0 = a sangre, para maskable/apple).
 */
function iconSvg(size: number, scale: number, radius: number) {
  const offset = (100 - 100 * scale) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 100 100">
  <rect width="100" height="100" rx="${radius}" fill="${CRIMSON}"/>
  <g transform="translate(${offset} ${offset}) scale(${scale})" fill="none" stroke="#fff" stroke-width="13" stroke-linecap="round">
    <circle cx="48" cy="47" r="27"/>
    <path d="M66 65 L80 79"/>
  </g>
</svg>`;
}

const ICONS = [
  { file: "icon-192.png", size: 192, scale: 0.78, radius: 22 },
  { file: "icon-512.png", size: 512, scale: 0.78, radius: 22 },
  { file: "maskable-512.png", size: 512, scale: 0.6, radius: 0 },
  { file: "apple-touch-icon.png", size: 180, scale: 0.7, radius: 0 },
];

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  for (const { file, size, scale, radius } of ICONS) {
    await sharp(Buffer.from(iconSvg(size, scale, radius))).png().toFile(path.join(OUT_DIR, file));
    console.log(`✔ public/icons/${file} (${size}x${size})`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
