# Administración y logística

## 1. Problema operativo actual

El repositorio contiene gran parte del producto, pero faltan definiciones organizativas que ningún cambio de código puede resolver solo:

- propietarios de servicios y cuentas;
- quién aprueba producto/diseño/seguridad;
- quién modera y soporta usuarios;
- cómo se promueve entre ambientes;
- quién responde incidentes y costos;
- qué obligaciones legales aplican.

Todos los owners listados abajo están **por asignar** hasta que el equipo los complete.

## 2. Matriz de ownership mínima

| Área | Responsable requerido | Responsabilidades |
|---|---|---|
| Producto | Product owner | Alcance, prioridades, aceptación, pricing Premium. |
| Tecnología | Tech lead | Arquitectura, calidad, deuda y releases. |
| Frontend/diseño | Design/FE owner | Sistema visual, responsive, accesibilidad. |
| Backend/datos | Backend owner | Firebase, reglas, migraciones, consistencia. |
| DevOps | Platform owner | App Hosting, CI/CD, secretos, alertas, rollback. |
| Seguridad/privacidad | Security/DPO | Riesgos, incidentes, retención, derechos del usuario. |
| Moderación | Operations owner | Revisión de contenido y creadores. |
| Soporte | Support owner | Tickets, SLA, escalamiento. |
| Finanzas | Finance owner | Presupuesto cloud y Premium. |
| Legal | Legal owner | Términos, privacidad, contenido, contratos. |

Una persona puede cubrir varios roles en un equipo pequeño, pero el nombre y suplente deben quedar escritos.

## 3. Cuentas y accesos a inventariar

No guardar credenciales aquí. Registrar owner, suplente, MFA y fecha de revisión para:

- organización/repositorio GitHub;
- Firebase `quehaypahacer-develop`;
- Firebase `quehaypahacer-prod`;
- Google Cloud Billing;
- service accounts;
- App Hosting;
- Firestore/Storage;
- Redis/Upstash;
- proveedor de dominio/DNS;
- Google OAuth/Identity Platform;
- analítica y monitoreo;
- correo/soporte;
- redes sociales de la marca.

Principios:

- cuentas corporativas, no personales;
- MFA obligatorio;
- mínimo privilegio;
- dos administradores de respaldo;
- revisión trimestral;
- revocación inmediata al salir del equipo;
- secretos en Secret Manager/App Hosting, nunca en chat o Git.

## 4. Ambientes

### Local

- `.env.local` no versionado.
- Idealmente emuladores Firebase.
- Datos sintéticos, nunca copia indiscriminada de producción.

### Development

- Firebase project develop.
- URL App Hosting dev.
- Puede usar seeds y backfills controlados.
- Debe tener Redis y buckets separados de producción.

### Producción

- Firebase project prod.
- Datos reales y acceso restringido.
- Sin endpoints seed/debug.
- Cambios solo por pipeline/aprobación.

Pendiente: crear matriz completa variable/secret/recurso por ambiente y confirmar que Redis no se comparte.

## 5. Flujo Git y release recomendado

- `develop`: integración continua del próximo release.
- ramas feature/fix cortas desde `develop`.
- PR obligatoria con revisión y gates.
- rama estable (`main` o la vinculada a producción) protegida.
- promoción explícita de dev a prod.
- tag semántico y release notes por producción.
- hotfix desde rama estable, luego merge-back.

Actualmente no hay tags ni workflows. Debe confirmarse qué rama despliega cada backend antes de seguir.

## 6. Contenido y moderación

Se necesita operación diaria para:

- revisar eventos pre-publicación;
- auditar contenido de creadores verificados;
- revisar sitios;
- verificar creadores;
- gestionar reportes/retiros;
- responder apelaciones;
- retirar contenido ilegal, fraudulento o vencido;
- mantener categorías/campañas.

Definir:

- horarios y SLA;
- criterios objetivos;
- estados y mensajes al usuario;
- escalamiento legal/seguridad;
- bitácora de decisión;
- doble revisión para casos sensibles.

## 7. Soporte

Studio incluye tickets, pero la operación debe definir:

- canal oficial;
- quién recibe notificaciones;
- SLA por severidad;
- categorías;
- horario;
- plantillas de respuesta;
- escalamiento técnico;
- cierre y satisfacción;
- tratamiento de PII en tickets.

“Soporte prioritario” Premium está marcado como próximo; no debe prometerse hasta tener capacidad y SLA.

