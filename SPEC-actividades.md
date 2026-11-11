# Spec: `actividades` — qué se puede hacer en Ibagué, más allá de eventos y sitios

Estado: **BORRADOR para aprobación. No hay código.** Fecha: 2026-11-10.
Relacionadas: `SPEC-site-sections.md` (secciones desplegables, se reutilizan), `SPEC-analytics-v2.md` (medición y enlaces cortos, se reutilizan), `docs/16-sitios-confianza-y-reclamos.md` (reclamos, sugerencias y antispam, se extienden), `docs/14-legal-y-cumplimiento.md` (marco legal; esta spec lo agrava y exige actualizarlo), `docs/28-plan-crecimiento.md` (plan de crecimiento), memoria `next-task-growth-actividades-desplegables` (decisión del 2026-11-01 de crear "Actividades" como entidad, no etiqueta).

Idioma de la interfaz y de los textos: español de Colombia, **tú/usted, nunca voseo**.

---

## 0. Cómo leer este documento

1. Sección 1: qué es y por qué (objetivo, usuarios, qué no es).
2. Sección 2: **decisiones ya tomadas** con el dueño (para no rediscutirlas).
3. Sección 3: **supuestos** que asumo (corrígelos ahora o sigo con ellos).
4. Sección 4: **mapa de capacidades** (módulos con id estable, dependencias y orden). Es lo primero que hay que aprobar.
5. Secciones 5 a 7: modelo de dominio, estados y permisos (transversales a todos los módulos).
6. Sección 8: una subsección por módulo, con requisitos y criterios de aceptación propios.
7. Secciones 9 a 17: transversales (SEO, UI, costos, seguridad, legal, medición, rendimiento, accesibilidad, contenido inicial).
8. Secciones 18 a 24: los seis ejes obligatorios de una spec (comandos, estructura, estilo, pruebas, límites, criterios de éxito) y las preguntas abiertas.

Nada de esto se construye hasta que apruebes. Después de aprobar vienen `tasks/plan-actividades.md` y `tasks/todo-actividades.md` (flujo de siempre: spec → plan → tareas → TDD → revisión → entrega).

---

## 1. Objetivo

### 1.1 El problema

Hoy la plataforma tiene dos tipos de contenido:
- **Eventos**: pasan en una fecha concreta (o varias fechas, multi-fecha).
- **Sitios**: lugares físicos con ficha.

Quedan **vacíos que la gente sí busca** ("cosas para hacer en Ibagué"): lo que se hace de forma **recurrente o permanente** y no es ni un evento ni un lugar:
- Una comunidad que hace **senderismo todos los domingos**: pagas una cantidad, te dan almuerzo. No es un evento (se repite sin fecha de cierre) y no está atada a un sitio.
- Una **cafetería**: ir a tomar café, comprar plantas, reservar el espacio para un club de lectura.
- Una **heladería** (Nebraska): comer helado, compartir en familia; con promociones ("las tardes felices", "Black Sunday").
- Un **cine**: ir a ver una película (la cartelera, con opiniones).
- Un **parque ecoturístico** (La Plata): hacer senderismo, con las aventuras que cuentan otras personas, estilo Tripadvisor.

### 1.2 La promesa

> **Que Hay Pa Hacer? es la plataforma contra el aburrimiento en Ibagué: eventos, sitios y actividades en un solo lugar, y siempre hay algo por hacer.**

Una **actividad** es **algo que una persona hace**, con o sin lugar fijo y con o sin fecha fija.

### 1.3 Qué es una actividad y qué no

| | Evento | Sitio | **Actividad** |
|---|---|---|---|
| Qué es | Algo que pasa en una fecha (o varias) | Un lugar físico | **Algo que haces** |
| Tiempo | Fechas puntuales | Siempre ahí | **Recurrente (domingos, cada 15 días, 1 vez al mes) o permanente** |
| Lugar | Casi siempre | Es el lugar | **Opcional** (global) u **obligatorio vía sitio** (de sitio) |
| Ejemplo | Concierto del 14-nov | Heladería Nebraska | **Senderismo los domingos / Comer helado en Nebraska** |

Tipos de actividad (decisión del dueño):
- **Global** (`global`): no depende de un sitio. La crea la comunidad u organizador con cuenta propia. Tiene un **punto de encuentro**. Puede vincularse **opcionalmente** a un sitio **solo si quien la crea es dueño de ese sitio** (ver 7).
- **De sitio** (`site`): vive en un sitio y se muestra también en la ficha de ese sitio ("¿Qué se puede hacer aquí?"). Solo la crea el **dueño del sitio**. Solo estas pueden tener **menú/productos**, **espacios reservables** y **promociones** vinculadas.

### 1.4 Qué NO es (límites de esta spec)

- **No es un blog ni una página básica**: es un módulo completo (creación, moderación, descubrimiento, SEO, reseñas con medios, promociones, medición).
- **No hay pagos dentro de la app en esta spec.** "Comprar" y "reservar" abren un botón externo (WhatsApp, web, enlace de pago del propio negocio). El split de pagos con comisión (idea del 10%) es una **tarea futura aparte** (sección 8.9), que esta spec solo **deja preparada** con un campo intercambiable, sin construir nada de dinero.
- **No es un nuevo módulo de talleres**: un taller con fecha(s) es un **evento** (categoría "taller") con el multi-fecha que ya existe; un taller **recurrente sin fecha fija** es una actividad. (Decisión recomendada y aceptada por el dueño al no objetarla; ver preguntas abiertas si se quiere revertir.)
- **No hay ranking por analítica** en la primera versión: las actividades se muestran **al azar por día** y con igualdad de trato (decisión del dueño: sin analítica no hay relevancia).

### 1.5 Usuarios y qué quiere cada uno

| Usuario | Quiere | Éxito |
|---|---|---|
| **Visitante** (cualquiera, sin cuenta) | Encontrar qué hacer hoy/este fin de semana, por presupuesto o con quién va | Llega por Google a una actividad, ve cuándo/cuánto/cómo, y actúa (WhatsApp, cómo llegar) |
| **Persona con cuenta (Google)** | Contar su experiencia rápido (estrellas, texto, fotos, video), marcar "Yo fui" | Publica una reseña en menos de 1 minuto con Google |
| **Creador de actividad** (comunidad, persona, dueño de sitio) | Que su actividad exista, se vea bien y llegue gente; defenderse de reseñas injustas | Actividad aprobada en pocas horas; ve sus reseñas y puede cuestionar una injusta |
| **Dueño de sitio** | Mostrar qué se puede hacer en su sitio, con menú, espacios y promociones | La ficha del sitio muestra sus actividades y promos vigentes |
| **QHPA (administración)** | Calidad y confianza sin ser cuello de botella | Revisa solo lo reportado o lo nuevo de cuentas sin historial |

### 1.6 Éxito global (medible)

1. Cualquier persona con cuenta puede crear una actividad (no solo Premium ni verificados).
2. Una búsqueda como "cosas para hacer en Ibagué" tiene **páginas propias indexables** (hub y landings) con actividades reales.
3. Home muestra cada día un conjunto distinto y parejo de actividades.
4. Una reseña se publica con Google en un flujo corto, con hasta 3 fotos y 1 video, **una por persona y actividad**.
5. Un dueño puede cuestionar una reseña y QHPA la resuelve con consecuencias para quien incumple (cuenta que reseñó en falso o dueño que abusa del botón).
6. Ninguna reseña ni actividad de spam llega al índice de Google sin pasar por los frenos definidos aquí.

---

## 2. Decisiones ya tomadas (registro, 2026-11-10)

| # | Decisión | Origen |
|---|---|---|
| D1 | Las actividades las crean **usuarios**, **sin exigir Premium ni verificación** (`creatorVerified` y `plan` no se piden); crear la primera los vuelve `creator` (D37). Reseñar lo puede hacer cualquier cuenta. | Dueño (Q1, 2026-11-10) |
| D2 | Comprar/vender dentro de la plataforma con comisión (idea del 10%) es **tarea aparte** y futura; hoy solo botón externo. | Dueño |
| D3 | Actividad **global**: la crea la comunidad con **cuenta propia**; puede **opcionalmente** asignarse a un sitio. Las opciones de **menú, compra y reserva solo existen con un sitio**. | Dueño |
| D4 | Horarios **estructurados** (no texto libre): recurrencia + **categorías de precio y servicios** ("si lo quieres con agua cuesta tanto"). | Dueño |
| D5 | **Reseñas con Google**, con imágenes y video, **una reseña por persona** y actividad. | Dueño |
| D6 | **Límites de medios**: 3 fotos + 1 video por reseña. | Dueño |
| D7 | El dueño puede **cuestionar/ocultar** una reseña negativa con motivo; QHPA revisa: si la reseña es real → **advertencia a la cuenta del dueño**; si es falsa → **advertencia a quien la escribió**. | Dueño |
| D8 | La reseña cuestionada **sigue visible**, en **rojo suave** y con la leyenda de que **QHPA la está verificando** (efecto psicológico: transparencia, no censura). | Dueño |
| D9 | Primera versión de reseñas: **simple pero con muy buen diseño**; el álbum/libro que se voltea queda para una fase posterior. | Dueño |
| D10 | **Promociones** ("tardes felices", "Black Sunday") como **bloque vinculado al sitio y a la actividad**, no como actividad. | Dueño |
| D11 | Una actividad de sitio vive **dentro de la ficha del sitio** y además tiene **URL pública propia**. | Dueño |
| D12 | **Si el sitio no es tuyo no puedes crear actividades de ese sitio.** | Dueño |
| D13 | **Autoaprobación por historial**: la primera actividad nace "en revisión" (no se indexa ni sale en listados hasta aprobarla); cuentas con historial limpio quedan autoaprobadas y QHPA revisa solo lo reportado. | Propuesta mía, aceptada |
| D14 | Home: actividades **al azar cada día**, todas por igual; página propia con categorías/filtros; presencia en la **barra de búsqueda**; en cada sitio un bloque "¿Qué se puede hacer aquí?". | Dueño |
| D15 | Ideas aceptadas: botón **"Yo fui"**, filtro **"Hoy en Ibagué"/"este fin de semana"**, filtro por **presupuesto**, filtro **"con quién vas"**, **tarjeta para compartir** una reseña, **"Próxima salida"** visible. | Dueño |
| D16 | Moderación: no es "cuello de botella"; se resuelve con revisión inicial + autoaprobación por historial + scripts/alertas. | Dueño |
| D17 | Datos legales: se siguen guardando datos de quienes reseñan; se actualizan términos y privacidad. | Dueño |
| D18 | Contenido real inicial: el dueño tiene **~5 actividades** para cargar. | Dueño |
| D19 | Crear actividades requiere ser `creator` (no Premium ni verificado), y **se llega a serlo automáticamente al crear la primera** (D37). | Dueño (Q1, Q19) |
| D20 | La comunidad **se registra sola** y su primera actividad pasa por revisión. | Dueño (Q2) |
| D21 | Categorías ampliadas de 11 a **16** (5.3). | Dueño (Q3) |
| D22 | **Punto de encuentro opcional** en globales: `fixed`, `sharedAfterJoining` (se dice en el grupo de WhatsApp) o `varies`; CTA `whatsappGroup`. | Dueño (Q4) |
| D23 | Edición por cuentas sin confianza: **se oculta y vuelve a revisión** (opción recomendada). | Dueño (Q5) |
| D24 | Antes de reseñas (F3) **no se muestra** espacio "Historias". | Dueño (Q6) |
| D25 | Escalera de sanciones y umbrales: **valores recomendados** de 8.6. | Dueño (Q7) |
| D26 | En una reseña cuestionada **no se muestra el motivo**, solo "QHPA la está verificando" (neutro). | Dueño (Q8) |
| D27 | **Cumplir la norma (Ley 1480 art. 53)**: quien publique una actividad **debe dejar** sus datos de identificación; QHPA los **registra**, los deja **consultables para quejas** y los entrega a la autoridad. Sin abogado como requisito previo (decisión del dueño), aunque se recomienda revisión posterior. | Dueño (Q9, Q21) |
| D28 | **Video en reseñas ENCENDIDO** desde el inicio. **No se recorta**: solo se **baja un poco la calidad** (recompresión) con el **procesador de video que ya existe en el repo hermano `../functions`** (`ffmpeg`, H.264, `+faststart`). Interruptor de emergencia. | Dueño (Q10) |
| D37 | **Una cuenta pasa a `creator` automáticamente al crear su primera actividad**, igual que hoy una cuenta `consumer` pasa a `creator` al crear un evento o un sitio. | Dueño (Q19, confirmado 2026-11-10) |
| D38 | **Prototipos visuales por tarea** en Artifact (pantallas, flujos, modales, componentes), **uno a la vez según la tarea**, no todos de golpe (sección 25). | Dueño |
| D39 | La investigación del **split de pagos con Mercado Pago** se hace como **tarea aparte en segundo plano**, sin código (sección 8.9). | Dueño (Q22) |
| D29 | Sin colaboradores por actividad (una cuenta dueña, transferible por QHPA). | Dueño (Q11) |
| D30 | **Apelación** solo con fundamentos, según gravedad; sin fundamentos se cierra sin trámite. | Dueño (Q12) |
| D31 | **"Guardar" se adelanta a F1** y sirve a actividades, eventos y sitios por igual (coordinado con el módulo `intent` de `analytics-v2`); "Yo fui" también. | Dueño (objetivo: usuarios que interactúan) |
| D40 | **Prioridad de producto: conseguir usuarios que interactúen**; lo demás (Premium, pulido) va después. | Dueño |
| D41 | **Inscribirse a una actividad es gratis y exige cuenta** (cada participante es un usuario registrado); Premium solo lo avanzado. | Propuesta mía, aceptada |
| D43 | **Canales para atraer y devolver usuarios (todos)**: campanita (ya existe), **correo con Resend** (plan gratis), **notificaciones push web** y **Canal de WhatsApp**, con **permisos y preferencias por canal**. Dos correos de valor: (1) "actividades y sitios que te pueden interesar" y (2) "eventos de esta semana"; más confirmaciones y recordatorios de inscripciones. | Dueño |
| D42 | Material de acercamiento a comunidades (guion, mensaje de WhatsApp, afiche con QR) lo prepara el asistente; el dueño habla con ellas. | Dueño |
| D32 | Cartelera de cine **a mano** o enlace al cine (sin API ni scraping); F5. | Dueño (Q14) |
| D33 | Páginas SEO solo con **fundamento** (intención distinta, texto propio, ≥3 actividades); pilar sí. | Dueño (Q15) |
| D34 | Taller con fecha = evento; taller recurrente = actividad. | Dueño (Q16) |
| D35 | **El dueño carga las actividades** desde la app con cuenta admin. | Dueño (Q17) |
| D36 | Reseñas de cuentas eliminadas: **anonimizar** por defecto; borrar a solicitud. | Dueño (Q18) |

