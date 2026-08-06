## 1. Principios Visuales & Identidad
- **Filosofía Visual:** Estética moderna, limpia, de alto contraste visual y bordes suavizados (*Soft & Clean Architecture*).
- **Modo de Color:** **LIGHT MODE ONLY**. No implementar tema oscuro (*Dark Mode*). Toda la interfaz se construye sobre lienzos claros con alto contraste tipográfico.
- **Geometría & Bordes:** Uso dominante de bordes muy redondeados (`12px` - `24px`) y cápsulas completas (`pill: 9999px`) para transmitir accesibilidad, dinamismo y modernidad.
- **Énfasis Fotográfico:** Los fondos deben ser limpios e hiper-mínimos para que el contenido multimedia, imágenes e íconos destaquen sin competir con la interfaz.

---

## 2. Palette Tokens & Roles Cromáticos

### A. Color Primario — Vibrant Crimson (Identidad & Acción)
Rojo dinámico y moderno. Punto focal para acciones principales y branding.

- `--color-primary-light`: `#FDF2F4` (Hover suave, backgrounds de badges)
- `--color-primary-vibrant`: `#E63946` (Acción principal, íconos de interacción)
- `--color-primary-dark`: `#9B0A26` (Extremo de degradados, hovers profundos)
- `--color-primary-deep`: `#5C0011` (Textos acentuados o bordes de contraste)

### B. Color Secundario / Acento — Solar Gold (Aprobación & Emoción)
Extraído de las caritas y destellos de la marca. Utilizado para elementos calificados, festivos o estados destacados.

- `--color-accent-light`: `#FFF8E7` (Fondo de badges e items destacados)
- `--color-accent-main`: `#FFB703` (Estrellas, ratings, verificados, badges)
- `--color-accent-dark`: `#E09F00` (Hover de elementos dorados)

### C. Contraste & Estructura — Jet Black & Dark Neutrals
El negro no se usa como fondo general, sino como **ancla visual** para componentes flotantes y tipografía pesada.

- `--color-dark-pitch`: `#000000` (Sombras profundas)
- `--color-dark-jet`: `#09090B` (Texto principal, botones flotantes, badges oscuros)
- `--color-dark-surface`: `#18181B` (Elementos activos / Chips seleccionados)

### D. Superficies & Neutrales (Lienzo Claro)
- `--bg-canvas`: `#FAFAFC` (Fondo general de la aplicación)
- `--bg-surface`: `#FFFFFF` (Fondo de tarjetas, modales y headers)
- `--border-subtle`: `#F4F4F5` (Divisores mínimos)
- `--border-medium`: `#E4E4E7` (Bordes de inputs y tarjetas)
- `--text-primary`: `#09090B` (Títulos y cuerpo de lectura)
- `--text-muted`: `#71717A` (Metadatos, subtítulos, distancias, fechas)

---

## 3. Tokens de Degradados (Gradients)

