# Producto y decisiones vigentes

## 1. Qué es QHPA

**Que Hay Pa Hacer (QHPA)** es una plataforma local para descubrir, publicar y gestionar eventos y sitios de interés. El foco geográfico actual es **Ibagué, Colombia**, según metadata, contenido, colecciones, seeds y utilidades de geolocalización.

El producto combina cuatro experiencias:

1. Descubrimiento público de eventos, planes y sitios.
2. Aportes de la comunidad: eventos y sitios.
3. Perfil con identidad, insignias y trayectoria dentro de QHPA.
4. Herramientas avanzadas de gestión para creadores mediante Studio.

No es una red social tradicional. La trayectoria registra actividad y aportes; no implementa publicaciones libres, comentarios, seguidores, muro ni reacciones sobre actividades.

## 2. Audiencias

### Consumidor

- Descubre eventos y sitios.
- Busca por colección, categoría y ubicación.
- Da like, comparte y se registra cuando el evento lo permite.
- Puede aportar contenido con los controles definidos por el producto.
- Mantiene perfil, preferencias, insignias y trayectoria.

### Creador

- Publica y administra eventos y sitios.
- Puede tener perfil público.
- Puede ser verificado por QHPA.
- Puede acceder a capacidades Premium si su plan es Premium.

### Operación/administración

- Modera eventos y sitios.
- Verifica creadores.
- Gestiona campañas y datos semilla mediante código/scripts.
- No existe todavía un backoffice administrativo completo para todas estas tareas.

## 3. Modelo de cuenta: contrato que no debe revertirse

El modelo vigente está en `domain/entities/user/User.ts`:

```text
participation: consumer | creator
plan: basic | premium
creatorVerified: boolean
emailVerified: boolean
```

Las dimensiones son independientes:

- **Participación** responde qué hace la persona en QHPA.
- **Plan** responde qué herramientas tiene habilitadas.
- **Verificación** expresa confianza otorgada por QHPA.
- **Verificación de email** es un control de seguridad de la cuenta.

No reintroducir como identidad de usuario:

- profesional o cuenta profesional;
- negocio;
- organizador;
- institución o gobierno;
- creador digital/profesional;
- categoría del sitio o actividad.

El sitio y el evento son entidades independientes del perfil de la persona.

## 4. Username e identidad pública

- `displayName` es el username canónico persistido.
- La interfaz lo representa como `@username`.
- La reserva es transaccional mediante `usernames/{username}`.
- El nombre personal usa `firstName + lastName` y se muestra antes del username.
- La unicidad no debe depender de una consulta no transaccional.

## 5. Membresía

La definición visible vive en `presentation/profile/lib/membership.ts`.

### Básico

- Crear eventos.
- Gestión básica de eventos.

### Premium

- Todo lo incluido en Básico.
- Eventos multifecha.
- Formularios personalizados.
- Studio y analíticas avanzadas.
- Gestión de colaboradores.
- Soporte prioritario, marcado como **próximamente**.

### Estado comercial actual

- No hay precio definido en código.
- No existe checkout ni pasarela para comprar Premium.
- El CTA actual dirige a `/contactanos` para acordar condiciones con el equipo.
- Los tests exigen que Básico y Premium no inventen precio ni terminología profesional.
- Asignar Premium es hoy una operación administrativa, no un autoservicio comercial.

## 6. Verificación y moderación

La verificación es independiente del plan.

Política actual para eventos (`eventModerationPolicy.ts`):

- Creador verificado: el evento pasa a `published`, con auditoría posterior (`pending_audit`, `post_publication`).
- Usuario no verificado: el evento pasa a `pending`, con revisión previa (`pre_publication`).

Decisiones pendientes:

- quién puede verificar creadores;
- cómo solicita verificación un usuario;
- evidencia requerida;
- SLA y trazabilidad de la revisión;
- protocolo ante rechazo o retiro de verificación.

## 7. Eventos

### Tipos

- `standard`: un evento con una fecha/rango principal.
- `multi-date`: evento padre con sesiones independientes. Está restringido a Premium.

### Registro

- `none`: informativo, sin registro.
- `internal`: registro gestionado por QHPA.
- `external`: enlace a una plataforma externa.
- `form`: formulario personalizado.

### Pagos

QHPA **no procesa pagos**. Si un evento es pagado, la UI obliga a usar registro externo y el creador administra el cobro fuera de la plataforma.

### Estados relevantes

- Ciclo editorial: `draft`, `pending`, `published`, `rejected`, `cancelled`, `ended`.
- Moderación: `pending`, `approved`, `rejected`, `pending_audit`.
- Modo: `pre_publication` o `post_publication`.

La combinación de estos estados debe seguir centralizada; duplicarla en UI y acciones incrementa el riesgo de transiciones inválidas.

## 8. Sitios

Los sitios representan lugares independientes del usuario:

- nombre, descripción y categoría;
- ubicación y coordenadas;
- medios y portada;
- horario;
- redes y web;
- cierre temporal;
- autor y analíticas;
- publicación y moderación.