---

## 3. Supuestos que asumo (corrígelos ahora o sigo con ellos)

1. Solo **web** (Next.js 16 App Router con Cache Components, según el repo); sin app nativa nueva. El `AGENTS.md` del repo avisa que esta versión de Next **difiere de lo conocido**: antes de escribir código se lee la guía relevante en `node_modules/next/dist/docs/`.
2. Firestore (Enterprise) es la fuente de verdad. **Sin nuevas dependencias** si el stack actual alcanza (`radix-ui` Accordion, `date-fns`, `valibot`, `@base-ui/react`, `embla-carousel-react`, `lucide-react` ya están).
3. La **autoría** de un sitio es `site.author.id` (campo existente; el reclamo aprobado cambia el autor). "Dueño del sitio" = autor del sitio **o** cuenta administradora de QHPA (`QHPA_ADMIN_UIDS`) actuando en nombre del dueño. **No existe hoy otro rol** de dueño; el `SiteOwner` de un sitio administrado por QHPA es un perfil externo sin cuenta (solo se muestra).
4. Las colecciones nuevas se escriben **solo por Admin SDK** (como `siteClaims`, `reports`); las reglas de Firestore y Storage del repo son una propuesta no desplegada y todo el acceso real pasa por el servidor. Las reglas reales se manejan fuera del repo: cualquier cambio de reglas o índices es "preguntar antes".
5. Las cuentas existentes tienen `participation: consumer | creator`, `plan: basic | premium`, `creatorVerified` **independientes**. Esta spec no los vuelve a tocar y no depende de ellos para crear (ver pregunta Q1).
6. **Se prohíbe** reintroducir en código los nombres `professional/accountType/business/organizer/government/digitalCreator` (regla del proyecto). En esta spec el organizador de una actividad se llama `host` ("anfitrión") en el código; en la UI se dice "Organiza".
7. La zona horaria de todo es **America/Bogota** (UTC-5 sin horario de verano). Ya existe el helper `bogotaDay`.
8. No hay panel administrativo todavía (está como tarea futura); la administración se hace con **scripts** (`scripts/list-*.ts` con dry-run por defecto, patrón de `list-site-claims.ts`) y alertas por log. Ver 8.2 y 8.6.
9. El dueño tiene ~5 actividades reales con permiso; sin contenido real el módulo es una vitrina vacía. La carga inicial es por script en develop primero.
10. La entrega es en `develop`; producción y escrituras de datos reales solo con orden explícita.

---

## 4. Mapa de capacidades (para aprobar ANTES del plan)

La petición reúne varias capacidades independientes con sus propios consumidores y datos, por eso se descompone. Cada módulo se puede construir, lanzar y verificar solo.

| Módulo (id) | Responsabilidad | Depende de |
|---|---|---|
| `activity-core` | Entidad, categorías, recurrencia estructurada, precios/servicios, CTA, estados, validación, repositorio, slug | — |
| `activity-publish` | Crear/editar en Studio, reglas de propiedad (global/sitio), moderación inicial, autoaprobación por historial, antispam, notificaciones, administración por scripts | `activity-core` |
| `activity-discovery` | Detalle público, listado/`/actividades`, filtros (hoy, fin de semana, presupuesto, con quién, categoría), búsqueda, bloque en home (azar diario), bloque en la ficha del sitio, compartir | `activity-core`, `activity-publish` |
| `activity-seo` | URLs, metadatos, Open Graph, JSON-LD, sitemap, landings por categoría, página pilar "cosas para hacer en Ibagué", enlazado interno | `activity-discovery` |
| `activity-engagement` | **Que los usuarios hagan cosas y vuelvan**: Guardar, "Yo fui", Unirme/reservar cupo (con cuenta), Mis planes, avisos, resumen semanal automático, **canales de aviso (campanita, correo con Resend, push web, Canal de WhatsApp)**, insignias y pasaporte, kit de compartir con QR | `activity-core`, `activity-publish`, `activity-discovery` |
| `activity-reviews` | Reseñas con Google (estrellas, texto, fotos, video), una por persona, "Yo fui", agregados, respuesta del dueño, UI "polaroid" | `activity-core`, `activity-discovery`, `legal-privacy` |
| `review-moderation` | Cuestionar reseña (dueño), verificación por QHPA, sanciones/advertencias, UI en rojo, reportes de reseñas | `activity-reviews`, `activity-publish` |
| `site-offerings` | Solo actividades de sitio: menú/productos, espacios reservables, promociones vinculadas a sitio y actividad | `activity-core`, `activity-publish` |
| `activity-insights` | Contadores y vistas (patrón `measure`), enlaces cortos/QR y kit para compartir, estadísticas para el creador | `activity-discovery`, `analytics-v2` (`measure`, `short-links`) |
| `legal-privacy` | Actualizar Términos/Privacidad, `LEGAL_VERSION`, declaración de reseña, retención y supresión de datos | — (precede a `activity-reviews`) |
| `activity-commerce` *(FUTURO, no se construye)* | Compra/reserva con split (Mercado Pago o ePayco) | `site-offerings` |

**Orden de construcción:**
`activity-core` → `activity-publish` → `activity-discovery` + `activity-engagement` (parte 1: guardar, yo fui, unirse, kit QR) → `activity-seo` → `activity-engagement` (parte 2: mis planes, avisos, resumen semanal) → `legal-privacy` → `activity-reviews` → `review-moderation` → `site-offerings` → `activity-insights` → `activity-premium` (futuro) → `activity-commerce` (futuro).

**Fases de entrega para el usuario final (agrupan los módulos):**

| Fase | Contenido | Resultado visible |
|---|---|---|
| **F1** | `activity-core` + `activity-publish` + `activity-discovery` (detalle, hub, bloque en sitio) + `activity-seo` básico + **`activity-engagement` parte 1**: **Guardar, "Yo fui", Unirme/reservar cupo con cuenta, kit de compartir con QR/afiche, medición mínima** + carga de las ~5 actividades reales | Actividades reales que **se pueden compartir y a las que la gente se une con una cuenta** |
| **F2** | Home azar diario + búsqueda + filtros "Hoy/fin de semana/presupuesto/con quién" + landings/pilar + **`activity-engagement` parte 2: Mis planes, avisos, resumen semanal automático** | "Siempre hay algo por hacer" y razones para **volver** |
| **F3** | `legal-privacy` + `activity-reviews` + `review-moderation` + tarjeta para compartir reseña + **insignias y pasaporte** | Reseñas con Google, medios, cuestionar y verificación; coleccionables |
| **F4** | `site-offerings` (menú/espacios/promos) + `activity-insights` (panel del creador) | Bloques de comprar/reservar/promos y estadísticas |
| **F5** | Álbum/libro que se voltea, cartelera de cine, horarios avanzados, **`activity-premium`** (cupos y asistencia avanzados, estadísticas completas, kit sin marca, equipo) | Pulido y primeras funciones de pago |
| **Futuro** | `activity-commerce` (split de pagos) | Ganancia por compras |

Si algún límite entre módulos está mal, se ajusta aquí antes de escribir el plan.

---

## 5. Modelo de dominio

Convenciones del repo que se mantienen: arquitectura por capas (`domain` → `application` → `infraestructure` → `presentation`/`app`), validación con **valibot** en DTOs, normalizadores puros con test colocado (`*.test.ts`), mapeadores `toDto`/`toViewModel`, `createServerContainer()` para inyección.

### 5.1 Entidad `Activity` (colección `activities`)

| Campo | Tipo / regla | Notas |
|---|---|---|
| `id` | string (id de Firestore) | |
| `slug` | string único, **inmutable tras publicar** | `slugify(title)`; en colisión sufijo corto. Cambiar el título no cambia el slug (SEO) |
| `title` | texto plano 3–80 | Sin HTML, sin URL |
| `tagline` | texto plano 0–140 | Frase gancho |
| `description` | texto plano 20–2000 | `whitespace-pre-line`; sin HTML/Markdown |
| `kind` | `"global" \| "site"` | Derivado: `site` si hay `siteId` |
| `siteId` | string \| null | Solo si `kind="site"`; **exige propiedad** (ver 7) |
| `host` | `{ kind: "user" \| "siteOwner", id, displayName, photoURL }` | Quién organiza (snapshot). `siteOwner` para sitios administrados por QHPA con perfil externo |
| `ownerUid` | string | Cuenta que la creó y la administra |
| `category` | enum de 5.3 | Una principal |
| `companions` | subconjunto de `solo,pareja,familia,amigos,ninos,mascotas` (máx. 6) | "¿Con quién vas?" |
| `difficulty` | `easy \| medium \| hard \| null` | Solo aire libre/deporte; opcional |
| `durationMinutes` | int 15–1440 \| null | Opcional |
| `ageNote` | texto 0–120 | Ej. "Menores de 12 con adulto" |
| `meetingPoint` | `{ mode: "fixed" \| "sharedAfterJoining" \| "varies", text 0–160, references 0–240, geo: GeoPoint \| null }` | Para `global`: `fixed` exige `text`; **`sharedAfterJoining`** (el punto se dice en el grupo de WhatsApp al unirse) y **`varies`** (cambia cada vez) **no piden dirección**. Para `site` se hereda del sitio (Q4) |
| `schedule` | ver 5.4 | Obligatorio |
| `priceOptions` | máx. 8, ver 5.5 | Al menos 1 (puede ser gratis) |
| `extras` | máx. 10, ver 5.5 | Servicios con costo adicional |
| `sections` | `SiteSection[]` (se **reutiliza** el normalizador y el acordeón de sitios) | "Qué incluye", "Qué llevar", "Reglas". Mismos límites que `SPEC-site-sections.md` (máx. 12, título ≤60, cuerpo ≤3000, total ≤8000) |
| `cta` | ver 5.6 | Cómo comprar/reservar/preguntar |
| `media` | portada + galería | Reutiliza el pipeline de imágenes (ver 5.7) |
| `searchTokens` | string[] normalizados | Para búsqueda barata (ver 8.3); **no** substring/prefijo |
| `occursWeekdays` | int[] 0–6 | Denormalizado para "hoy" sin TableScan |
| `nextOccurrenceAt` | Timestamp \| null | Próxima salida; la refresca la escritura y el barrido horario |
| `rating` | `{ count, sum, avg, dist: [n1..n5] }` | Se llena en `activity-reviews` |
| `analytics` | `{ views, clicks, visits, reviews }` | Contadores; se llena en `activity-insights` |
| `publicationStatus` | `draft \| published` | Mismo enum que sitios |
| `moderationStatus` | `pending \| approved \| rejected` | Mismo enum que sitios |
| `isActive` | boolean | El creador la **pausa** sin borrarla |
| `reviewedAt`, `reviewedBy`, `rejectedAt`, `rejectionReason` | | Igual que sitios |
| `createdAt`, `updatedAt`, `publishedAt` | Date | |

**Invariantes** (constructor, igual que `Site`): para `published` exigir título, slug, descripción, una **única portada**, `schedule` válido, al menos 1 `priceOption`; si es `global`, `meetingPoint.text`; si es `site`, `siteId` válido.

**Visible al público** ⇔ `publicationStatus="published"` ∧ `moderationStatus="approved"` ∧ `isActive` ∧ (si `kind="site"`) el sitio sigue publicado.

### 5.2 Subcolecciones y colecciones auxiliares

| Colección | Contenido | Quién escribe |
|---|---|---|
| `activities/{id}/reviews/{uid}` | Una reseña por persona (el **id del documento es el uid**: garantiza una por persona) | Servidor |
| `activities/{id}/visits/{uid}` | "Yo fui" (una por persona) | Servidor |
| `activities/{id}/stats/{díaBogotá}` | Contadores diarios (patrón de sitios) | Servidor |
| `activityPromotions/{id}` | Promociones vinculadas (top-level para consultarlas por día) | Servidor |
| `hostIdentities/{uid}` | Registro **privado** de oferentes (Ley 1480 art. 53): identificación, fecha, versión legal, bitácora de consultas y exportaciones | Servidor (solo Admin SDK) |
| `activityAccounts/{uid}` | Historial de la cuenta: `approvedCount`, `rejectedCount`, `suspendedUntil`, `trusted` calculado | Servidor |
| `activitySanctions/{id}` | Advertencias y sanciones (ver 8.6) | Servidor (admin) |
| `reports` (existente) | Se amplía `ReportTargetType` con `"activity"` y `"review"` | Servidor |
| `contentDeclarations/{tipo}_{id}` (existente) | Declaración del creador y del reseñador | Servidor |

### 5.3 Categorías (lista inicial de 16; el dueño la ajusta)

Constante en dominio (patrón de `SiteCategory`), **slug estable** (se usa en URLs). Agregar una categoría después es barato (una constante); **quitar o renombrar un slug no** (rompe URLs y SEO), así que se piensa bien antes de lanzar. Lo que no encaje se cubre con `otros` (con revisión manual); si aparecen muchas actividades en `otros` con el mismo tema, es la señal para crear una categoría nueva:

| Slug | Nombre | Ejemplos |
|---|---|---|
| `aire-libre` | Aire libre y aventura | Senderismo, ciclismo, ecoturismo |
| `comida-y-bebida` | Comida y bebida | Helado, café, restaurantes, catas |
| `cultura-y-arte` | Cultura y arte | Museos, galerías, visitas guiadas |
| `deporte-y-bienestar` | Deporte y bienestar | Yoga, running clubs, canchas |
| `en-familia` | En familia | Planes con niños, parques |
| `musica-y-vida-nocturna` | Música y vida nocturna | Jams, karaoke, noche de salsa |
| `cine-y-espectaculos` | Cine y espectáculos | Cine, teatro de sala |
| `lectura-y-clubes` | Lectura y clubes | Club de lectura, ajedrez, juegos de mesa |
| `talleres-y-aprendizaje` | Talleres y aprendizaje | Talleres recurrentes sin fecha fija |
| `compras-y-mercados` | Compras y mercados | Plantas, artesanías, mercados |
| `espacios-y-reservas` | Espacios y reservas | Salas, terrazas, coworking por horas |
| `juegos-y-diversion` | Juegos y diversión | Bolos, escape rooms, karts, videojuegos, juegos de mesa en vivo |
| `turismo-y-paseos` | Turismo y paseos | Tours, caminatas guiadas por la ciudad, paseos a fincas, cabalgatas |
| `voluntariado-y-comunidad` | Voluntariado y comunidad | Siembras, limpiezas, jornadas solidarias, mingas |
| `fe-y-espiritualidad` | Fe y espiritualidad | Encuentros, retiros, meditación abierta |
| `otros` | Otros | Todo lo que no encaja; **entra siempre a revisión manual** aunque la cuenta sea de confianza |