```css
:root {
  /* Primary Action Gradient */
  --grad-primary: linear-gradient(135deg, #E63946 0%, #9B0A26 100%);
  --grad-primary-hover: linear-gradient(135deg, #FF4D5A 0%, #B30E30 100%);

  /* Dark Floating Gradient */
  --grad-dark-element: linear-gradient(180deg, #09090B 0%, #18181B 100%);

  /* Accent Gradient */
  --grad-accent: linear-gradient(135deg, #FFB703 0%, #FF8C00 100%);

  /* Photo Protection Overlay (para legibilidad de texto sobre imágenes) */
  --grad-overlay-bottom: linear-gradient(180deg, rgba(0, 0, 0, 0) 40%, rgba(0, 0, 0, 0.75) 100%);
}

4. Tipografía & Escala


Font Family (Headings): 'Outfit', 'Plus Jakarta Sans', sans-serif (Display, geométrica, moderna).

Font Family (Body): 'Inter', 'Plus Jakarta Sans', sans-serif (Limpia y funcional).
Escala Tipográfica


Display / H1: 2.25rem (36px) | Weight: 700 | Line-height: 1.2

H2: 1.75rem (28px) | Weight: 600 | Line-height: 1.25

H3: 1.25rem (20px) | Weight: 600 | Line-height: 1.3

Body Large: 1.125rem (18px) | Weight: 400 / 500

Body Main: 1rem (16px) | Weight: 400

Caption / Label: 0.875rem (14px) | Weight: 500

Micro / Badge: 0.75rem (12px) | Weight: 600 | Letter-spacing: 0.05em
5. Elevación, Radios y Sombras
CSS
:root {
  /* Border Radii */
  --radius-xs: 6px;
  --radius-sm: 10px;
  --radius-md: 16px;
  --radius-lg: 24px;
  --radius-pill: 9999px; /* Para botones cápsula, chips y badges */

  /* Shadows */
  --shadow-subtle: 0 2px 8px rgba(0, 0, 0, 0.04);
  --shadow-card: 0 6px 20px -4px rgba(0, 0, 0, 0.06);
  --shadow-hover: 0 12px 28px -6px rgba(0, 0, 0, 0.12);
  --shadow-primary-glow: 0 8px 20px -4px rgba(230, 57, 70, 0.35);
  --shadow-dark-float: 0 10px 25px -5px rgba(9, 9, 11, 0.25);
}

6. Especificaciones de Componentes UI (Primitives)
A. Botones (Buttons)


Primary Button (CTA):


Background: var(--grad-primary)

Text: #FFFFFF (font-weight: 600)

Border-Radius: var(--radius-pill) o var(--radius-md)

Shadow: var(--shadow-primary-glow)

Dark Accent Button (Flotante / Secundario Destacado):


Background: var(--grad-dark-element)

Text: #FFFFFF

Border-Radius: var(--radius-pill)

Shadow: var(--shadow-dark-float)

Ghost / Outline Button:


Background: transparent

Border: 1px solid var(--border-medium)

Text: var(--text-primary)

Hover: Background var(--bg-canvas)
B. Chips / Pills de Filtro & Selección


Estado Normal: Fondo #FFFFFF, borde 1px solid var(--border-medium), texto var(--text-muted). Border-radius: var(--radius-pill).

Estado Activo: Fondo var(--color-dark-jet) (#09090B), texto #FFFFFF, borde transparente.
C. Tarjetas (Cards)


Background: var(--bg-surface) (#FFFFFF)

Border-Radius: var(--radius-md) (16px) o var(--radius-lg) (24px)

Border: 1px solid var(--border-subtle)

Shadow: var(--shadow-card)

Hover State: Elevación suave mediante transform: translateY(-4px) y aplicación de var(--shadow-hover).
D. Badges & Tags Indicadores


Badge Social / Calificación: Fondo var(--color-accent-light), texto e icono var(--color-accent-dark).

Badge Marca / Categoría: Fondo var(--color-primary-light), texto var(--color-primary-vibrant).

Badge Neutral: Fondo #09090B, texto #FFFFFF.

Forma: Siempre en cápsula (border-radius: var(--radius-pill)).
E. Campos de Entrada (Inputs)


Background: var(--bg-surface)

Border: 1.5px solid var(--border-medium)

Border-Radius: var(--radius-md) o var(--radius-pill)

Focus State: Border var(--color-primary-vibrant) con sombra sutil de enfoque.
F. Iconografía & Labels


Íconos de trazo limpio (Feather Icons, Lucide Icons o Heroicons en estilo outline o solid según estado).

Grosor de línea predeterminado: 1.75px o 2px.

Las etiquetas (Labels) deben ubicarse siempre por encima o dentro de contenedores limpios con excelente espacio negativo (padding).
7. Reglas Estrictas para Generadores de Código / IA


Cumplimiento WCAG: Garantizar que todo texto oscuro sobre fondo claro o texto blanco sobre fondos oscuros/rojos cumpla con el estándar de contraste mínimo 4.5:1. Nunca usar texto blanco sobre amarillo/dorado.

Prohibido el Tema Oscuro: Todo elemento, contenedor, fondo de página o modal debe crearse pensado exclusivamente en modo claro (#FAFAFC / #FFFFFF).

Cero Rojos Planos de Alerta: No utilizar jamás #FF0000 ni rojos planos puros de sistema. Utilizar únicamente las variables definidas de Vibrant Crimson.

Espaciado Sistemático: Utilizar una escala de espaciado basada en múltiplos de 4px / 8px (4px, 8px, 12px, 16px, 24px, 32px, 48px, 64px).