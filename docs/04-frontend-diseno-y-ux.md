# Frontend, diseño y experiencia

## 1. Dirección visual vigente

La guía original vive en `DESING.md` y define:

- light mode only;
- fotografía como protagonista;
- contraste alto;
- rojo carmesí como acción principal;
- dorado como acento;
- fondos blancos/gris muy claro;
- Outfit en headings e Inter en cuerpo;
- bordes suaves y botones tipo pill;
- iconografía Lucide.

El nombre `DESING.md` es un typo histórico. Conviene renombrarlo a `DESIGN.md` en un cambio separado que actualice referencias.

## 2. Tokens reales

La fuente ejecutable es `app/globals.css`:

| Rol | Token | Valor |
|---|---|---|
| Canvas | `--background` | `#FAFAFC` |
| Texto | `--foreground` | `#09090B` |
| Superficie | `--card` | `#FFFFFF` |
| Acción | `--primary` | `#E63946` |
| Acción oscura | `--primary-dark` | `#9B0A26` |
| Acción suave | `--primary-light` | `#FDF2F4` |
| Oro | `--brand-gold` | `#FFB703` |
| Texto secundario | `--muted-foreground` | `#71717A` |
| Borde | `--border` | `#E4E4E7` |
| Ring | `--ring` | `#E63946` |

También existen gradientes de marca y sombras (`card`, `hover`, `primary-glow`, `dark-float`).

## 3. Tipografía

`app/layout.tsx` carga:

- Outfit como `--font-heading`;
- Inter como `--font-sans`;
- Geist Sans y Geist Mono también están disponibles.

La coexistencia de Inter y Geist debe revisarse: cargar fuentes no utilizadas aumenta coste y vuelve ambiguo cuál es la fuente corporal canónica.

## 4. Sistema de componentes

La UI combina:

- componentes shadcn;
- Base UI;
- Radix UI;
- componentes propios en `app/components/ui`;
- layouts en `app/components/layout`;
- features en `presentation`.

Primitivos compartidos importantes:

- Button;
- Avatar;
- Drawer/Dialog/Dropdown;
- Tooltip;
- Input/Field/Select;
- Tabs;
- Skeleton;
- Container y PageContent.

Regla: antes de crear un control nuevo se debe buscar un primitivo existente. La duplicación previa del Navbar de Profile ya fue eliminada localmente; Profile debe montar el mismo `Navbar` y `NavbarAccountMenu` del Home.

## 5. Navegación

### Home y Profile

Usan el Navbar principal:

- marca;
- Inicio, Eventos, ¿Dónde ir?, Contáctanos;
- CTA `Aportar` para consumidor;
- CTA `Crear evento` para creador;
- avatar/fallback;
- dropdown de cuenta.

El dropdown separa:

- nombre;
- `@username`;
- Consumidor/Creador;
- Básico/Premium;
- verificación.

### Studio

Studio mantiene shell y sidebar propios porque es una herramienta operativa densa. Requiere Premium.

### Sitios

El módulo mezcla listado, mapa y formulario. La migración inicial está descrita en `docs/sites-ui-migration.md`, pero ese documento conserva tokens indigo y dark mode del prototipo, que contradicen el sistema QHPA actual.

## 6. Responsive

Patrones presentes:

- mobile-first con breakpoints Tailwind;
- Drawer inferior en móvil y lateral en desktop;
- Navbar con menú compacto;
- mapas y paneles reorganizados por viewport;
- cards horizontales que cambian proporciones;
- `minmax(0, 1fr)` y `min-w-0` para controlar overflow;
- tamaños estables para avatar, imágenes y nodos de timeline.

Riesgo: no existe suite automatizada que pruebe viewports clave. Las correcciones recientes se validaron manualmente con Playwright, pero no quedaron como tests versionados.

Viewports mínimos recomendados:

- 320x568;
- 390x844;
- 768x1024;
- 1280x720;
- 1440x900.

## 7. Imágenes y medios