Máximo **una** categoría principal por actividad. Las etiquetas "con quién vas" y la banda de presupuesto son ejes de filtro aparte, no categorías.

### 5.4 Recurrencia estructurada (`schedule`)

Objetivo: no texto libre. Debe permitir (a) mostrar "Próxima salida", (b) filtrar "hoy" y "este fin de semana", (c) generar texto legible.

```
schedule: {
  timezone: "America/Bogota"          // fijo
  rules: ScheduleRule[]               // 1..7 reglas
  validFrom?: date                    // inicio de vigencia
  validUntil?: date                   // fin de vigencia (temporada)
  skipDates: date[]                   // excepciones (máx. 60): festivos, mantenimiento
  note?: string (≤160)                // ej. "Si llueve fuerte se reprograma"
  requiresReservation: boolean        // hay que reservar antes
}

ScheduleRule =
  | { kind: "weekly",      weekdays: (0-6)[], start: "HH:mm", end?: "HH:mm" }
  | { kind: "everyNWeeks", n: 2..8, anchorDate: date, weekdays: (0-6)[], start, end? }
  | { kind: "monthlyNth",  nth: 1|2|3|4|"last", weekday: 0-6, start, end? }
  | { kind: "monthlyDay",  dayOfMonth: 1..31, start, end? }
  | { kind: "dates",       dates: date[] (máx. 52), start, end? }       // fechas sueltas
  | { kind: "always",      openingHours?: DaySchedule[] }               // permanente: sigue el horario del sitio o uno propio
  | { kind: "byAppointment" }                                           // solo con cita
```

Reglas:
- Las horas son `HH:mm` 24 h; `end` > `start` (o cruza medianoche solo con bandera explícita; por defecto no).
- `weekdays` sin repetidos; `n` de `everyNWeeks` entre 2 y 8; el **ancla** define a qué semana corresponde (evita ambigüedad).
- `monthlyDay` con día 29–31 se salta los meses que no lo tienen (se documenta en el texto legible).
- **Función pura única** `occurrencesBetween(schedule, from, to)` y `nextOccurrence(schedule, from)` en `domain/entities/activities/` (con tests exhaustivos). **Todo lo demás se deriva de ahí**: "Próxima salida", "Hoy", "Fin de semana", `occursWeekdays`, `nextOccurrenceAt` y el texto legible ("Todos los domingos · 6:00 a. m.").
- `always` con `openingHours` ausente en una actividad de sitio **hereda el horario del sitio** (`site.schedule`); se muestra como "Mismo horario del sitio".
- Festivos de Colombia: ya existe `domain/entities/holidays/colombiaHolidays.ts`; **no** se aplican automáticamente (una comunidad puede salir un festivo). El creador los agrega en `skipDates` si quiere.
- "Hoy en Ibagué" = `occurrencesBetween` incluye hoy (Bogotá) y no hay `skipDates`.

### 5.5 Precios, servicios y extras

```
priceOptions: PriceOption[]  // 1..8
PriceOption = {
  label: string (≤40)             // "Salida completa", "Solo caminata"
  amountCop: int >= 0             // 0 = gratis; pesos colombianos enteros
  unit: "persona" | "grupo" | "hora" | "unidad"
  includes: string[]  (0..6, cada una ≤40)   // "Almuerzo", "Guía", "Seguro"
  note?: string (≤120)
}

extras: Extra[]  // 0..10
Extra = {
  label: string (≤40)             // "Con agua", "Alquiler de bastones"
  amountCop: int >= 0
  unit: "persona" | "grupo" | "unidad"
  note?: string (≤120)
}
```

- `priceFromCop` = mínimo de `priceOptions` (para filtros, tarjetas y SEO).
- **Bandas de presupuesto** (función pura, para el filtro): `gratis` (0), `hasta-20000`, `hasta-50000`, `hasta-100000`, `mas-de-100000`. Misma idea que el filtro `maxPrice` de eventos.
- Moneda fija **COP**. Sin decimales. Formato `$40.000`.
- Los extras **no** cambian `priceFromCop`.

### 5.6 CTA: "cómo comprar / reservar / preguntar" (campo intercambiable)

```
cta: {
  kind: "whatsapp" | "whatsappGroup" | "website" | "instagram" | "phone" | "reserveLink" | "buyLink",
  value: string,          // normalizado y validado por tipo
  label?: string (≤30)    // texto del botón; por defecto según `kind`
}
```

- `whatsapp`: número colombiano → se normaliza a `https://wa.me/57XXXXXXXXXX`; texto precargado opcional con el nombre de la actividad.
- `whatsappGroup`: enlace de invitación a un grupo (`https://chat.whatsapp.com/…`), botón por defecto "Unirme al grupo". Es el caso típico de comunidades (senderismo): ahí se coordina el punto de encuentro. Solo se acepta ese dominio exacto.
- `website`/`reserveLink`/`buyLink`/`instagram`: solo **https**; se rechazan `javascript:`, `data:`, `http:` y dominios con credenciales; se abren con `rel="noopener noreferrer"` y por el **enlace contado** `/r/…` cuando exista (módulo `activity-insights`).
- **Preparado para el futuro**: `kind` reserva un valor `"checkout"` (pago dentro de QHPA con split) que **hoy no se acepta en validación** y solo se habilita en `activity-commerce`. Cambiarlo no debe obligar a migrar datos.

### 5.7 Medios de la actividad

- Portada obligatoria (una sola) + galería de hasta 8 imágenes; **un video opcional** de la actividad (ya existe `VideoMedia` en sitios).
- Se reutiliza el **mismo pipeline** de subida (URL firmada V4 `generateUploadUrl`, optimizador por Cloud Function, estado "procesando" observado por el autor), con las lecciones de `media-pipeline-race-fix` y `image-quality-event-images` (1920 px / q90 con calidades `[75, 90]`). El plan verificará cómo se parametriza para actividades; **si el optimizador es una Cloud Function del repo `functions`, ampliarlo es cambio externo ("preguntar antes")**.
- Texto alternativo por imagen: `alt` opcional ≤125; si falta, se compone con el título.
- Sin contenido para adultos ni de terceros sin permiso (declaración del autor, 9).

### 5.8 Entidad `ActivityPromotion` (`activityPromotions`)

| Campo | Regla |
|---|---|
| `id`, `activityId` (**obligatorio**), `siteId` (derivado de la actividad si es de sitio) | Vinculada a **sitio y actividad** (decisión D10) |
| `title` 3–60, `description` 0–240 | "Tardes felices", "2x1 en helados de 3 a 6 p. m." |
| `rule` | `{ kind: "percent" \| "twoForOne" \| "freeItem" \| "fixedPrice" \| "other", value? }` — solo para mostrar y filtrar; **no** calcula cobros |
| `schedule` | Mismo `schedule` de 5.4 (reglas semanales, fechas, vigencia) |
| `validFrom`, `validUntil` | Obligatoria la vigencia final (las promos caducan: evita información vieja) |
| `termsNote` | ≤160: restricciones ("Hasta agotar existencias") |
| `status` | `draft \| published \| expired \| paused` |
| `moderationStatus` | Hereda la regla de confianza del creador (8.2) |

### 5.9 Entidad `ActivityReview` (`activities/{id}/reviews/{uid}`)

| Campo | Regla |
|---|---|
| `uid` | = id del documento; **una por persona** |
| `rating` | int 1–5, **obligatorio** |
| `title` | 0–80 |
| `body` | 0 o 10–1500 (si hay texto, mínimo 10); **sin URLs, correos ni teléfonos** (se rechazan) |
| `visitedAt` | mes/año (o fecha) ≤ hoy y ≥ hace 24 meses |
| `photos` | 0–3 |
| `video` | 0–1 (sin recorte de duración; tope de origen en 8.4) |
| `coverIndex` | foto usada como portada del "polaroid"; si no hay fotos, se usa la portada de la actividad con el avatar |
| `author` | `{ uid, displayName (primer nombre + inicial), photoURL }` — **snapshot**; el correo nunca se guarda en la reseña |
| `status` | `published \| flagged \| removed \| pendingMedia` |
| `flag` | `{ by, reason, note, at, resolution?: "upheld" \| "removed", resolvedAt?, resolvedBy? }` |
| `ownerReply` | `{ text ≤600, at }` (una respuesta; editable) |
| `createdAt`, `updatedAt`, `editedAt` | |
| `declarationVersion` | `LEGAL_VERSION` aceptada al reseñar |

### 5.10 Entidad `ActivitySanction` (`activitySanctions`)

`{ uid, role: "reviewer" | "host", kind: "warning" | "restriction" | "suspension", reason, activityId, reviewId?, createdAt, expiresAt, createdBy }`. Escalera por defecto en 8.6.

---

## 6. Estados y transiciones

### 6.1 Actividad

```
draft ──publicar──► [¿cuenta de confianza?]
                      ├─ sí ─► published + approved (visible)
                      └─ no ─► published + pending (solo la ve su creador y QHPA)
pending ──QHPA aprueba──► approved (visible; suma a approvedCount)
pending ──QHPA rechaza──► rejected (motivo; el creador puede corregir y reenviar)
approved ──creador pausa──► isActive=false (oculta, conserva URL y reseñas)
approved ──reporte válido / QHPA──► rejected o suspendida
```

- **Cuenta de confianza** (`trusted`): `approvedCount ≥ 3` ∧ sin sanciones vigentes ∧ no `suspendedUntil` activo. Constante `TRUST_MIN_APPROVED = 3` en dominio (un solo lugar, ajustable).
- **Ediciones de una actividad aprobada**: si la cuenta **no** es de confianza y cambia `title`, `description` o `media` ⇒ vuelve a `pending` (se oculta hasta revisar). Cambios de horario, precio, CTA, secciones **no** reabren revisión. (Por defecto; ver Q5.)
- Las actividades `pending`/`rejected`/`draft`/pausadas **no** aparecen en listados, buscador, sitemap ni home, **y no son accesibles por URL pública** (404): el creador las ve en una vista previa dentro de Studio.

### 6.2 Reseña

```
(nueva) ──publicar──► published
published ──dueño cuestiona──► flagged (visible, en rojo, "QHPA la está verificando")
flagged ──QHPA: real──► published + verified (se conserva; advertencia al dueño)
flagged ──QHPA: falsa──► removed (oculta al público; advertencia al autor)
published ──reporte de tercero / QHPA──► removed
```

Una reseña **cuestionada no se oculta** mientras se verifica. Detalle en 8.6.

---

## 7. Permisos (matriz)

Toda decisión de permisos se toma en el **servidor** con la identidad del token (nunca con datos del cliente) y reglas puras con tests.

| Acción | Visitante | Cuenta con sesión | Creador de la actividad | Dueño del sitio | QHPA admin |
|---|---|---|---|---|---|
| Ver actividad pública | Sí | Sí | Sí | Sí | Sí |
| Ver actividad pendiente | No | No | **Sí (vista previa)** | Si es suya | Sí |
| Crear actividad **global** | No | **Sí; pasa a `creator` al publicar la primera** (D1, D37) | — | — | Sí |
| Crear actividad **de sitio** | No | **Solo si `site.author.id === uid`** (D12; el autor de un sitio ya es `creator`) | — | Sí | Sí (en nombre del dueño) |
| Vincular una global a un sitio | No | Solo si es autor del sitio | — | Sí | Sí |
| Editar/pausar su actividad | No | No | Sí | Sí | Sí |
| Crear promoción | No | No | Sí (de su actividad) | Sí | Sí |
| Reseñar | No (pide Google) | **Sí**, salvo ser el creador, el dueño del sitio o estar sancionado | No | No (de sus actividades) | No |
| Marcar "Yo fui" | No | Sí | No | No | — |
| Responder una reseña | No | No | Sí (de su actividad) | Sí | Sí |
| Cuestionar una reseña | No | No | **Sí** (con motivo) | Sí | — |
| Resolver una reseña cuestionada | No | No | No | No | **Sí** |
| Reportar actividad/reseña | No | Sí (una por persona y objetivo) | — | — | — |
| Aprobar/rechazar actividad | No | No | No | No | **Sí** |

**Casos límite definidos:**
- **Cambio de autor del sitio** (reclamo aprobado): las actividades de ese sitio **pasan al nuevo autor** y el creador anterior recibe una notificación. El script de reclamos (`list-site-claims.ts --approve … --apply`) se amplía para hacerlo. Si no se amplía, la regla D12 se rompería silenciosamente.
- **Sitio despublicado o desactivado**: sus actividades de sitio se **ocultan** automáticamente (visibilidad derivada), sin borrarlas.
- **Sitio administrado por QHPA** (sin cuenta del dueño real): solo QHPA crea sus actividades; el `host` se muestra con el perfil `SiteOwner`.
- **Cuenta suspendida** (`suspendedUntil`): no crea ni edita; sus actividades existentes se pausan.

---

## 8. Módulos

### 8.1 `activity-core`

**Alcance:** modelo de 5, reglas puras, validación, repositorio, mapeadores.

**Requisitos**
1. Entidad, enums y constantes en `domain/entities/activities/` (con `value-objects/` como en sitios).
2. **Motor de recurrencia** puro (5.4): `occurrencesBetween`, `nextOccurrence`, `describeSchedule` (texto legible en español), `occursOn(date)`, `occursWeekdays`.
3. **Precio**: `priceFromCop`, banda de presupuesto, formato.
4. **CTA**: normalizador por tipo (WhatsApp colombiano, https), rechazo de esquemas peligrosos.
5. **Slug**: generación única y estable.
6. **Visibilidad pública**: función pura `isPubliclyVisible(activity, site?)`.
7. **DTO valibot** (`application/dto/activities/`), **mapeadores** y **repositorio** (`domain/repository/activities`, `infraestructure/firebase/repositories/activities`) registrados en `createServerContainer()`.
8. `searchTokens`: función pura que genera tokens normalizados (minúsculas, sin tildes, sin palabras vacías) de título, categoría, `tagline`, nombre del sitio.
9. `sections`: **reutilizar** el normalizador `SiteSections` y el componente `SectionsAccordion`; no duplicar.
10. Consultas **sin TableScan**: toda consulta de listado/home/hoy se apoya en un campo indexable (`moderationStatus+publicationStatus+isActive`, `category`, `occursWeekdays` con `array-contains`, `searchTokens` con `array-contains-any`) y se documentan los índices necesarios (creación de índices = "preguntar antes"). Memoria `firestore-enterprise-search`: solo índices tokenizados son baratos; substring/prefijo hacen TableScan.

