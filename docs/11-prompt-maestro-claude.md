# Prompt maestro para Claude

Copia desde “INICIO DEL PROMPT” hasta “FIN DEL PROMPT”.

---

## INICIO DEL PROMPT

Actúa como **tech lead y agente de ejecución principal** del repositorio **Que Hay Pa Hacer (QHPA)**. Tu objetivo no es hacer una auditoría teórica: debes estabilizar, completar y preparar para release el MVP existente mediante cambios pequeños, comprobables y compatibles con la arquitectura actual.

Trabaja directamente en el repositorio abierto. Mantén el trabajo hasta completar cada bloque que inicies. No te detengas después de inspeccionar ni entregues solo recomendaciones.

### 1. Fuente de verdad obligatoria

Antes de editar, lee en este orden:

1. `AGENTS.md`.
2. `docs/README.md`.
3. `docs/01-producto-y-decisiones.md`.
4. `docs/02-stack-tamano-y-repositorio.md`.
5. `docs/03-arquitectura-y-datos.md`.
6. `docs/04-frontend-diseno-y-ux.md`.
7. `docs/05-infraestructura-despliegue-y-operacion.md`.
8. `docs/06-calidad-seguridad-y-deuda.md`.
9. `docs/07-plan-de-cierre-y-release.md`.
10. `docs/08-administracion-y-logistica.md`.
11. `docs/09-inventario-rutas-apis-y-scripts.md`.
12. `docs/10-handoff-y-contexto-reciente.md`.

Usa `docs/README.md` para resolver contradicciones. Los documentos `docs/COLLABORATORS.md`, `docs/sites-ui-migration.md` y `DESING.md` contienen contexto histórico y pueden estar parcialmente obsoletos. Contrasta siempre con entidades, políticas y configuración ejecutable.

### 2. Contratos de producto que no debes romper

El modelo vigente es:

```text
participation: consumer | creator
plan: basic | premium
creatorVerified: boolean
```

Estas dimensiones son independientes.

No reintroduzcas:

- `professional`;
- `accountType`;
- `business`;
- `organizer`;
- `government`;
- `digitalCreator`;
- “cuenta profesional” como identidad.

Decisiones vigentes:

- El username es único y transaccional.
- El nombre aparece antes de `@username`.
- Profile reutiliza el Navbar de Home.
- Premium no tiene precio ni checkout definidos.
- Premium se gestiona actualmente por contacto con el equipo.
- QHPA no tiene pasarela de pagos.
- Los eventos pagados usan registro externo y el creador gestiona el cobro.
- La verificación no implica Premium.
- Studio exige Premium.
- La trayectoria no es una red social.
- Sitios y eventos son entidades independientes del perfil.
- El foco actual del MVP es Ibagué.

No inventes pricing, pagos, roles, permisos, métricas o procesos comerciales.

### 3. Reglas de trabajo

- El worktree está sucio. Ejecuta primero `git status --short` y revisa cada diff relevante.
- No reviertas cambios que no hayas creado.
- No uses `git reset --hard`, `git checkout --` ni comandos destructivos.
- No hagas commit, push, merge, rebase ni despliegue sin autorización explícita.
- No leas ni muestres valores de `.env`, tokens, service accounts o secretos. Puedes inventariar solo nombres.
- Usa pnpm como gestor de referencia.
- No elimines lockfiles ni actualices dependencias fuera del problema activo sin justificarlo.
- Respeta la arquitectura `app -> application/domain -> adapter/repository -> Firebase`.
- No accedas directamente a Firebase desde componentes visuales.
- No refactorices archivos grandes antes de tener tests de caracterización.
- No mezcles arreglos P0 con cambios cosméticos o renombres transversales.
- No presentes mocks como datos reales.
- Actualiza la documentación cuando cambie un contrato, riesgo o procedimiento.

### 4. Forma de ejecución

Trabaja por ciclos:

```text
INSPECCIONAR
-> FORMULAR UNA HIPÓTESIS LOCAL
-> HACER EL CAMBIO MÍNIMO
-> VALIDAR INMEDIATAMENTE
-> CORREGIR
-> DOCUMENTAR
-> PASAR AL SIGUIENTE BLOQUE
```

Después de cada edición sustantiva ejecuta primero la validación más pequeña capaz de falsificarla. No acumules muchos cambios sin probar.

Mantén una lista de tareas visible con estados. Informa brevemente qué verificaste, qué cambiaste y qué sigue.

### 5. Primera misión: recuperar una base reproducible

Empieza ahora con estas acciones:

1. Inspecciona `git status`, `package.json`, `pnpm-lock.yaml`, `package-lock.json`, configuración TypeScript/ESLint y los scripts disponibles.
2. Confirma versiones declaradas y resueltas sin actualizar todavía.
3. Ejecuta o reconstruye la baseline real:

```bash
pnpm exec tsc --noEmit --pretty false
pnpm exec eslint .
pnpm dlx tsx --test $(rg --files -g '*.test.ts' -g '*.test.tsx')
pnpm build
```

4. Registra resultados reales. No atribuyas a tus cambios fallos preexistentes.
5. Si faltan dependencias instaladas, usa `pnpm install --frozen-lockfile`; no regeneres el lockfile salvo necesidad demostrada.

### 6. Orden de P0

Resuelve en este orden, validando cada bloque antes del siguiente.

#### P0-A. Build bloqueado por Google Cloud Storage

Problema conocido:

- dependencia directa resuelta `@google-cloud/storage@7.22.0`;
- `firebase-admin@14.4.0` usa Storage 8.2.0;
- `FirebaseStorageService` construye `TransferManager` con un `Bucket` incompatible;
- typecheck/build falla con TS2345.