Un evento puede vincularse con uno o varios sitios. La identidad del creador no debe convertirse en una ficha de negocio.

## 9. Perfil y trayectoria

El perfil contiene:

- nombre y `@username`;
- avatar y banner;
- participación, plan y verificación;
- bio, sitio web y redes sociales;
- estadísticas e insignias;
- visibilidad pública/privada;
- timeline “Tu trayectoria”.

La trayectoria actual agrupa actividad por día calendario de Bogotá y mezcla actividad con contenido relacionado:

- like de evento;
- evento aportado;
- sitio aportado;
- insignia obtenida.

El orden depende del timestamp de la acción del usuario, no de la fecha futura del evento.

## 10. Studio

Studio está protegido en servidor y requiere `plan === "premium"`. Incluye superficies para:

- resumen y KPIs;
- eventos y sesiones;
- registros y asistencia;
- sitios y eventos vinculados;
- colaboradores e invitaciones;
- perfiles externos;
- soporte.

Estado real: partes del dashboard siguen usando fallback/mock y hay TODOs en analíticas. No debe venderse como analítica completa hasta retirar esos datos sintéticos y validar resultados contra Firestore.

## 11. Colaboradores

La implementación vigente restringe búsqueda, invitación y perfiles externos por **plan Premium**, no por `accountType/professional`.

Tipos:

- usuario existente con invitación;
- perfil externo sin login, administrado por quien lo creó.

Roles:

- `editor`;
- `viewer`;
- `credit`.

La información visible se denormaliza en el evento para evitar joins. Deuda aceptada: cambios de nombre/avatar no se sincronizan automáticamente.

`docs/COLLABORATORS.md` conserva la decisión histórica basada en “cuenta profesional”; esa condición ya no es válida.

## 12. Descubrimiento, campañas y personalización

- Home presenta campañas, búsqueda, categorías, eventos y sitios.
- `/explorar` combina descubrimiento de eventos y sitios.
- Las interacciones alimentan preferencias por categoría.
- Existen campañas programadas con prioridad, CTA y analíticas.
- Existen colecciones/landings SEO para eventos y sitios.
- El sitemap todavía no incluye cada evento y sitio dinámico.

## 13. Insignias y reputación

- Las insignias pueden ser de sistema, logro o hito.
- Se asignan al usuario y aparecen en perfil/trayectoria.
- Hay seeds y scripts para insignias, pero no un panel administrativo completo.

## 14. Funcionalidad implementada, parcial y fuera de alcance

| Área | Estado | Observación |
|---|---|---|
| Auth email/Google | Implementada | Falta cobertura E2E y operación documentada. |
| Descubrimiento | Implementado | Requiere QA de relevancia, rendimiento y SEO. |
| Eventos estándar | Implementado | Falta endurecer pruebas y permisos. |
| Eventos multifecha | Parcial avanzado | Premium; analíticas y algunos flujos necesitan cierre. |
| Sitios | Implementado/parcial | Migración visual avanzada; aún hay mock temporal y deuda de QA. |
| Perfil/trayectoria | Implementado | Cambios recientes todavía locales. |
| Membresía | Catálogo/contacto | Sin precio, cobro ni alta automática. |
| Studio | Parcial | Mezcla datos reales y fallback/mock. |
| Colaboradores | Parcial | Flujo base existe; sincronización y atribución quedan pendientes. |
| Moderación | Backend parcial | Falta backoffice y operación integral. |
| Pagos | Fuera de alcance actual | Eventos pagados usan registro externo. |
| Red social | Fuera de alcance | No muro, comentarios, seguidores ni feed social tradicional. |

## 15. Decisiones de producto que faltan

Estas decisiones requieren dueño y fecha; no se resuelven solo con código:

1. Precio, impuestos, contrato y proceso de alta/cancelación de Premium.
2. Criterios y proceso de verificación de creadores.
3. Quién modera, tiempos de respuesta y canales de apelación.
4. Alcance exacto del MVP: qué módulos deben ser reales y cuáles se retiran si siguen en mock.
5. Política de privacidad, retención y eliminación de datos.
6. Política de contenido, términos, tratamiento de menores y eventos sensibles.
7. Soporte: canal, SLA y ownership de tickets.
8. Campañas patrocinadas: modelo comercial, etiquetado y métricas.
9. Métricas norte del producto y eventos analíticos obligatorios.
10. Expansión geográfica: mantener Ibagué o diseñar multi-ciudad.

## 16. Principios de alcance para terminar

- Terminar antes de ampliar.
- No crear nuevos tipos de cuenta.
- No construir pagos hasta definir operación comercial y legal.
- No presentar datos mock como analítica real.
- No añadir otra capa visual paralela si ya existe un componente compartido.
- Toda capacidad Premium debe validarse en servidor; ocultarla en UI no es autorización.
- Todo flujo crítico debe tener una prueba automatizada y un runbook operativo.