**Criterios de aceptación**
- Pruebas del motor: semanal, cada 2 semanas (ancla y cruce de mes/año), mensual n-ésimo (incluye "último"), mensual por día (29–31), fechas sueltas, `skipDates`, vigencia, `always`, `byAppointment`, medianoche, Bogotá.
- Una actividad inválida no se construye (constructor) y el DTO devuelve mensajes claros en español (tú).
- `isPubliclyVisible` cubre los 6 casos de 6.1 y el del sitio despublicado.
- `pnpm test` y `pnpm typecheck` verdes.

### 8.2 `activity-publish`

**Alcance:** creación y edición en Studio, propiedad, moderación inicial, autoaprobación, antispam, notificaciones y administración por scripts.

**Requisitos**
1. **Ubicación de la UI**: gestión en `app/(studio)/studio/actividades` (lista propia, estado, acciones) y asistente de creación/edición paso a paso (móvil primero), **sin exigir** Premium ni `creatorVerified`, y la cuenta **pasa a `creator` automáticamente al publicar su primera actividad** (D37, mismo mecanismo que al crear un evento o un sitio; el plan lo localiza y lo reutiliza). El plan verifica `StudioGate` y que una cuenta `consumer` pueda llegar al asistente. Las cuentas administradoras de QHPA publican y **se autoaprueban**.
2. **Pasos del asistente**: (1) tipo (global/de sitio) y sitio si aplica; (2) qué es (título, categoría, descripción); (3) cuándo (reglas de recurrencia con vista previa del texto y de las próximas 5 fechas); (4) cuánto (opciones de precio, servicios incluidos, extras); (5) dónde (punto de encuentro/mapa para globales); (6) fotos/video; (7) cómo comprar/reservar (CTA); (8) secciones opcionales; (9) declaración y envío.
3. **Propiedad** (7): la acción de servidor comprueba `site.author.id === uid` (o admin) **antes** de aceptar `siteId`; cualquier otra cosa devuelve error genérico en español. Test dedicado de IDOR (otra cuenta intentando colgar actividad en un sitio ajeno).
4. **Registro de oferentes (Ley 1480 art. 53; D27)**: para publicar su **primera actividad** el anfitrión completa un formulario de identificación **obligatorio**: persona natural → **nombre completo, tipo y número de documento, dirección física, dirección electrónica y teléfono(s)**; persona jurídica/negocio → **razón social, NIT, dirección, correo y teléfono(s)** y el nombre del representante. Se guarda en una colección **privada** (`hostIdentities/{uid}`, solo Admin SDK), con fecha, `LEGAL_VERSION` y autorización de datos. Sin ese registro **no se puede publicar** (ni de global ni de sitio). Reglas: (a) **QHPA lleva el registro** y puede **exportarlo a la autoridad** que lo pida (script `scripts/export-host-identity.ts`, dry-run, con bitácora de quién lo exportó); (b) el **comprador puede consultarlo para presentar una queja**: en cada actividad hay un enlace "Datos de quien ofrece / Presentar una queja" que, con **sesión y límite de uso**, muestra los datos de identificación **necesarios para reclamar** y deja constancia de la consulta; no se publican abiertos en la página ni en el HTML indexable; (c) existe un **canal de quejas** (reutiliza los reportes/tickets) y quejas sobre una actividad se ven en la bitácora de QHPA; (d) los datos se **actualizan** cuando el anfitrión los cambie y se pide **reconfirmar cada 12 meses**. El plan define con el dueño el **nivel exacto de datos mostrados** al comprador (mínimo necesario para reclamar). Se recomienda revisión posterior de un abogado, **sin ser requisito de salida**.
5. **Declaración del creador** (patrón `AuthorDeclaration` + `contentDeclarations/activity_{id}`): derechos sobre fotos/textos, veracidad, permiso del sitio/comunidad, responsabilidad, mayoría de edad. Guarda `LEGAL_VERSION`.
6. **Moderación inicial y confianza** (6.1, D13): cola de `pending`; `activityAccounts/{uid}` mantiene `approvedCount`/`trusted`; transacción atómica al aprobar.
7. **Antispam** (extiende `spamGuard`): `SPAM_LIMITS` gana `activitiesPerDay` (3), `activitiesPendingMax` (3), cooldown 30 s, texto duplicado 7 días, antigüedad mínima de la cuenta 10 min. Un solo lugar para los números.
8. **Administración por scripts** (dry-run por defecto, `--apply` para aplicar): `scripts/list-activities.ts` (pendientes con título, creador, URL local, edad en horas; `--approve <id>`, `--reject <id> --reason "..."`).
9. **Alerta a QHPA**: cada actividad `pending` nueva emite un log estructurado (`alert=qhpa_new_activity`) y se agrega una política de Cloud Monitoring por log (como `setup-report-alert.sh`). No requiere Cloud Function nueva; **crear/ajustar la alerta es "preguntar antes"**.
10. **Notificaciones** (extiende `NOTIFICATION_TYPES`): `activity_moderation` (aprobada/rechazada con motivo), y las de 8.5/8.6. Texto corto, `href` interno.
11. **Cambio de autor del sitio**: ampliar el script de reclamos para transferir actividades (7).
12. **Cache**: `cacheTag("activity-list", "activity-<id>", "site-<id>-activities")` con `updateTag` al escribir; la lección de la memoria (cacheTag/updateTag cableado en sitios; `use cache` no persiste en Cloud Run serverless) aplica.

**Criterios de aceptación**
- Una cuenta `creator` crea una actividad global, queda `pending` y **no** aparece en listados, sitemap ni por URL pública; sí en su vista previa.
- Tras aprobar 3, una nueva queda aprobada sola; con una sanción vigente vuelve a revisión.
- Intento de vincular a un sitio ajeno falla en servidor (test + prueba manual).
- Exceder el tope de actividades pendientes muestra el mensaje de antispam.
- Script `list-activities.ts` en dry-run no modifica nada; con `--apply` aprueba/rechaza y notifica.

### 8.3 `activity-discovery`

**Alcance:** todo lo que el visitante ve y usa.

**Rutas públicas**
- `/actividades` — hub con filtros y listado (infinito, 12 por página, patrón `InfiniteExploreSearch`).
- `/actividades/[slug]` — detalle (URL propia, D11).
- Landings SEO por categoría/filtro: **top-level** `/actividades-{coleccion}-ibague` (misma razón que `/eventos-{coleccion}-ibague`: anidar choca con la ruta dinámica; ver 9).

**Detalle de actividad — contenido y orden (móvil primero)**
1. Galería/portada, título, gancho, categoría, chips ("Cada domingo", "Con almuerzo", "Gratis").
2. **Próxima salida** destacada: "Domingo 16 · 6:00 a. m." con "Mañana"/"En 3 días" cuando aplica. Debajo, el texto del horario completo.
3. **Precio**: `desde $X`, y debajo el desglose de `priceOptions` (con lo que incluye) y los `extras` ("con agua +$3.000").
4. **CTA principal** (botón de 5.6) y secundarias: "Cómo llegar" (solo si hay punto fijo; con `sharedAfterJoining` se muestra "El punto de encuentro se comparte en el grupo al unirte", y con `varies` "El punto cambia; se avisa antes de cada salida"), compartir.
5. Organiza: tarjeta de `host` (foto, nombre, vínculo al sitio si es de sitio).
6. Descripción corta + acordeón `sections` (Qué incluye / Qué llevar / Reglas).
7. Para de sitio: sitio (enlace), **promociones vigentes** (8.7) y los demás módulos de sitio.
8. **Historias / reseñas** (8.4) — en F1 el espacio muestra "Sé el primero en contar tu historia" desactivado hasta F3 (o no se muestra; ver Q6).
9. Actividades relacionadas (misma categoría/sitio, máx. 6).
10. Barra de acción fija en móvil con la CTA principal.

**Bloque "¿Qué se puede hacer aquí?" en la ficha del sitio** (`SiteDetailContainer`): tarjetas de las actividades públicas del sitio (máx. 6, "ver todas" lleva a `/actividades?sitio=<slug>`), con precio "desde", próxima salida y portada. Si el sitio no tiene actividades **no se renderiza**. Orden estable (no aleatorio) para el sitio.

**Home — "Actividades de hoy"**
- Conjunto de **8** (6 en móvil con carrusel) elegidas **al azar por día y deterministas** (semilla = día Bogotá), **todas por igual**, sin ranking (D14). Reutilizar `pickDiscoverIds(ids, limit, excludeIds, random)` con un generador con semilla (no `Math.random`).
- Regla de variedad: máximo 2 de un mismo sitio o anfitrión en el conjunto.
- Cache `use cache` con `cacheLife("hours")` y etiqueta `activity-list`; la clave incluye el día. **Prohibido** aleatorio por visita: rompería la caché y el costo (la memoria `cache-strategy-app-hosting` lo desaconseja).
- Enlaces: "Ver todas las actividades" → `/actividades`.

**Búsqueda**
- Integrar en `ExploreSearchBar`/`HomeSearchBar` y en `/explorar` (filtro `content=activities` además de `events`/`sites`, como `onlyEvents`/`onlySites`). Usa `searchTokens` (`array-contains-any`), no substring.
- Resultados mezclados por tipo con etiqueta visible ("Actividad").

**Filtros del hub y del buscador** (en la URL, compartibles):
- **Cuándo**: `hoy`, `este-fin-de-semana`, `esta-semana`, **día de la semana**.
- **Presupuesto**: `gratis`, `hasta-20000`, `hasta-50000`, `hasta-100000`.
- **Con quién**: `solo`, `pareja`, `familia`, `amigos`, `ninos`, `mascotas`.
- **Categoría** y **tipo** (global/de sitio), **dificultad** (aire libre).
- Orden por defecto: **próxima salida más cercana**; sin ranking de popularidad.
- Los filtros "hoy/fin de semana" se apoyan en `occursWeekdays` (consulta) + filtro en memoria con `occurrencesBetween` sobre el resultado paginado; **sin TableScan**.

**Compartir**: botón de compartir (Web Share API con respaldo a copiar enlace); enlace contado cuando exista `activity-insights`.

**Criterios de aceptación**
- Detalle sin errores de consola a 320/390/768/1024/1440 px; actividad de sitio muestra el bloque de sitio y el sitio muestra la actividad.
- `/actividades?cuando=hoy` devuelve solo lo que ocurre hoy (Bogotá), probado con fechas simuladas (domingo 6 a. m. aparece el domingo, no el lunes).
- Home: dos cargas el mismo día muestran el mismo conjunto; al día siguiente, otro. Ningún sitio/anfitrión aparece más de 2 veces.
- Con 0 actividades públicas, ni el home ni el hub ni la ficha de sitio muestran bloques vacíos.
- Buscar "senderismo" encuentra la actividad por token sin `TableScan` (verificado con el plan de consulta o el log).
- Respeta el aviso de la memoria `cachecomponents-notfound-e22`: **no** usar `generateStaticParams` con `notFound()` en el shell; `params` dentro de `Suspense`. Y `nav-stale-content-cachednavigations`: no reactivar `cachedNavigations`.

### 8.4 `activity-reviews` ("Historias" de la gente)

**Alcance:** reseñas con Google, "Yo fui", agregados y diseño. Depende de `legal-privacy` **ya cerrado**.

**Flujo de la reseña (objetivo: < 1 minuto)**
1. En la actividad: "Cuenta tu historia". Sin sesión → botón **"Continuar con Google"** (reutiliza `GoogleAuthButton` y el redirect `/login?redirect_to=…`); al volver se reabre el formulario (`?resena=1`). La cuenta nueva **no se crea** hasta aceptar términos (regla existente).
2. Formulario: estrellas (obligatorio), título y texto (opcionales), fecha de la visita, fotos (hasta 3) y video (hasta 1), checkbox de **declaración** ("viví esta experiencia, mi opinión es honesta y no tengo vínculo comercial con la actividad").
3. Se publica de inmediato (`published`); los medios pasan por el pipeline (`pendingMedia` → `published` cuando están listos; la reseña con texto aparece ya, los medios al terminar).

**Reglas**
- **Una reseña por persona y actividad** (id del documento = uid). Editable y borrable por su autor; mientras esté `flagged`, **no se edita ni se borra** (evita huir de la verificación).
- El **creador y el dueño del sitio no pueden reseñar** su actividad. Cuentas sancionadas con restricción de reseñas, tampoco.
- Texto sin URLs, correos ni teléfonos (rechazo con mensaje). Sin HTML.
- Antispam (`SPAM_LIMITS`): cooldown 30 s, máx. 10 reseñas/día, texto duplicado 7 días, antigüedad mínima de la cuenta 10 min.
- **Privacidad**: se muestra **primer nombre + inicial del apellido** y foto de Google (si no quiere foto, avatar neutro). Nunca correo ni uid completo en el HTML.
- **Medios**: tipos y tamaños validados en servidor (imágenes ≤10 MB de origen, procesadas; **video de origen** mp4/mov/webm/3gp ≤200 MB —el mismo tope que ya usa el procesador existente— y **duración máxima de origen 3 min** como freno de abuso, **sin recortar** lo que cabe dentro del tope; sin metadatos GPS en lo servido). Subida por URL firmada con prefijo propio de actividades (ver 8.4, ruta de almacenamiento). El original se **borra** al terminar el procesamiento, para no acumular almacenamiento.
- **Video: se baja un poco la calidad, no se corta (D28)**: encendido por defecto, con **interruptor de emergencia** (`activities.reviewVideoEnabled`). El procesamiento **ya existe** en el repo hermano **`../functions`** (Cloud Functions fuera de este proyecto): el trigger de Storage `onObjectFinalizedOptimizeVideos` con `processVideo` (H.264/`libx264`, escala máx. 1280 px, `crf` 26/28, AAC 128 k, `-movflags +faststart`, `ffmpeg-static`, 2 GiB de memoria, 540 s) y `extractThumbnail` para el poster. Hoy ese trigger solo atiende `public/events/{id}/videos/`; el trabajo es **ampliar la configuración de carpetas** (el `README` de `src/triggers/storage` ya describe `OPTIMIZABLE_FOLDERS` para agregar tipos) a `public/activities/{id}/videos/` y `public/activities/{id}/reviews/{uid}/videos/`, y escribir el resultado en la reseña/actividad (equivalente a `patchEventMedia`). **Streaming**: se sirve MP4 con `faststart` por la URL de Storage con soporte de rangos (el navegador empieza a reproducir sin bajar todo); **no se construye HLS** (más caro y complejo sin necesidad hoy). Reproducción **bajo demanda** (sin autoplay, `preload="none"`, poster visible). Estado `pendingMedia` mientras procesa y degradado seguro si falla (la reseña con texto se publica igual). **Es un cambio en el repo `functions` (otro repo, despliegue y rama propios): "preguntar antes" y se empuja la rama de functions junto al despliegue** (memoria `feedback-push-functions-branch-on-deploy`). Pendiente de verificar en el plan: la carpeta exacta que escucha el trigger (el `README` dice `events` y `sites`; el código revisado filtra `events`) y costo por minuto de procesamiento.

