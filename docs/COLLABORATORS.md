# Feature: Colaboradores de eventos

Contexto para implementar la sección de **colaboradores** en QueHayPaHacer (Next.js + Firebase/Firestore).

Stack: Next.js + Firebase (Auth con Google, Firestore). El login con Google ya existe y crea documentos en `users`. **No tocar el flujo de autenticación ni la colección `users` existente.**

---

## Objetivo de negocio

Una **cuenta profesional** puede armar un evento con colaboradores. Un colaborador es alguien que aparece acreditado en el evento ("Creado por X · con Y y Z"). Hay dos tipos de colaborador:

1. **User existente** — una cuenta real de la plataforma. Se le invita por correo y **debe aceptar**. Puede tener permisos (editar / ver).
2. **Perfil externo** — una entidad que "solo da la cara" (ej. una productora musical que distribuye pero no gestiona nada). Tiene foto, nombre, bio. **No tiene login, no acepta nada.** La crea y administra la cuenta profesional que la trajo.

Regla: **solo cuentas con `accountType === "professional"` pueden agregar colaboradores.** El invitado puede ser cualquier cuenta o un externo.

Invitaciones son **bidireccionales**: a mí me pueden invitar a colaborar en el perfil/evento de otro, y yo puedo invitar a otros o crear externos.

---

## Decisión de arquitectura (importante, respetar)

Se descartó unificar todo en una colección `profiles`. Motivo: obligaría a reapuntar `users` → `profiles` en todo el modelo de eventos y en el login. Refactor transversal innecesario para un MVP.

En su lugar: **`users` se mantiene intacto** y se agrega `externalProfiles` solo para las caras sin login. El evento referencia colaboradores con `{ refId, kind }` para saber de qué colección viene cada uno.

Sacrificio aceptado conscientemente: si un externo algún día quiere su propia cuenta, reclamar/heredar métricas será una migración manual. Es futuro, puede que nunca pase, no se construye ahora.

---

## Modelo de datos (Firestore)

### `users/{uid}` — NO MODIFICAR estructura de auth existente

Campos que la feature asume que existen o deben agregarse si faltan:

```
users/{uid}
  email: string            // normalizado a minúsculas, sin espacios — llave de búsqueda
  accountType: "personal" | "professional"
  displayName: string
  avatar: string
```

### `externalProfiles/{extId}` — NUEVA

Caras sin login, creadas por una cuenta profesional.

```
externalProfiles/{extId}
  displayName: string
  avatar: string           // url de la imagen subida
  bio: string
  type: "producer" | "artist" | "venue" | "person"
  managedBy: string        // uid del profesional que lo creó
  email: string | null     // opcional; solo si algún día se quiere invitar a reclamar
  createdAt: Timestamp
  linkedUserId: null        // reservado a futuro; NO implementar reclamación ahora
```

### `events/{eventId}` — MODIFICAR el campo de colaboradores

`ownerId` sigue siendo un `uid` (cero refactor del owner). Solo cambia cómo se listan colaboradores.

```
events/{eventId}
  ownerId: string                          // uid — sin cambios
  ownerAccountType: "professional"         // se valida al agregar colaboradores
  collaborators: [                          // array de referencias tipadas
    { refId: "uid_ana",  kind: "user" },
    { refId: "ext_xyz",  kind: "external" }
  ]
  collaboratorsData: {                      // denormalizado, para pintar la card sin joins
    "uid_ana":  { displayName, avatar, role: "editor" },
    "ext_xyz":  { displayName, avatar, role: "credit" }
  }
  status: "draft" | "published"
  // ...resto de campos del evento ya existentes
```

Roles:
- `editor` — puede modificar el evento (solo aplica a `kind: "user"`).
- `viewer` — puede verlo en su panel (solo aplica a `kind: "user"`).
- `credit` — solo aparece acreditado, no ejecuta acciones (típico de externos).

### `collaborationInvites/{inviteId}` — NUEVA (solo para invitar users existentes)

Los externos NO usan esta colección (no aceptan nada). Solo el flujo de invitar a un user real.

```
collaborationInvites/{inviteId}
  eventId: string
  fromUid: string              // quién invita (profesional)
  toUid: string                // a quién se invita (user existente)
  toEmail: string              // correo con el que se buscó
  role: "editor" | "viewer"
  status: "pending" | "accepted" | "declined"
  createdAt: Timestamp
  respondedAt: Timestamp | null
```

Al aceptar (`status: "accepted"`): agregar `{ refId: toUid, kind: "user" }` a `events/{eventId}.collaborators` y su entrada en `collaboratorsData`.

---

## Flujos a implementar

### Flujo A — Agregar colaborador (desde el editor de evento, solo cuenta profesional)

UI: un buscador/select. El usuario escribe un correo o nombre.

1. Buscar en `users` por `email` normalizado.
2. **Existe** → mostrar el resultado. Al seleccionarlo, elegir role (editor/viewer) y crear un `collaborationInvites` con `status: "pending"`. NO se agrega al evento todavía; espera aceptación.
3. **No existe** → mostrar opción **"Crear perfil externo"**. Abre un formulario con: nombre, imagen (upload a Storage), tipo, bio opcional. Al guardar: crear `externalProfiles/{extId}` con `managedBy: currentUid`, y agregar de una `{ refId: extId, kind: "external" }` al evento con `role: "credit"`. Aparece inmediatamente.

### Flujo B — Responder invitación (a mí me invitaron)

UI: una bandeja de invitaciones pendientes (`collaborationInvites` where `toUid == currentUid` and `status == "pending"`).

- Aceptar → `status: "accepted"`, agregar al array del evento + `collaboratorsData`.
- Rechazar → `status: "declined"`, no se toca el evento.

### Flujo C — Renderizar colaboradores

En la card del evento y en el detalle: leer `collaboratorsData` directamente (ya está denormalizado). **No hacer joins ni preguntar `kind` para pintar** — los datos ya están ahí. `kind` solo importa si se necesita navegar al origen (perfil de user vs externo).

---

## Reglas y validaciones

- Al agregar cualquier colaborador: validar `ownerAccountType === "professional"`. Si no, bloquear.
- `email` siempre normalizado (`.toLowerCase().trim()`) al guardar y al buscar.
- Un mismo colaborador no puede estar dos veces en el mismo evento (validar por `refId`).
- Externos: `managedBy` debe ser el `currentUid`; nadie más puede editar ese `externalProfile`.
- Denormalización: si un user cambia su `displayName`/`avatar`, `collaboratorsData` queda desactualizado. Para el MVP se acepta; no construir sincronización automática todavía (dejar anotado como deuda técnica).

---

## Fuera de alcance (NO construir ahora)

- Reclamación de perfiles externos (`linkedUserId`, merge, herencia de métricas).
- Gráfica de atracción de audiencia por colaborador y atribución por query param `?ref=`. (El modelo NO necesita cambios para esto luego; se agregará una subcolección `attributions` y un `stats.byCollaborator` en el evento.)
- Un user gestionando múltiples perfiles propios (agencia). Con `managedBy` basta por ahora.
- Sincronización automática de `collaboratorsData` cuando el user origen cambia sus datos.

---

## Frontend

Ya existe un frontend visual de colaboradores que se quiere reemplazar. La lógica de negocio NO existe aún. Construir: el buscador/select con las dos ramas (user existente / crear externo), el formulario de perfil externo con upload de imagen, y la bandeja de invitaciones pendientes. Conectar todo a Firestore según el modelo de arriba.