## 8. Premium y administración comercial

Estado actual: precio por definir y contacto manual.

Antes de vender:

- precio e impuestos;
- duración del plan;
- alta, renovación, cancelación y reembolso;
- medio de pago/facturación;
- contrato/aceptación;
- quién cambia el claim/campo `plan`;
- auditoría de cambios;
- periodo de prueba;
- soporte y límites;
- política ante impago;
- conciliación entre venta y Firebase.

Mientras no exista esto, Premium debe manejarse como acceso piloto administrado y trazable.

## 9. Legal y privacidad

Requiere revisión profesional local. Como mínimo:

- términos de uso;
- política de privacidad y tratamiento de datos;
- consentimiento de marketing;
- cookies/analítica;
- política de contenido/moderación;
- propiedad/licencia de imágenes y textos;
- tratamiento de ubicación y teléfono;
- derechos de acceso, corrección y eliminación;
- retención y backup;
- menores de edad y eventos sensibles;
- encargados de tratamiento (Google/Firebase, Upstash, etc.);
- canal de contacto legal.

No se encontró documentación legal completa en el repo.

## 10. Gestión de datos

Definir por colección:

- propietario;
- finalidad;
- datos personales;
- retención;
- backup;
- exportación;
- eliminación;
- acceso humano;
- auditoría.

Casos prioritarios:

- usuarios y usernames;
- registros/respuestas de formularios;
- tickets de soporte;
- contactos;
- analíticas/interacciones;
- perfiles externos;
- medios públicos/privados.

## 11. Gestión de cambios de datos

Cada script/backfill debe tener ficha:

- problema;
- ambiente permitido;
- autor/aprobador;
- precondiciones;
- dry-run;
- número esperado de documentos;
- idempotencia;
- backup;
- rollback/compensación;
- resultado y timestamp.

Crear una colección o registro de migraciones ejecutadas. No depender de memoria o logs locales.

## 12. Costos y presupuesto

Asignar presupuesto mensual y alertas para:

- Firebase/App Hosting;
- Firestore;
- Storage/egress;
- Redis;
- logs/monitoring;
- dominio/correo;
- servicios futuros de pagos/notificaciones.

Revisión semanal durante lanzamiento y mensual después. Definir umbrales de advertencia y corte.

## 13. Incidentes

Severidades sugeridas:

- SEV-1: caída, fuga de datos, auth comprometida, corrupción masiva.
- SEV-2: publicación/registro/uploads rotos, datos incorrectos amplios.
- SEV-3: degradación parcial o bug con workaround.

El runbook debe incluir:

- canal de incidente;
- incident commander;
- comunicación interna/usuarios;
- rollback/feature disable;
- preservación de evidencia;
- postmortem sin culpa;
- acciones con owner y fecha.

## 14. Documentación y decisiones

Adoptar ADRs para decisiones irreversibles o costosas:

- modelo consumer/creator + basic/premium;
- Firebase y base nombrada;
- App Hosting;
- estrategia Redis;
- denormalización;
- eventos multifecha;
- perfiles externos;
- pagos externos;
- alcance geográfico.

## 15. Onboarding técnico

Un nuevo integrante debe poder encontrar:

1. propósito y alcance;
2. setup local sin secretos compartidos por chat;
3. arquitectura y rutas;
4. modelo de datos;
5. comandos de calidad;
6. cómo crear datos de prueba;
7. cómo desplegar/rollback;
8. cómo reportar incidentes;
9. convenciones de código/PR;
10. owners por área.

El README raíz debe reemplazarse por un resumen y links a estos documentos.

## 16. Cadencia sugerida hasta lanzamiento

- Daily técnico corto sobre bloqueos P0.
- Revisión de producto dos veces por semana.
- Demo semanal con ambiente dev.
- Revisión de riesgos/costos semanal.
- Go/no-go formal antes de producción.
- Postmortem de lanzamiento y backlog de estabilización.

## 17. Checklist administrativo de salida

- [ ] Owners y suplentes asignados.
- [ ] Accesos/MFA auditados.
- [ ] Ambientes y rama de despliegue confirmados.
- [ ] Presupuesto y alertas activos.
- [ ] Términos/privacidad aprobados.
- [ ] Moderación y soporte operables.
- [ ] Plan Premium definido o marcado como piloto.
- [ ] Backup/restore/rollback probados.
- [ ] Runbook de incidentes publicado.
- [ ] Release/tag/changelog creados.