**"Yo fui"** (un toque, sin escribir): crea `visits/{uid}`, incrementa `analytics.visits`; "N personas fueron" se muestra **desde 10** (misma regla que "N van"). Reseñar marca "Yo fui" automáticamente.

**Agregados**: `rating {count, sum, avg, dist[5]}` actualizado en **transacción** al crear/editar/borrar/quitar; reseñas `flagged` **cuentan** hasta que se resuelvan; `removed` descuenta.

**Respuesta del dueño**: una por reseña, ≤600, editable; se muestra bajo la reseña con la etiqueta "Respuesta de quien organiza".

**Diseño (F3): "polaroid" + historia abierta** (el libro que se voltea es F5)
- **Encabezado**: promedio con estrellas, número de historias, distribución 5→1, "N personas fueron".
- **Tarjetas tipo polaroid** (carrusel horizontal en móvil, rejilla en escritorio): foto de portada de la reseña (o portada de la actividad si no hay fotos), debajo **fecha y nombre**, estrellas.
- **Al tocar** una tarjeta: se abre la historia completa (drawer en móvil, diálogo en escritorio, patrón del repo): fotos con carrusel, video, estrellas, "Visitó en septiembre de 2026", texto, respuesta del dueño, botón **Reportar**, y **Compartir** como tarjeta imagen (D15).
- **Filtros** simples: "Con fotos", por estrellas, más recientes. Sin votos de utilidad en esta spec.
- **Estado vacío**: "Sé el primero en contar tu historia" con la CTA de Google.
- **Cold start** (decisión de diseño): la actividad **no promete** reseñas que no hay; nada de reseñas falsas ni "sembradas". Las primeras las aportan el dueño del contenido real y la comunidad (invitar a quienes ya fueron, con el kit de compartir).

**Criterios de aceptación**
- Sin sesión, "Cuenta tu historia" lleva a Google y vuelve con el formulario abierto.
- Segunda reseña del mismo usuario a la misma actividad: se **edita la existente**, no se duplica (probado a nivel de servicio con carrera simulada).
- El creador/dueño intentando reseñar su propia actividad recibe error de servidor.
- Una reseña con URL/teléfono se rechaza.
- Agregados correctos tras crear, editar a otra nota, borrar y remover (tests de cálculo).
- Fotos > 3, video > 1, tipo no permitido o tamaño excedido se rechazan en servidor.
- La UI cumple 13 (accesibilidad): estrellas navegables por teclado, foco atrapado en el diálogo, sin depender solo del color.

### 8.5 `legal-privacy` (cierre antes de `activity-reviews`)

**Requisitos (los redacta el asistente como borrador; **un abogado debe revisarlos**; no es asesoría legal)**
1. **Términos**: reglas de reseñas (honestidad, sin conflicto de interés, sin incentivos a cambio de reseñas positivas, sin datos personales de terceros, sin contenido ilegal), **licencia** no exclusiva para mostrar los textos/fotos/videos, reglas del botón "cuestionar" y sanciones, responsabilidad de cada autor, aviso y retiro, y que QHPA **no verifica** que quien reseñó haya asistido.
2. **Privacidad**: datos de quien reseña (nombre, foto de Google, uid), **finalidad** y **publicidad** de ese nombre en la reseña, conservación, derechos de supresión/rectificación (Ley 1581 de 2012; consultas 10 días hábiles, reclamos 15), canal de contacto, transmisión a Google.
3. **Autorización de datos** separada de los términos (como ya se hace en el registro).
3b. **Consentimiento de correo y push (D43)**: casillas **separadas** y con fecha para recibir avisos por correo y por push; texto que explica qué se envía, cada cuánto y cómo darse de baja; **transmisión internacional** a Resend (y a Firebase para push) en la política de privacidad.
4. **Declaración** del reseñador (casilla) y del creador de actividad; evidencia en `contentDeclarations`.
5. **Retención y supresión**: al eliminarse una cuenta, sus reseñas pasan a "Usuario eliminado" (sin foto) o se borran a solicitud; procedimiento y script documentados.
6. **`LEGAL_VERSION`**: subirla cuando cambien los textos (**decisión del dueño**, "preguntar antes").
7. **Ley 1480 art. 53 (D27)**: se **cumple la norma** con el registro de oferentes de 8.2 punto 4 (identificación obligatoria, registro, consulta para quejas, entrega a la autoridad). Eso reemplaza el "riesgo asumido" de `docs/14`; actualizar ese documento. Revisión de un abogado: **recomendada después**, no bloquea.

**Criterios de aceptación**
- Texto de términos/privacidad actualizado y aprobado por el dueño; `LEGAL_VERSION` cambiada con su OK.
- El formulario de reseña guarda `declarationVersion`.
- Existe el procedimiento (documento + script) para suprimir las reseñas de una cuenta.

### 8.6 `review-moderation`

**Alcance:** cuestionar, verificar, sancionar, reportar.

**El dueño cuestiona una reseña**
- Disponible para el creador de la actividad y el dueño del sitio. Requiere **motivo** de una lista cerrada y una nota (≥20, ≤300):
  - "No fue cliente / no vino ese día"
  - "Información falsa"
  - "Lenguaje ofensivo o ataques personales"
  - "Datos personales"
  - "Spam o publicidad"
  - "Conflicto de interés (competencia)"
  - "Otro"
- Frenos: máx. 5 cuestionamientos **abiertos** por cuenta; máx. 3 por actividad al mismo tiempo; cooldown 30 s; **no** se puede cuestionar dos veces la misma reseña.
- Efecto: `status = "flagged"`, **sigue visible**.

**Cómo se ve (diseño psicológico, D8)**
- Tarjeta con **borde y fondo rojo suave** (tokens definidos del sistema; **no** usar `brand-violet`, que no existe como token), icono de escudo y chip **"En verificación"**.
- Texto, **neutro y sin acusar a nadie** (para no generar desconfianza hacia la actividad ni hacia quien reseñó): "Quien organiza pidió revisar esta reseña. **QHPA la está verificando.**" **No se muestra el motivo ni la nota del dueño** (Q8): se resuelve primero, se explica después a las partes por notificación.
- El estado **no depende solo del color** (icono + texto), contraste AA.
- Al resolverse como **real**: chip verde sutil "**Verificada por QHPA**"; el rojo desaparece.
- Al resolverse como **falsa**: se oculta al público; el autor recibe la explicación y las consecuencias.

**QHPA resuelve** (script `scripts/list-activity-flags.ts`, dry-run por defecto, ordenado por antigüedad; alerta por log `alert=qhpa_new_flag`)
- **Reseña real** (`upheld`): se conserva y se verifica; **advertencia al dueño** (`role: host`, `kind: warning`) por intentar ocultar una opinión válida (si el cuestionamiento fue claramente abusivo).
- **Reseña falsa** (`removed`): se quita; **advertencia a quien la escribió** (`role: reviewer`).
- Notificación a ambas partes (`review_flag_resolved`).
- No hay respuesta automática si QHPA no resuelve: la reseña **sigue** "En verificación". Meta operativa interna: resolver en ≤72 h (no se promete públicamente).

**Escalera de sanciones (por defecto; los números se ajustan en un solo lugar y requieren OK del dueño, Q7)**

| Rol | 1.ª vez | 2.ª vez (12 meses) | 3.ª vez (12 meses) |
|---|---|---|---|
| **Reseñador** (reseña falsa) | Advertencia (notificación) | **Restricción de reseñar 30 días** | Suspensión de reseñar y de crear actividades (decisión manual de QHPA) |
| **Anfitrión/dueño** (abuso del botón) | Advertencia | **Pierde el botón "cuestionar" 90 días** | Actividad suspendida (decisión manual) |

- Las sanciones tienen `expiresAt` (12 meses para contar reincidencia).
- Las sanciones del anfitrión **afectan su confianza** (`trusted`): con una sanción vigente sus actividades nuevas vuelven a revisión.

**Apelaciones (Q12)**
- Quien tuvo una reseña **removida** (o una restricción) puede **apelar una sola vez** desde la notificación, con una explicación (≥30 caracteres) y **pruebas** opcionales (por ejemplo, un comprobante de asistencia). Se usa el canal de soporte que ya existe en Studio (tickets) si el plan confirma que sirve; si no, un formulario mínimo.
- QHPA decide según la **gravedad**: una apelación **sin fundamentos** se cierra sin más trámite; una **con fundamentos** se revisa y, si procede, se restituye la reseña y se retira la sanción.
- El anfitrión **no** apela una reseña verificada como real: el botón "cuestionar" es de una vez por reseña.

**Reportes de terceros**
- `Report` se amplía con `targetType: "activity" | "review"` y motivos propios (contenido inapropiado, spam, fraude, datos personales, derechos de autor, falsa). Un reporte por persona y objetivo (ya existe `reportId`). Los reportes de reseñas llegan a `scripts/list-reports.ts`.
- Aviso por log (`alert=qhpa_new_report`) como hoy; si hay más de N reportes distintos sobre un mismo objetivo en 24 h, **se oculta preventivamente** y se manda a revisión (N por defecto 3; Q7).

**Criterios de aceptación**
- Cuestionar una reseña la deja visible, en rojo, con la leyenda; la lista de QHPA la muestra.
- Resolver "real" y "falsa" produce las notificaciones y sanciones esperadas y actualiza los agregados.
- Un dueño sin permiso (sancionado) no puede cuestionar; un tercero no puede cuestionar.
- No se puede editar ni borrar una reseña `flagged`.
- El estado rojo pasa auditoría de contraste y no depende solo del color.

### 8.7 `site-offerings`

**Alcance:** solo actividades `site`. Aparecen únicamente con un sitio vinculado (D3).

**Bloques**
1. **Menú/productos** (`offerings`, máx. 30 en un arreglo dentro de la actividad): `{ name ≤60, description ≤200, priceCop, imagen?, available }`, agrupables por título de sección. Sirve para "comprar": se ve el menú o la tienda de plantas; el botón es la CTA externa (5.6). **No hay carrito ni pagos.**
2. **Espacios reservables** (`spaces`, máx. 10): `{ name, capacity, priceCop, unit, description, imagen?, rules }`; botón de reservar por CTA externa. Ejemplo: sala del club de lectura.
3. **Promociones** (`activityPromotions`, 5.8): "tardes felices", "Black Sunday". **Bloque aparte** en la actividad **y** en la ficha del sitio, con la regla de vigencia y el horario; filtro público "Promos hoy" (alimenta "Hoy en Ibagué").
4. **Cartelera de cine** (películas con horarios y reseñas por película): **F5**, fuera de F4. **Sin API (Q14)**: no encontré ninguna API pública ni datos abiertos de las cadenas (Cine Colombia, Cinemark, Royal Films, Cinépolis, Procinal); solo agregadores web (miCiudad.co, Colombia.com, lacartelera.co), cuyo uso automatizado (scraping) es frágil y probablemente viole sus términos. **TMDB** sirve para sinopsis y afiches pero su licencia **prohíbe uso comercial sin acuerdo escrito** y no incluye funciones por cine. Por eso la cartelera se **carga a mano** (el dueño del cine o QHPA, semanal, con fecha de verificación visible) o se enlaza a la página oficial del cine. Si un cine de Ibagué acepta un convenio de datos, se evalúa después. Hasta F5, el cine es una actividad "Ir al cine" del sitio con un acordeón `sections` de cartelera.

**Reglas**
- Una promoción **caduca sola** (`validUntil`); el barrido horario existente (`recompute-expired`) la marca `expired`. **Nunca** se muestra una promo vencida.
- Una promo solo la crea el creador de la actividad (o dueño del sitio/QHPA).
- Los precios del menú son **informativos**; el aviso "Precios sujetos a cambio, confirma con el lugar" es obligatorio.

**Criterios de aceptación**
- Una actividad global **no** ofrece menú, espacios ni promociones en el editor ni en la API.
- Una promo vencida desaparece de actividad, sitio y filtros sin intervención.
- La ficha del sitio muestra las promos vigentes con su horario legible.

### 8.8 `activity-insights`

**Alcance:** medir y compartir con el patrón de `analytics-v2` (no reinventar).

**Requisitos**
1. **Vistas y acciones**: reutilizar `POST /api/.../track` (`beaconGuard`, `ipRateLimit`, dedupe diario) con tipos `view`, `directions`, `cta`, `share`, `visit`; contadores diarios en `activities/{id}/stats/{día}` y `analytics.*` en el documento. Mismo presupuesto de escrituras que `analytics-v2`.
2. **Enlaces cortos y QR** `/r/…` y kit de compartir (modal, afiche, mensaje de WhatsApp) para actividades, como en eventos y sitios.
3. **Panel para el creador** (en Studio, "Visitas y enlaces"): vistas, clics, "Yo fui", reseñas, origen por canal.
4. **Sin ranking por analítica** en el home ni en el hub (decisión D14). Los contadores solo informan al creador. Si más adelante se quisiera ordenar por acciones, es otra decisión (`ranking-v2`).
5. Cuenta de privacidad: **ningún** dato personal en los contadores (igual que `measure`).

**Criterios de aceptación**
- Una visita anónima suma una vista (dedupe diario) y un clic en WhatsApp suma 1 acción.
- El panel muestra los números del creador; el home sigue sin usarlos.
- Medición conforme al presupuesto de escrituras de `analytics-v2`.

### 8.9 `activity-commerce` (FUTURO — no se construye en esta spec)

**Por qué existe aquí:** para que nada de lo que se haga ahora **bloquee** el cobro con comisión después, sin construirlo ni tocar dinero.

**Contexto investigado (2026-11-10, fuentes oficiales y de terceros; **sin verificar tarifas ni persona natural en ePayco**):**
- **Wompi no ofrece split nativo** (artículo de soporte; el reglamento 2026 solo menciona dispersión con Bre-B vía "Factoring Inverso"). Su API de **Pagos a Terceros** reparte *después* de cobrar y la plata pasa por QHPA (intermediación, impuestos, devoluciones a cargo de QHPA).
- **Mercado Pago (Split Payments / `marketplace_fee`)**: el vendedor conecta su cuenta por OAuth, el cobro se parte en la pasarela, los reembolsos se reparten proporcionalmente, y la página de alta del vendedor muestra **cuenta personal con cédula** (persona natural) o empresa con NIT. Credenciales del vendedor duran 6 meses (refresh). Candidato recomendado.
- **ePayco (Pagos divididos)**: split nativo, pero solo cuentas "agregador" activadas por ticket; **persona natural receptora: no confirmado**.
- Con tickets pequeños (ej. $20.000) las tarifas fijas se comen gran parte del 10%: habrá **venta mínima o comisión escalonada**.