- Se usa `next/image`, no `<img>` como escape a optimización.
- `remotePatterns` admite Unsplash, Firebase Storage, Google Storage, Google profile images, DiceBear y Picsum.
- Eventos pueden tener variantes optimizadas.
- Sitios tienen portada, thumbnails y marker URL.
- La timeline usa una variante suficiente para la superficie final y configura `sizes` según el ancho visual.
- Avatar/banner tienen upload y recorte.

Pendientes:

- contrato único de variantes entre DTO, dominio y formularios;
- verificar calidad/formatos y coste de imágenes reales;
- auditoría de alt text;
- política de eliminación de medios huérfanos;
- prueba de errores del procesador de imágenes/video.

## 8. Formularios

### Eventos

Formulario multistep con:

- información básica;
- medios;
- categoría;
- ubicación;
- fechas;
- registro;
- precio;
- revisión/promoción;
- colaboradores según plan.

### Sitios

Formulario con ubicación, datos básicos, medios, horarios, redes, cierre temporal y publicación.

### Riesgos comunes

- componentes muy grandes;
- autosave y sincronización remota complejos;
- estados temporales de upload;
- errores parciales difíciles de reproducir;
- React Hook Form produce advertencias del React Compiler por `watch()`;
- no hay tests de interacción completos.

## 9. Accesibilidad

Buenas prácticas presentes:

- `aria-label` en botones de icono;
- `aria-hidden` en iconos decorativos;
- focus-visible en muchos controles;
- labels y mensajes de error;
- skip link en HomeLayout;
- primitivas Radix/Base UI con semántica de menú/dialog.

Faltantes:

- axe/pa11y en CI;
- recorrido completo por teclado;
- pruebas con lector de pantalla;
- contraste automatizado;
- verificación de focus trap en drawers/modales;
- auditoría de `aria-sort` y roles señalados por ESLint.

## 10. Inconsistencias visuales

1. `DESING.md` prescribe light-only, pero hay clases `dark:*` dispersas y `next-themes` instalado.
2. `docs/sites-ui-migration.md` conserva un sistema indigo y dark mode del prototipo.
3. Muchos componentes aún usan hex directos en vez de tokens semánticos.
4. Studio usa grises/slate e indigo en varios módulos y no siempre se siente parte de Home.
5. El radio base ejecutable (`0.625rem`) no coincide completamente con la escala escrita de 16/24px.
6. Hay mezcla de componentes UI de varias librerías sin catálogo visual único.
7. Iconos de marcas sociales no existen en la versión instalada de Lucide; actualmente se usan equivalentes semánticos. Si se necesitan logos oficiales, debe elegirse una librería de marcas con criterio legal/visual.
8. Textos alternan “Que Hay Pa Hacer”, “QueHayPaHacer” y “QHPA”.
9. Mezcla de español e inglés en nombres internos es aceptable, pero los textos visibles deben ser consistentes.

## 11. SEO y contenido compartido

Presente:

- metadata global;
- Open Graph/Twitter base;
- JSON-LD WebSite/Organization;
- robots;
- sitemap de rutas y colecciones;
- opengraph-image para eventos.

Pendiente:

- eventos y sitios individuales en sitemap;
- canonical consistente;
- schema.org Event/Place/LocalBusiness/Person según entidad;
- QA de previews sociales;
- política de indexación de perfiles públicos/privados.

## 12. Criterios visuales de cierre

- Un único Navbar compartido Home/Profile.
- Sin overflow horizontal en los cinco viewports mínimos.
- Ningún contenido real sustituido por mock visual.
- Imágenes nítidas y con `sizes` correcto.
- Estados loading/empty/error en cada módulo.
- 0 errores críticos de axe.
- Navegación por teclado de auth, creación, detalle, perfil y Studio.
- Tokens QHPA aplicados a Sitios/Studio sin introducir un segundo tema.
- Capturas de regresión para Home, detalle de evento, detalle de sitio, Profile y Studio.