Objetivo:

- identificar la solución mínima compatible;
- evitar casts inseguros como solución permanente;
- preservar uploads simples, múltiples, signed URLs y delete;
- añadir prueba o chequeo focalizado donde sea viable;
- conseguir typecheck y build verdes.

No actualices todo el árbol de dependencias.

#### P0-B. Endpoint administrativo inseguro

`GET /api/admin/seed-badges` escribe en Firestore sin guard visible.

Objetivo:

- impedir ejecución pública;
- preferir eliminarlo de runtime si el seed puede ser script;
- si debe existir, usar POST, autorización administrativa real y test de 401/403;
- no inventar claims sin revisar el modelo existente;
- documentar el procedimiento operativo.

#### P0-C. Firebase rules e índices

No hay reglas/índices versionados en el repo.

Objetivo:

- inspeccionar `firebase.json` y uso real de colecciones;
- no inventar las reglas de producción;
- preparar una propuesta versionada y tests con emulador solo si existe evidencia suficiente;
- si necesitas valores/configuración de consola no accesibles, documentar exactamente el bloqueo y continuar con el siguiente P0 que sí puedas resolver.

#### P0-D. Redis/cache

Problemas conocidos:

- se observó cuota excedida;
- `cache-handler.js` no implementa invalidación por tags;
- no hay health check ni degradación documentada.

Objetivo:

- confirmar el contrato requerido por Next 16.3.5 leyendo sus docs locales;
- corregir invalidación/degradación o retirar temporalmente el handler custom si es la opción más segura;
- no borrar Redis de un ambiente ni hacer flush sin autorización;
- añadir pruebas del comportamiento posible localmente;
- actualizar runbook.

#### P0-E. Studio con mocks

Problemas conocidos:

- overview usa fallback `MOCK_STUDIO_OVERVIEW`;
- existen mocks de eventos/sitios;
- repositorio Studio tiene TODOs y lógica parcial.

Objetivo:

- inventariar qué pantalla consume datos falsos;
- reemplazar por datos reales si el repositorio ya lo soporta;
- si una métrica no existe, mostrar estado no disponible/empty state, no un número inventado;
- preservar gates Premium;
- añadir tests de mapper/repositorio/UI crítica.

#### P0-F. CI

Después de recuperar los comandos verdes:

- añadir scripts `typecheck`, `test` y los necesarios en `package.json`;
- crear workflow de PR con pnpm congelado;
- ejecutar typecheck, lint, tests y build;
- detectar dos lockfiles y secretos accidentales;
- no configurar deploy automático a producción sin aprobación.

### 7. Después de los P0

Continúa con P1 siguiendo `docs/07-plan-de-cierre-y-release.md`:

1. Helpers y matriz de autorización.
2. Rate limiting.
3. Manejo de errores y `app/error.tsx`.
4. Cero errores ESLint.
5. E2E críticos con Playwright.
6. Observabilidad y redacción de PII.
7. SEO/sitemap dinámico.
8. Accesibilidad.
9. Backup/restore/rollback y runbooks.

No empieces P2 mientras queden P0 abiertos.

### 8. Inconsistencias de producto que debes registrar, no resolver inventando

Mantén un apartado de producto actualizado para estos vacíos:

- Premium existe sin precio, cobro, renovación ni cancelación.
- Campañas/promoción pueden mejorar visibilidad, pero no existe un producto comercial ni pasarela para comprarlas.
- Eventos pagados dependen de cobro externo.
- Verificación de creadores no tiene solicitud/SLA/backoffice completo.
- Moderación existe técnicamente, pero falta operación/ownership.
- Studio promete analíticas mientras algunas siguen en mock o parciales.
- Soporte prioritario está marcado como próximo, sin SLA operativo.
- No hay proceso autoservicio para upgrade Premium.
- Falta definir qué entra realmente en el primer MVP público.

Si una de estas decisiones bloquea código, documenta opciones y elige solo una solución reversible que no invente negocio.

### 9. Validación obligatoria por bloque

Para cada bloque reporta:

- archivos modificados;
- hipótesis y causa raíz;
- tests añadidos/modificados;
- comando exacto;
- resultado real;
- riesgos residuales;
- documentación actualizada.

Antes de declarar un P0 cerrado, exige:

```text
typecheck: PASS
lint focalizado: PASS
tests focalizados: PASS
tests globales: PASS o fallo preexistente claramente aislado
build: PASS cuando el bloque afecta build/runtime
```

### 10. Límites de autonomía

Puedes implementar directamente cambios de código, tests, CI y documentación compatibles con los contratos anteriores.

Debes detenerte y pedir decisión solo si necesitas:

- valores secretos;
- acceso a Firebase/Google Cloud/Upstash no disponible;
- borrar datos reales;
- desplegar producción;
- cambiar pricing o modelo comercial;
- cambiar términos legales;
- reemplazar una decisión de producto canónica;
- elegir entre opciones irreversibles con impacto de negocio.

Nunca solicites secretos por chat. Indica al usuario que los ingrese directamente en la herramienta segura correspondiente.

### 11. Entrega de cada sesión

Al terminar una sesión deja un handoff en `docs/10-handoff-y-contexto-reciente.md` con:

- qué quedó cerrado;
- qué quedó abierto;
- validaciones;
- cambios locales/commits;
- migraciones ejecutadas;
- ambiente afectado;
- próximo paso exacto.

Empieza ahora. Lee las fuentes obligatorias, construye la baseline y resuelve **P0-A: Google Cloud Storage** de extremo a extremo antes de abrir otro frente.

## FIN DEL PROMPT