**Qué deja preparado esta spec (y nada más):** el campo `cta.kind` admite un valor futuro `"checkout"` sin migración; los `offerings` y `spaces` ya tienen precio en COP; **ningún módulo guarda ni mueve dinero**. Tarea posterior (D39, **ya lanzada como investigación sin código**, resultado en `docs/32-investigacion-split-mercado-pago.md`): agente de investigación en segundo plano (documentación oficial, requisitos de persona natural, tarifas, tratamiento tributario) y decisión con contador **antes** de escribir código.

---

## 9. SEO

Objetivo: que quien busque **"cosas para hacer en Ibagué"** (y variantes) llegue a QHPA, y que cada actividad tenga una página que responda su consulta mejor que un listado.

### 9.1 Páginas y URLs

| Página | URL | Contenido |
|---|---|---|
| **Pilar** | `/cosas-para-hacer-en-ibague` | Hub editorial que une **eventos de hoy + sitios + actividades** con enlaces a todo lo demás (la promesa "contra el aburrimiento") |
| Hub de actividades | `/actividades` | Listado y filtros |
| Detalle | `/actividades/[slug]` | Página propia de cada actividad |
| Landings por categoría | `/actividades-{categoria}-ibague` (ej. `/actividades-aire-libre-ibague`, `/actividades-en-familia-ibague`, `/actividades-gratis-ibague`) | Texto introductorio propio + listado; **top-level** por la colisión con rutas dinámicas |
| Landings de filtro | `/actividades-hoy-ibague`, `/actividades-este-fin-de-semana-ibague`, `/actividades-con-ninos-ibague`, `/actividades-con-mascotas-ibague` | Idem, con vigencia dinámica |

- **Regla de fundamento (Q15): no se crean páginas por crear.** Una landing solo existe si cumple las **tres**: (a) responde una **intención de búsqueda distinta** a las demás (no es una variante casi idéntica), (b) tiene un **texto introductorio propio y útil** (no una plantilla con el nombre cambiado) y (c) tiene **≥3 actividades públicas** reales; si falla alguna, `noindex` y no entra al sitemap. **Lanzamiento inicial acotado**: pilar + hub + `hoy` + `este-fin-de-semana` + `gratis` + las 3 categorías con más contenido. El resto se activa cuando haya contenido que las justifique.
- **Por qué el pilar sí tiene fundamento**: es la única página que une **eventos + sitios + actividades** y apunta al término principal "cosas para hacer en Ibagué"; ninguna de las otras páginas lo cubre.
- Las landings se registran como colecciones en el mismo mecanismo que usa `(landings)/[coleccion]` (ver `siteCollections`/`eventCollections`); el plan verificará cómo extenderlo.

### 9.2 Metadatos
- `title` con patrón `"{Actividad} en Ibagué — {cuándo/precio} | Que Hay Pa Hacer?"` (≤60), `description` ≤155 con precio "desde" y recurrencia, `canonical` propio, `alternates`.
- **Open Graph**: imagen JPEG `/og/actividad/[slug]` (la memoria `apphosting-useragent-is-google` exige OG en `<head>` y JPEG; el User-Agent siempre llega "Google": no se detectan bots por UA).
- `robots`: público solo lo visible (6.1); lo demás 404, sin `noindex` por contenido parcial.

### 9.3 Datos estructurados (JSON-LD)
- Detalle: `Service` (o `TouristAttraction` para aire libre) con `provider`, `areaServed` Ibagué, `offers` (de `priceOptions`) y, **solo con ≥5 reseñas publicadas**, `AggregateRating`. **Riesgo**: las políticas de Google sobre reseñas de entidades y rich results pueden no mostrar estrellas; se valida con la **Prueba de resultados enriquecidos** y no se promete la estrella en el SERP.
- Landings/hub/pilar: `ItemList` y `BreadcrumbList`.
- Sin datos falsos: cada propiedad sale del dato real.

### 9.4 Sitemap y enlazado
- `app/sitemap.ts`: añadir detalle de actividades, landings y pilar, con `lastModified` real; etiqueta de caché `sitemap` ya existente + `activity-list`.
- Enlazado interno: ficha de sitio ↔ actividades, actividad ↔ relacionadas, home → hub/pilar/landings, migas de pan.
- **Reseñas como contenido indexable**: texto en el HTML (no solo cargado por JS); **sin enlaces** dentro de las reseñas; si algún enlace llegara a existir, `rel="ugc nofollow"`.
- Contenido cerrado del acordeón sigue en el HTML (Radix lo renderiza `hidden`), como en sitios.

### 9.5 Anti-spam de SEO (por qué D13)
Cada actividad aprobada es una **página pública que Google indexa**. Sin revisión inicial alguien podría llenar el sitio de páginas basura (publicidad, enlaces, contenido copiado) y dañar la reputación del dominio. Por eso: `pending` no se indexa; la autoaprobación es solo por historial limpio; se prohíben URLs en descripciones (solo la CTA); duplicados y volumen se frenan (`spamGuard`).

**Criterios de aceptación**
- Pilar, hub, ≥3 landings y detalle responden 200 con `title`/`description`/`canonical` correctos y pasan la Prueba de resultados enriquecidos sin errores críticos.
- El sitemap incluye solo URLs públicas y lo nuevo aparece sin intervención.
- Una actividad `pending` no existe para Google (404 público, ausente del sitemap).

---

## 10. UI y diseño (contrato)

Skills que se aplican al construir: `frontend-ui-engineering`, `ui-design`, `web-design-guidelines`, `frontend-design`, más `next-best-practices`/`cache-components`. Antes de diseñar se revisa `DESING.md` y los tokens existentes (cuidado con tokens no definidos).

**Principios**
- **Móvil primero** (público mayoritario), verificar a 320, 390, 768, 1024, 1440 px.
- La acción primaria de la actividad es **una** (la CTA); lo demás es secundario.
- Información en superficie, sin cajas dentro de cajas (como `SPEC-site-sections.md`); tarjetas solo donde son el objeto (tarjeta de actividad, polaroid).
- "Próxima salida" y "desde $X" son lo más visible después del título.
- Rechazar: gradientes decorativos, iconos de relleno, numeraciones sin sentido, carruseles automáticos que se mueven solos.
- **Estados** de todo componente: cargando (esqueleto), vacío, error, éxito, deshabilitado, sin conexión (PWA).
- Movimiento 150–250 ms con `prefers-reduced-motion`.
- Patrón de móvil/escritorio del repo: **drawer en móvil, diálogo en escritorio**.

**Componentes principales (nombres propuestos)**
`ActivityCard`, `ActivityDetail`, `NextOccurrence`, `PriceBreakdown`, `ScheduleText`, `ActivityFilters`, `ActivityHomeBlock`, `SiteActivitiesBlock`, `ActivityWizard` (pasos), `ScheduleBuilder`, `PriceBuilder`, `ReviewSummary`, `ReviewPolaroid`, `ReviewStoryDialog`, `ReviewForm`, `FlaggedReviewBanner`, `PromotionCard`, `OfferingsList`, `SpacesList`.

**Copy**: español de Colombia, tú; mensajes de error claros y accionables; sin voseo.

---

## 11. Notificaciones

Se extiende `NOTIFICATION_TYPES` (sin cambiar el mecanismo ni el TTL de 90 días):

| Tipo | Destinatario | Cuándo |
|---|---|---|
| `activity_moderation` | Creador | Aprobada/rechazada (con motivo) |
| `activity_transferred` | Creador anterior | Cambio de autor del sitio |
| `review_received` | Creador y dueño de sitio | Reseña nueva en su actividad |
| `review_flag_resolved` | Dueño y autor | Resolución de una reseña cuestionada |
| `activity_sanction` | Sancionado | Advertencia/restricción/suspensión |
| `promo_expiring` *(opcional, F4)* | Creador | Promoción por vencer |
| `activity_reminder` | Inscritos y guardados | "Mañana sale…" |
| `activity_last_spot` | Guardados e inscritos | Último cupo o cupo liberado |
| `activity_digest_new` | Quien guardó categorías afines | Planes nuevos que coinciden con lo que le gusta |
| `join_received` | Creador | Alguien se inscribió a su actividad |

Las notificaciones **de la campanita** se escriben desde el **servicio de servidor** (no desde una Cloud Function nueva); el **correo** y el **push** (26.2b) salen por una cola con permiso y tope diario, y cada aviso respeta las preferencias por canal. `sanitizeNotification` ya recorta texto y descarta enlaces externos.

---

## 12. Costos y rendimiento (el dueño teme los costos de nube: cifras antes de construir)

> Las magnitudes de dinero son **estimaciones** a verificar con el plan y con la factura real (Firestore Enterprise, Cloud Storage y CDN de App Hosting tienen precios que cambian). Lo verificable hoy son los conteos de operaciones.

### 12.1 Operaciones por acción

| Acción | Lecturas | Escrituras |
|---|---|---|
| Ver detalle (caché caliente) | 0 (servido por caché `use cache`) | 0 (más la vista medida en `insights`: 1–2) |
| Ver detalle (caché fría) | ~4 (actividad, sitio, promos, 6 reseñas) | 0 |
| Home (bloque diario) | 1 consulta por día/instancia (cacheada) | 0 |
| Crear reseña | ~3 (validar, `visits`, actividad) | ~3 (reseña, `visits`, agregados en transacción) |
| Cuestionar reseña | ~2 | ~2 (reseña, cuenta del dueño) |
| Crear actividad | ~3 | ~3 (actividad, `activityAccounts`, declaración) |

### 12.2 Almacenamiento (peor caso por reseña)
- 3 fotos procesadas (~0,4 MB cada una) + 1 video recomprimido (**pocos MB**, hasta decenas de MB en videos largos) por reseña; el original de hasta 200 MB se borra tras procesar, pero **existe unos minutos** y se factura el cómputo. A tarifas típicas de almacenamiento estándar (del orden de centavos de dólar por GB-mes) el **almacenamiento** es bajo, pero **la salida de red (egreso) del video es lo caro** si se reproduce mucho.
- Por eso (D28): el video **se recomprime** (máx. 1280 px, `crf` 26/28) y se **borra el original**; no se recorta. Un video de unos 60 MB suele quedar en **pocos MB** (estimación a verificar con las medidas reales). Reproducción **bajo demanda** (sin autoplay, `preload="none"`, poster). El costo se reparte en **cómputo del procesamiento** (la función usa 2 GiB y 2 CPU, hasta 540 s por video) y **salida de red** al reproducir. El peor caso se **calcula con precios vigentes antes de construir**, y el interruptor `reviewVideoEnabled` permite apagarlo.
- No hay detección automática de contenido inapropiado en v1 (Cloud Vision SafeSearch tendría costo; queda como mejora): la defensa es la declaración, el reporte y la revisión.

### 12.2b Costo de los canales de aviso (D43)
- **Correo (Resend):** plan gratis ≈3.000 al mes y tope ≈100 al día, 1 dominio (**verificar en su página**). Con la cola con tope diario el costo es **cero** mientras se respete; al llegar al 80% se decide pasar a pago o a otro proveedor (Brevo gratis ≈300 al día). El peor caso se **limita por configuración** (`EMAIL_DAILY_CAP`), no puede dispararse.
- **Push web (FCM):** gratis; el costo real es de **almacenamiento y escrituras** de tokens y del barrido (despreciable con pocos usuarios). Verificar la cuota vigente en la documentación oficial.
- **Canal de WhatsApp:** gratis.
- **Escrituras de la cola y de las preferencias:** 1–2 por aviso enviado; entran en el presupuesto del plan.

### 12.3 Rendimiento (metas)
- LCP < 2,5 s en 4G, CLS < 0,1 en detalle y hub; imágenes con `sizes` y calidad `[75, 90]`; reseñas y mapas **diferidos** (cargan al acercarse); paginación de 12; sin consultas sin índice.
- El home no añade peticiones bloqueantes: el bloque va en `Suspense` con esqueleto.
- Presupuesto de escrituras de medición: igual que `analytics-v2`.

---

## 13. Accesibilidad (mínimo obligatorio)

- WCAG 2.1 AA: contraste, foco visible, orden lógico, objetivos táctiles ≥44 px.
- **Estrellas** como grupo de opciones (`radiogroup`) navegable por teclado; la nota en texto ("4 de 5") para lectores.
- Diálogos/drawers con **foco atrapado**, cierre con Esc y retorno del foco.
- **Estado "En verificación"**: icono + texto + color (no solo color).
- Carruseles con controles accesibles y sin movimiento automático; `prefers-reduced-motion` respetado.
- Formularios con etiquetas, errores asociados (`aria-describedby`) y mensajes claros.
- Idioma de página `es-CO`.

---

## 14. Seguridad y abuso

**Siempre**
- Identidad solo desde el **token** en el servidor; nada de `uid`/`ownerUid`/`host` que venga del cliente.
- Validación valibot en cada acción y **escapado en salida**: texto plano, sin HTML. Sin `dangerouslySetInnerHTML` con contenido de usuarios.
- Autorización **por recurso** (anti-IDOR): editar, pausar, responder y cuestionar comprueban que el recurso es del `uid` de sesión.
- CTA con **allowlist de esquema** (https/wa.me); sin redirecciones abiertas (el enlace contado `/r/…` valida el destino contra el registro, como ya hace `short-links`).
- Rate limits y frenos (`spamGuard`, `createIpLimiter`, `createGlobalLimiter`); límites de tamaño de cuerpo (`readBoundedJson`).
- Subidas por URL firmada con tipo y tamaño forzados y prefijo por recurso; no se confía en el nombre del archivo.
- Colecciones nuevas **solo por Admin SDK**; reglas por defecto en `deny` (como `firebase/firestore.rules` propuesto).
- Nada de secretos en el repo ni en logs; solo **nombres** de variables.
- Registro de auditoría de decisiones de moderación (`reviewedBy`, `resolvedBy`, fechas).

**Riesgos conocidos y mitigación**
- **Reseñas falsas del propio dueño o de la competencia**: una por cuenta, antigüedad mínima de cuenta, bloqueo del autor, declaración, reporte, sanción. No es infalible (cuentas múltiples): se documenta como límite honesto.
- **Ataque de "cuestionar todo"** por el dueño: topes, motivo obligatorio, sanción por abuso, reseña visible mientras se verifica.
- **Dato personal en reseñas** (teléfonos, correos): rechazo por patrón + reporte.
- **XSS** vía texto/CTA/`alt`: texto plano + allowlist.
- **Enumeración de actividades pendientes**: 404 público (no 403).
- **Abuso de subidas** (almacenamiento): topes por reseña/por día; video apagado hasta decidir.
- **IP falsificable** en frenos por IP (hallazgo de `analytics-v2`): los frenos principales son **por cuenta** (uid), la IP es un freno secundario.

Se corre la skill `security-and-hardening` y una revisión del `security-auditor` **antes de abrir F3** (reseñas con medios) y antes de abrir la creación pública.

---

## 15. Medición del éxito del módulo (sin ranking)

- Número de actividades públicas, creadas por cuentas de confianza vs revisadas, tiempo de aprobación, tasa de rechazo.
- Reseñas por actividad, tasa de cuestionamiento, tiempo de resolución, % reales vs falsas.
- Búsquedas que llegan a actividades (GA4 + contadores propios), landings con tráfico de buscador (Search Console cuando esté).
- **Demostración de mejora**: línea base (hoy: 0 actividades) y tabla antes/después a los 14 y 30 días; si no se ve mejora, se dice.

---

## 16. Contenido inicial (entregable de datos)

El dueño tiene ~5 actividades reales. Para cargar cada una necesito:

| Dato | Detalle |
|---|---|
| Título y gancho | Ej. "Senderismo los domingos" |
| Tipo | Global o de sitio (y cuál sitio; confirmar que el dueño del sitio autoriza) |
| Descripción | Texto propio |
| Cuándo | Recurrencia exacta (días, hora, cada cuánto, temporada, excepciones) |
| Cuánto | Opciones de precio, qué incluye, extras |
| Punto de encuentro | Texto + ubicación (para globales) |
| Fotos | Mínimo 1 de portada + 2–3 más, **con permiso** (las que toma QHPA son de QHPA) |
| CTA | WhatsApp o enlace |
| Quién organiza | Nombre y foto del anfitrión |
| Permiso | Autorización del organizador (se reutiliza la plantilla de `~/Documentos/QueHayPaHacer/permisos/`) |

**Carga (Q17)**: **la hace el dueño desde la propia app**, con una cuenta administradora de QHPA (se autoaprueba y puede publicar en nombre de un sitio ajeno administrado por QHPA). Así el asistente de creación se prueba con contenido real. Primero en **develop**; el contenido en **producción** solo con orden explícita. Si hubiera que cargar muchas de golpe, se usa un script con dry-run y se **invalida la caché** después (lección de `rueda-por-ibague-sites-prod`).

---

## 17. Documentación a entregar con el código

- `docs/31-actividades.md`: modelo, estados, permisos, operación (scripts), decisiones, riesgos.
- Actualizar `docs/14-legal-y-cumplimiento.md`, `docs/16-sitios-confianza-y-reclamos.md` (transferencia de actividades), `CAPABILITY-MAP.md` y `docs/09-inventario-rutas-apis-y-scripts.md`.
- Memoria del proyecto al cierre de cada fase (rutina "lo de siempre").

---

## 18. Comandos

```
Test:       pnpm test                                   # tsx --test "**/*.test.ts" "**/*.test.tsx"
Typecheck:  pnpm typecheck                              # next typegen && tsc --noEmit
Build:      pnpm build
Lint:       pnpm lint
Dev:        NODE_OPTIONS=--dns-result-order=ipv4first pnpm dev     # si 404 masivo: rm -rf .next/dev
Prod local: pnpm build && pnpm start                    # :3100 para pruebas reales
Scripts:    pnpm exec tsx scripts/list-activities.ts [--approve <id> | --reject <id> --reason "..."] [--apply]
            pnpm exec tsx scripts/list-activity-flags.ts [--resolve <id> --outcome upheld|removed] [--apply]
            (carga inicial: desde la app con cuenta admin; script de carga solo si hace falta)
```

Antes de cada checkpoint: **`pnpm typecheck` + `pnpm test` + `pnpm build` completos** (lección de la memoria); no encadenar con `;` sin comprobar errores.

## 19. Estructura del proyecto (archivos y carpetas previstas)

```
domain/entities/activities/             → Activity, value-objects (schedule, price, cta, category), reglas puras y tests
domain/entities/activities/review/      → ActivityReview, agregados, estados, tests
domain/entities/activities/moderation/  → confianza, sanciones, motivos, tests
domain/repository/activities/           → interfaces
application/dto/activities/             → valibot (actividad, reseña, promo, cuestionamiento)
application/services/activities/        → ActivityService, ReviewService, ModerationService, PromotionService
infraestructure/firebase/{dto,mappers,repositories}/activities/
infraestructure/di/container.ts         → registro de servicios
app/actions/activities/                 → acciones de servidor (create, update, pause, review, flag, reply, visit…)
app/actividades/                        → hub, [slug], rutas públicas
app/(landings)/[coleccion]/             → se extiende con colecciones de actividades
app/(studio)/studio/actividades/        → gestión, asistente, vista previa
app/api/activities/[id]/track/          → medición (F4)
app/og/actividad/[slug]/                → imagen Open Graph
presentation/activities/{components,view-models,lib,data}/
infraestructure/email/                 → ResendEmailService, cola con tope, plantillas (D43)
src de push (service worker y servicio)   → el plan confirma la ruta (reutiliza `/sw.js`)
scripts/                                → list-activities.ts, list-activity-flags.ts (carga inicial desde la app con cuenta admin)
docs/31-actividades.md
tasks/plan-actividades.md · tasks/todo-actividades.md   (tras aprobar esta spec)
```

Los **archivos a tocar** de lo existente (estimados; el plan los confirma): `app/sitemap.ts`, `app/explorar/page.tsx` y `exploreFetchers`, `HomeSearchBar`/`ExploreSearchBar`, `app/(home)/page.tsx`, `SiteDetailContainer`, `domain/entities/report/Report.ts`, `domain/entities/notification/Notification.ts`, `domain/entities/spamGuard/spamGuard.ts`, `app/(landings)/[coleccion]`, `scripts/list-site-claims.ts`, `app/lib/legal/version.ts` y los textos de términos/privacidad.

## 20. Estilo de código

Un fragmento real vale más que tres párrafos. Patrón: **función pura + test colocado**, mensajes en español (tú), constantes en un solo lugar, sin identificadores prohibidos.

```ts
// domain/entities/activities/trust.ts
export const TRUST_MIN_APPROVED = 3;

export interface AccountHistory {
  approvedCount: number;
  activeSanctions: number;
  suspendedUntil: number | null;
}

/** ¿La cuenta se autoaprueba? Un solo lugar para cambiar la regla. */
export function isTrustedHost(h: AccountHistory, now: number): boolean {
  if (h.suspendedUntil !== null && h.suspendedUntil > now) return false;
  return h.approvedCount >= TRUST_MIN_APPROVED && h.activeSanctions === 0;
}
```

```ts
// trust.test.ts (patrón del repo: node:test)
test("cuenta con 3 aprobadas y sin sanciones es de confianza", () => {
  assert.equal(isTrustedHost({ approvedCount: 3, activeSanctions: 0, suspendedUntil: null }, NOW), true);
});
test("una sanción vigente quita la confianza", () => {
  assert.equal(isTrustedHost({ approvedCount: 9, activeSanctions: 1, suspendedUntil: null }, NOW), false);
});
```

Convenciones: Tailwind con **tokens** del proyecto (sin colores crudos; verificar que el token existe), `Section` y componentes de `app/components/ui`, `ServerBoundary` para páginas con `searchParams`, dependencias inyectadas en rutas (`eventTrack.ts`), sin `any`, sin comentarios que expliquen lo obvio.

## 21. Estrategia de pruebas

| Nivel | Qué | Cómo |
|---|---|---|
| Unitarias (**TDD, rojo primero**) | Motor de recurrencia, banda de presupuesto, CTA, slug, `isPubliclyVisible`, `isTrustedHost`, antispam, agregados de rating, escalera de sanciones, motivos, aleatorio diario con semilla, tokens de búsqueda, permisos puros | `pnpm test` (`node:test` vía `tsx`) |
| Servicio | Crear/editar/aprobar, una reseña por persona (carrera), cuestionar/resolver, transferencia por reclamo, IDOR | Dependencias inyectadas con fakes en memoria (patrón de `eventTrack.ts`) |
| Mapeadores | Round-trip `toDto`/`toViewModel`; no perder campos al re-guardar | Unitarias |
| Componente | Render con 0/N, estados vacío/error, accesibilidad de estrellas | Pruebas de componentes si el repo las tiene; si no, lógica pura + navegador |
| Navegador (E2E) | Crear actividad → pendiente → aprobar por script → visible → reseñar con Google → cuestionar → resolver; filtros "hoy"; sitio ↔ actividad | Playwright local contra `next start` (:3100), kit en `~/.cache/qhpa-qa`; capturas a 390 px; consola sin errores; datos QA restaurados |
| Seguridad | Subidas, XSS, IDOR, límites | Revisión `security-auditor` y casos negativos en pruebas |
| Rendimiento | LCP/CLS del detalle y hub | Lighthouse/Web Vitals en build de producción |
| SEO | JSON-LD, metadatos, sitemap | Prueba de resultados enriquecidos + verificación de HTML |

Cobertura: toda lógica con ramas (recurrencia, estados, permisos, dinero/seguridad) **debe** tener prueba; lo trivial no.

## 22. Límites (Boundaries)

**Siempre**
- TDD y un commit por tarea; `develop` solamente; `pnpm typecheck` + `pnpm test` + `pnpm build` antes de cada checkpoint.
- Validar y autorizar en el servidor; texto plano; mensajes en español (tú).
- Reutilizar lo existente antes de crear (`SiteSections`, `pickDiscoverIds`, `spamGuard`, `Report`, `Notification`, `contentDeclarations`, `beaconGuard`, `bogotaDay`, pipeline de imágenes).
- Dry-run por defecto en scripts que escriben datos.
- Leer la guía relevante de `node_modules/next/dist/docs/` antes de tocar APIs de Next (el `AGENTS.md` avisa que esta versión difiere de lo conocido).

**Preguntar antes**
- `git push origin develop` (dispara rollout de develop); cualquier escritura en Firestore/Storage de develop o prod; **todo** lo de producción.
- Cambios de esquema que implican **índices** de Firestore, reglas, o Cloud Functions/el optimizador de medios (repo `functions`).
- Subir `LEGAL_VERSION` y publicar textos legales.
- Cambios en el repo **`../functions`** (ampliar el procesador de video/imágenes a actividades y desplegarlo; empujar su rama al desplegar) y cualquier cambio de límites de medios.
- Números de sanciones, confianza y topes de antispam.
- Crear alertas de Cloud Monitoring.
- Añadir dependencias nuevas.
- **Canales de aviso (D43)**: cambios de DNS de `yquehaypahacer.com` (SPF/DKIM/DMARC), crear la cuenta de Resend y su secreto (solo nombre), claves VAPID/FCM, activar envíos reales a usuarios y subir `LEGAL_VERSION` por el consentimiento de correo/push y la transmisión internacional.
- Abrir la creación de actividades a **todo público** (con registro de oferentes y revisión de seguridad ya cumplidos; abogado recomendado, no obligatorio).

**Nunca**
- Escribir **código de pagos/dinero** ni mover/retener fondos (eso es `activity-commerce`, futuro, con contador).
- Tocar `main`/producción sin orden explícita; usar `git add -A`; `git reset --hard`/`checkout --`/`clean`/`stash` simple.
- Mostrar correos, `uid` completos o datos privados de quienes reseñan.
- Borrar reseñas automáticamente o sembrar reseñas falsas.
- Aceptar HTML/Markdown de usuarios ni URLs fuera de la CTA.
- Enviar correo o push **sin permiso explícito** del usuario (salvo transaccionales de su propia inscripción), apuntar usuarios existentes a listas de avisos, o escribir/imprimir claves de Resend/VAPID.
- Reintroducir los nombres prohibidos (`professional/accountType/business/organizer/government/digitalCreator`).
- Leer o pedir por chat valores de secretos (solo nombres).
- Migrar o modificar sitios/eventos existentes más allá de lo declarado (bloque de actividades en la ficha del sitio y transferencia por reclamo).

## 23. Criterios de éxito (globales, específicos y comprobables)

1. Una cuenta `creator` crea una actividad **global** y queda en revisión; un script la aprueba y aparece en `/actividades`, en el sitemap y en la búsqueda; antes de aprobarla da **404 público**.
2. Una cuenta que **no es autora del sitio no puede** crear ni vincular actividades a ese sitio (prueba de servidor + manual).
3. Con 3 actividades aprobadas, la siguiente se autoaprueba; con una sanción vigente vuelve a revisión.
4. El motor de recurrencia calcula correctamente "próxima salida" y "hoy" para semanal, cada 2 semanas, n-ésimo del mes y fechas sueltas, en hora de Bogotá.
5. `/actividades?cuando=hoy` muestra solo lo de hoy; los filtros de presupuesto y "con quién" funcionan y son compartibles por URL.
6. El home muestra **8** actividades distintas cada día, estables dentro del día, sin más de 2 por sitio/anfitrión, y **no** se muestran bloques vacíos.
7. La ficha del sitio muestra "¿Qué se puede hacer aquí?" con sus actividades y la actividad enlaza de vuelta; una global **no** ofrece menú, espacios ni promos.
8. Se publica una reseña con Google en un flujo corto, con ≤3 fotos y ≤1 video, **una por persona**; el creador no puede reseñar la suya; agregados correctos.
9. El dueño cuestiona una reseña: queda **visible, en rojo, "En verificación"**; QHPA la resuelve; la sanción correcta queda registrada y notificada a ambas partes.
10. Hub, pilar, landings y detalle pasan la Prueba de resultados enriquecidos; sitemap solo con URLs públicas.
11. Sin errores de consola; verificado a 320/390/768/1024/1440 px; accesibilidad (teclado, foco, contraste) comprobada.
12. `pnpm test`, `pnpm typecheck`, `pnpm build` verdes; revisión de seguridad sin críticos/altos abiertos antes de F3 y antes de abrir la creación pública.
13. Términos/Privacidad actualizados con OK del dueño y procedimiento de supresión documentado antes de lanzar reseñas; **registro de oferentes** operativo (sin él no se publica), con consulta para quejas y exportación a la autoridad.
14. Las **5 actividades reales** cargadas en develop con permiso; producción solo con orden explícita.
15. **Participación (D40–D43):** un usuario nuevo guarda, marca "Yo fui" e inscribe en una salida en menos de 10 s por acción; "Mis planes" funciona; los avisos por campanita, correo (Resend) y push respetan permiso, baja con un clic y topes; el correo "Para ti" y "Eventos de esta semana" salen solo a quien dio permiso y a veces se verifica a mano que no caen en spam.

## 24. Preguntas abiertas

Las 18 preguntas de la versión anterior quedaron **resueltas** (decisiones D19–D36 en la sección 2). Lo que sigue abierto es poco, y **ninguna bloquea F1**:

| # | Pregunta | Mi opción por defecto | Bloquea |
|---|---|---|---|
| **Q19** | ~~¿Cómo se pasa a `creator`?~~ **Resuelta (D37)**: al crear evento o sitio; se extiende a la primera actividad. **Confirmada por el dueño**: al crear un evento o sitio siendo `consumer` se pasa a `creator` automáticamente; igual con la actividad. | — | — |
| **Q20** | ~~Lista de 16 categorías~~ **Aprobada.** | — | — |
| **Q21** | ~~Abogado antes de abrir~~ **Resuelta (D27)**: nos apegamos a la norma (registro de oferentes); abogado recomendado después, no requisito. | — | — |
| **Q22** | ~~Split de pagos~~ **Resuelta (D39)**: investigación de Mercado Pago en segundo plano, sin código (8.9). | — | — |

### Explicaciones que pediste (resumen)
- **Q9 (Ley 1480 art. 53):** decisión: **cumplir la norma**. Quien ofrezca algo deja sus datos de identificación; QHPA los registra, los hace consultables para quejas y los entrega a la autoridad (8.2 punto 4).
- **Q10 (video):** decisión: **video encendido**, pero comprimido (se reduce a unos pocos MB) y en streaming (solo carga lo que se ve), con interruptor de emergencia. Lo caro pasa a ser el **procesamiento**; por eso el plan trae cifras antes de construir.

### Riesgos y límites honestos
- **Cold start**: con pocos usuarios, las reseñas tardarán; la ficha lo dice con honestidad y no se siembra nada falso.
- **Moderación manual** al inicio (scripts); el **panel administrativo** (tarea aparte) la hará más cómoda. Con crecimiento, el cuello real será tu tiempo; por eso la autoaprobación y las alertas.
- **Reseñas falsas con cuentas múltiples** no se eliminan por completo; se mitigan.
- **Costos**: el video sigue siendo el mayor riesgo; arranca encendido pero comprimido, con tope de duración y interruptor de emergencia.
- **Legal**: se cumple el art. 53 con el registro de oferentes; datos personales de reseñadores y anfitriones tratados con autorización; borrador de textos **sin revisión de abogado** (recomendada después).
- **Alcance**: es un módulo grande (10 módulos, 5 fases). Se entrega por fases verificables; cada fase se puede detener sin dejar el producto a medias.

---

## 25. Prototipos visuales en Artifact (D38)

Regla de trabajo: **antes de codificar la interfaz de una tarea, se prepara su prototipo visual en un Artifact** (página HTML privada), para que el dueño la vea y corrija **antes** de tocar la app. Se hace **por tarea y bajo demanda**, **no todas las pantallas de golpe**.

- El **plan** (`tasks/plan-actividades.md`) marca qué tareas son "con interfaz" y cuáles requieren prototipo; cada una trae su lista de pantallas/flujos/modales/componentes.
- Prototipos previstos, **cada uno en su momento**:
  - **F1**: ficha de actividad (móvil y escritorio), tarjeta de actividad, asistente de creación (pasos), constructor de horario y de precios, bloque "¿Qué se puede hacer aquí?" en la ficha del sitio.
  - **F2**: bloque del home, filtros del hub, resultados de búsqueda mezclados.
  - **F3**: encabezado de reseñas, tarjetas "polaroid", historia abierta, formulario de reseña (con Google y subida de medios), estado **"En verificación"** en rojo suave, flujo de cuestionar y de apelar.
  - **F4**: menú/productos, espacios reservables, bloque de promociones, panel del creador.
  - **F5**: álbum/libro que se voltea, cartelera de cine.
- Cada prototipo sigue las skills de diseño (`artifact-design`, `ui-design`, `frontend-design`), usa los **tokens reales del proyecto** (sin colores inventados), muestra los **estados** (vacío, cargando, error, éxito) y se publica como Artifact **privado**; el dueño lo aprueba y recién entonces se construye el componente real.
- Un prototipo **no es código de la app**: es referencia. No sustituye las pruebas ni la verificación en navegador.
- Nota operativa: el boceto Artifact anterior (de analytics) sigue publicado; no se reintenta su borrado salvo que el dueño lo pida.

---

## 26. Participación y retención (`activity-engagement`, D40–D42)

**Objetivo:** no solo usuarios: usuarios que **hacen cosas y vuelven**. Cada acción debe tomar **menos de 10 segundos** y el registro es con Google en un toque.

### 26.1 Escalera de interacción
| Nivel | Acción | Requisito |
|---|---|---|
| 1 | Ver | Ninguno |
| 2 | **Guardar** ("me interesa") | Cuenta |
| 3 | **Yo fui** | Cuenta |
| 4 | **Unirme / reservar cupo** | Cuenta |
| 5 | **Contar mi historia** (reseña, F3) | Cuenta de Google |
| 6 | **Compartir / invitar** | Ninguno |

### 26.2 Requisitos
1. **Guardar** (privado, un toque, deshacer): actividades, y por extensión eventos y sitios (coordinado con `intent` de `analytics-v2`; un solo mecanismo, no tres). Colección por usuario `users/{uid}/saved/{tipo_id}`; contador agregado; sin exponer quién guardó.
2. **Yo fui** (8.4) se adelanta a F1; "N personas fueron" desde 10.
3. **Unirme / reservar cupo** (gratis, con cuenta): el creador define si **hay cupo** (número máximo, opcional) y si se **pide aviso previo**; al unirse se crea una inscripción (patrón de `EventRegistration`), se notifica al creador y se muestra "Estás dentro". El creador ve la **lista de inscritos** (nombre y contacto autorizado) y puede cerrar cupos. Para **salidas recurrentes** la inscripción es **por ocurrencia** (la del domingo 16). Sin cobro dentro de QHPA (el pago, si hay, es externo; la actividad lo dice). Lo avanzado (formularios, asistencia, equipo) es Premium futuro.
4. **Mis planes**: una página con lo **guardado**, lo **que voy a hacer** (inscripciones próximas) y lo **que hice** (Yo fui). Es la razón para volver. Fuera de `/studio`.
5. **Avisos** (campanita existente): "mañana sale la caminata", "último cupo", "esta semana hay 4 planes nuevos en lo que guardaste". Tipos nuevos de notificación. Los canales de correo y push (D43) se suman en 26.2b; la campanita es el canal base.
6. **Resumen semanal automático** ("Qué hacer este fin de semana en Ibagué"): se genera solo de eventos y actividades reales, con texto listo para el Canal de WhatsApp y imagen para Instagram. Publicación del Canal **manual** al inicio (el dueño copia y pega); el **correo** semanal sí se envía por el canal de 26.2b a quien dio permiso.
7. **Insignias y pasaporte** (F3): se reutiliza el sistema `badges` existente: "Primera historia", "Explorador de Ibagué" (5 actividades), "Pasaporte" (sellos). Los sellos por **QR en el local** cuentan como visita verificada; "Yo fui" sin QR cuenta menos. Sin recompensas con dinero.
8. **Kit de compartir con QR y afiche** para actividades en F1 (reutiliza el de `analytics-v2`: enlaces automáticos por canal `/r/…`, QR, afiche PNG, mensaje de WhatsApp).
9. **Medición mínima en F1**: vistas, canal de origen (`ch`), guardados, "Yo fui", inscripciones y compartidos, para saber qué trae usuarios (patrón de `measure`).

### 26.2b Canales de aviso (D43)

**Principio:** un canal por razón, con permiso explícito y tope de frecuencia. Cada aviso responde "¿por qué te escribo?" (algo que guardaste, algo en lo que te inscribiste, algo que coincide con lo que te gusta).

| Canal | Costo | Uso | Alcance |
|---|---|---|---|
| **Campanita** (existente) | Gratis | Todo aviso | Quien entra a la app |
| **Correo (Resend)** | Plan gratis (≈3.000/mes, tope ≈100/día, 1 dominio; **verificar en su página**) | Transaccionales y resúmenes | Quien dio permiso |
| **Push web (FCM)** | Gratis | Recordatorios y "último cupo" | Quien aceptó notificaciones; en iPhone solo con la app instalada (verificar) |
| **Canal de WhatsApp** | Gratis | Resumen semanal público | Quien lo siga |

**Preferencias y permiso**
1. `users/{uid}/notificationPrefs`: por **canal** (correo, push) y **tipo** (recordatorios, "para ti", "eventos de la semana", novedades de lo guardado); por defecto **todo apagado salvo transaccionales** (confirmación y recordatorio de **mi inscripción**).
2. **Casilla de autorización separada** de los términos al registrarse y en "Mis planes" ("Quiero recibir avisos de planes en Ibagué"), con fecha y `LEGAL_VERSION`. Los usuarios existentes **no** se apuntan solos: se les invita (banner en "Mis planes" y después de guardar/inscribirse).
3. **Baja con un clic** en cada correo (enlace y cabecera `List-Unsubscribe`), y en la página de preferencias; la baja se respeta en minutos.
4. **Topes**: máximo **1 correo y 1 push por día por usuario**; máximo **1 resumen semanal**; sin envíos de madrugada (horario Bogotá); nada de avisos si el contenido está vencido.

**Correo con Resend (sin dependencia nueva: llamadas HTTPS con `fetch`)**
5. **Dominio**: SPF, DKIM y DMARC de `yquehaypahacer.com` (cambio de DNS = "preguntar antes"); remitente tipo `hola@yquehaypahacer.com`; la **clave de API** vive como secreto de App Hosting (solo se habla de su **nombre**, nunca se imprime ni se guarda en el repo).
6. **Cola con tope diario configurable** (`EMAIL_DAILY_CAP`, por defecto por debajo del límite gratis): **primero** los transaccionales, **después** los resúmenes, repartidos en el tiempo; si se llega al tope, lo que sobre pasa al día siguiente y se registra. Aviso interno cuando se llegue al 80% para decidir el cambio de plan (Resend de pago o Brevo).
7. **Plantillas** (texto + HTML sencillo, móvil primero, tuteo, sin voseo, sin imágenes pesadas): (a) confirmación de inscripción, (b) recordatorio "mañana sale…", (c) **"Actividades y sitios que te pueden interesar"** (semanal o quincenal), (d) **"Eventos de esta semana en Ibagué"** (semanal), (e) cupo liberado o último cupo.
8. **Personalización simple y honesta** de (c): según lo **guardado**, "Yo fui", categorías vistas y las preferencias de usuario existentes (`UserPreferences`); sin datos sensibles; si no hay señal, se muestran las actividades "de hoy" del home. Cada correo trae **por qué lo recibes**.
9. **Privacidad**: Resend procesa los correos fuera de Colombia (se agrega a la política de **transmisión internacional**, como ya se hace con Google); no se envían datos personales de terceros ni listas de inscritos.
10. **Medición**: envíos, rebotes, bajas, clics por `/r/…` (canal `email`) y su aporte a visitas e inscripciones.

**Push web (FCM)**
11. Reutiliza el **service worker** existente (`/sw.js`); claves VAPID como secretos; token por dispositivo en `users/{uid}/pushTokens`, con vencimiento y limpieza de tokens inválidos.
12. **Cuándo pedir permiso:** nunca en la primera carga; **después de una acción de valor** (guardar o inscribirse): "¿Quieres que te avisemos cuando sea?". Si dice que no, no se vuelve a pedir en 30 días.
13. Solo avisos útiles: recordatorio de inscripción, último cupo, algo guardado cambió. Tope de 1 diario.
14. **Verificar en el plan**: soporte en iPhone (requiere la PWA instalada), permisos de Chrome/Safari y costo de Firebase Cloud Messaging (documentación oficial).

**Canal de WhatsApp (cómo atraer público sin gastar)**
15. Es un canal **de difusión**: no necesita que tengan tu número. Se llena **desde dentro del producto**: botón "Seguir el canal" en la ficha de cada actividad, en la confirmación de inscripción, en "Mis planes", en el pie de cada correo, en el afiche con QR y en las bios de Instagram/TikTok; y **cada comunidad lo comparte** con su grupo al cargar su actividad (G0 lo incluye en el guion). El contenido es el **resumen semanal** (26.2, punto 6).

### 26.2c Criterios de aceptación de canales
- Un usuario sin permiso **no** recibe correos ni push (solo transaccionales de su propia inscripción).
- Darse de baja con un clic detiene los envíos y se refleja en preferencias.
- Con el tope diario alcanzado, los resúmenes se aplazan **sin perder** los transaccionales.
- El correo y el push traen un enlace con canal (`email`, `push`) y se ve en la medición.
- SPF/DKIM/DMARC válidos y un correo de prueba **no cae en spam** en Gmail y Outlook (verificado a mano).
- Los permisos quedan guardados con fecha y versión legal.

### 26.3 Métricas de éxito (metas propuestas, no medidas)
- **Activación:** % de usuarios nuevos que hacen una acción de nivel 2 o más en su primera visita.
- **Retención:** % que vuelve a los 7 y a los 30 días.
- **Interacciones por usuario por semana.**
- **Usuarios nuevos por enlace/QR** (`/r/…`).
- **Actividades con ≥1 inscripción**; comunidades que comparten su página por su cuenta.

### 26.4 Material de acercamiento (D42)
Documento `docs/33-acercamiento-comunidades.md` con: guion corto de 30 segundos, mensaje de WhatsApp, qué se les ofrece (página con QR y afiche, inscripción con cupos, gratis), qué se les pide (permiso, fotos, horario y precios) y plantilla de seguimiento. **No es código.**

### 26.5 Criterios de aceptación
- Un usuario nuevo guarda, marca "Yo fui" e inscribe en una salida en **menos de 10 segundos por acción**, con Google.
- "Mis planes" muestra lo guardado, lo próximo y lo hecho, y no filtra datos de otras cuentas.
- Inscribirse a una salida con cupo lleno muestra mensaje claro y no duplica inscripciones (una por persona y ocurrencia).
- El creador ve la lista de inscritos de **su** actividad y de ninguna otra (prueba de IDOR).
- El resumen semanal sale de datos reales y vigentes (nada vencido).

---

*Fin de la spec. Siguiente paso (solo tras tu aprobación): `tasks/plan-actividades.md` y `tasks/todo-actividades.md`.*
