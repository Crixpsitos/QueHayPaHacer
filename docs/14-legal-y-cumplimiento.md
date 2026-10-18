# Marco legal y cumplimiento (Colombia)

> **No es asesoría legal.** Lo escribió un asistente de IA a partir de las normas que se pudieron consultar el 2026-10-11. Úsalo como mapa y llévalo a un abogado antes del lanzamiento. Lo que no se pudo verificar está marcado ⚠️.

## Postura de la plataforma

QHPA es una plataforma tecnológica abierta: su propietario provee el software y el servicio; **cada autor responde por lo que publica** (eventos, sitios, imágenes, música). QHPA es **intermediario**: no organiza, no vende entradas, no es parte del contrato entre organizador y asistente, y no tiene obligación general de vigilar. Aplica moderación con diligencia razonable.

Limitación honesta: un contrato (los términos) **solo obliga a quien lo acepta**. No puede quitarle a un tercero (titular de derechos, asistente, autoridad) su derecho a reclamar. Lo que reduce el riesgo es: términos claros + aceptación probada + canal de avisos + retirar rápido + cooperar con autoridades + (cuando se cobre) una persona jurídica.

## Normas relevantes

| Tema | Norma | Qué implica para QHPA | Estado |
| --- | --- | --- | --- |
| Datos personales | Ley 1581 de 2012; Decreto 1377 de 2013 (compilado en el Decreto 1074 de 2015) | Autorización previa, expresa e informada y demostrable; identificar al responsable y su contacto; derechos del titular; consultas 10 días hábiles, reclamos 15 | ✅ implementado (ver mecanismos) |
| Excepciones a la autorización | Ley 1581, art. 10 | No se necesita autorización para información que pide una autoridad en ejercicio de sus funciones o por orden judicial | ⚠️ de memoria, no verificado en el texto |
| Autorización separada de los términos | Criterio de la SIC / Decreto 1377 | La autorización de datos no debe ir enterrada en la aceptación genérica de T&C | ⚠️ de memoria; implementado como casilla aparte |
| Registro de bases de datos (RNBD) | Decreto 090 de 2018 | Obliga a sociedades con activos > 100.000 UVT y a entidades públicas; **excluye personas naturales** | ✔️ verificado en fuentes; se reevalúa al constituir empresa |
| Portales de contacto | Ley 1480 de 2011 (Estatuto del Consumidor), art. 53 | Quien administre una plataforma que pone en contacto oferentes y consumidores debe exigir a los oferentes datos de identificación (nombre o razón social, documento, dirección, teléfonos), llevar un registro, permitir que el comprador lo consulte para quejas y entregarlo a la autoridad | ✔️ verificado; **⛔ no implementado** (ver pendientes) |
| Retracto en ventas a distancia | Ley 1480, art. 47 y ss.; Decreto 587 de 2016 | Aplica al cobrar Premium a consumidores | ⚠️ revisar con abogado |
| Explotación sexual de menores | Ley 679 de 2001, arts. 7 y 8; Decreto 1524 de 2002 | Prohíbe alojar ese material; obliga a denunciar y a bloquear; el decreto pide enlaces visibles de denuncia | ✔️ verificado; enlace "Denunciar abuso infantil" en el footer y en los términos |
| Espectáculos públicos y aglomeraciones | Ley 1493 de 2011; Ley 1801 de 2016; Decreto 1276 de 2020 | Permisos, seguros y responsabilidades son del **organizador** | ✔️ verificado a grandes rasgos; los términos se las trasladan |
| Responsabilidad de intermediarios por derechos de autor | Ley 23 de 1982; Decisión Andina 351; Ley 1915 de 2018 | ⚠️ **No se pudo confirmar** un régimen de "puerto seguro" vigente en Colombia. Se asume que **no hay inmunidad automática**: la protección práctica es el aviso y retiro | ⚠️ pendiente de abogado |

## Mecanismos implementados

| Mecanismo | Dónde |
| --- | --- |
| Textos legales con rol de intermediario, responsabilidad del autor, moderación, aviso y retiro, uso de datos para gestionar incumplimientos, límites de responsabilidad | `app/(home)/terminos/page.tsx`, `app/(home)/privacidad/page.tsx` |
| Versión única de los textos | `app/lib/legal/version.ts` (`LEGAL_VERSION`); **súbela cada vez que cambien los textos** |
| Datos del responsable (nombre, correo, teléfono) | `LEGAL_ENTITY` en `app/components/layout/shared/LegalDocument.tsx` (nombre y `quehaypahacer6@gmail.com`; el teléfono es opcional) |
| Aceptación probada al registrarse (términos + mayoría de edad, y autorización de datos en casilla aparte); el servidor la exige | `RegisterForm.tsx`, `register.action.ts`; se guarda `acceptedTerms`, `acceptedTermsAt`, `acceptedTermsVersion` |
| Aceptación con Google: la cuenta nueva **no se crea** hasta aceptar | `google-auth.action.ts`, `GoogleAuthButton.tsx` |
| Declaración del autor al publicar (derechos, permisos, veracidad, responsabilidad); el servidor la exige y guarda la evidencia | `AuthorDeclaration.tsx`, `publish-event.action.ts`, `publish-site.action.ts`, `update-site.action.ts`; colección `contentDeclarations/{tipo}_{id}` |
| Reportar contenido con motivos y detalle; un reporte por persona y objetivo | `ReportButton.tsx`, colección `reports`; `scripts/list-reports.ts` |
| Aviso por correo cuando entra un reporte | Cloud Function `notifyNewReport` (repo `functions`) deja el log `alert=qhpa_new_report`; una alerta de Cloud Monitoring lo envía por correo (máx. uno cada 5 min). Se crea con `scripts/setup-report-alert.sh <proyecto> <correo>` (ver abajo) |
| Plan de datos: transmisión a Google (EE. UU.) autorizada expresamente; conservación de evidencia | `/privacidad` |

Las colecciones `reports`, `contentDeclarations` y `planChanges` no son accesibles desde el cliente (las reglas niegan todo por defecto; solo escribe el Admin SDK).

## Decisiones del propietario (2026-10-11) y riesgo que queda

| Tema | Decisión | Por qué / riesgo residual |
| --- | --- | --- |
| Identificación del responsable | Se muestran el nombre completo y el correo del proyecto (`quehaypahacer6@gmail.com`) directamente en `LEGAL_ENTITY`; sin cédula ni teléfono. | La política debe identificar al responsable y su contacto (Ley 1581 y su decreto). Ante una autoridad no se puede ocultar la identidad: la cuenta de Google Cloud, Play Console y la cuenta que recibe los pagos de Premium están a nombre del propietario. Revisa ese correo a diario: llegan los avisos de retiro y los reclamos. |
| S.A.S. | No es posible por ahora. | Sin persona jurídica el patrimonio personal queda expuesto. Mitigaciones: textos, declaración al publicar, aviso y retiro rápido; y, mientras no se pueda constituir empresa, **no cobrar Premium** (la transferencia o Nequi identifica a quien cobra). |
| Registro de organizadores (Ley 1480, art. 53) | **No se implementa ahora.** | QHPA no vende ni cobra entradas: redirige a terceros. El art. 53 habla de plataformas que *ponen en contacto* oferentes y consumidores, aunque la venta ocurra fuera, así que **no se puede descartar** que aplique a eventos con precio o enlace de compra. Se asume el riesgo por el bajo volumen. Alternativa mínima si se quiere cubrir: exigir teléfono verificado y la declaración al publicar eventos con precio o enlace externo (ya se tiene nombre y correo del registro). Reevaluar al crecer o al cobrar. |
| Usuarios y contenido anteriores | Sin acción. | Son datos de develop (pruebas). |
| Panel de moderación | Más adelante. | Mientras tanto: botón **Reportar**, el aviso por correo y `scripts/list-reports.ts` (`--resolve <id> --apply`). |

## Pendientes

1. **Reaceptación al cambiar los términos.** Los textos prometen pedir aceptación nueva en cambios importantes; falta el mecanismo (comparar `acceptedTermsVersion` con `LEGAL_VERSION` y bloquear hasta aceptar).
2. **Editar una sesión de un evento ya publicado** no pide una declaración nueva (se pide al publicar o republicar el evento).
3. **Plazos internos** para atender avisos de retiro (hoy "lo antes posible"). Con el aviso por correo, revisa tu bandeja a diario.
4. **Definir las variables `LEGAL_*`** antes del lanzamiento (ver arriba) y, si se cobra, el RUT y la facturación con un contador.
5. **Revisión por un abogado** de ambos textos, de la cláusula de indemnidad y del tope de responsabilidad (puede chocar con las reglas de cláusulas abusivas del Estatuto del Consumidor si el usuario es consumidor).
6. **Formularios personalizados (Premium):** el organizador puede pedir datos sensibles; los términos se lo prohíben salvo autorización expresa, pero la plataforma no lo valida.

## Aviso de reportes: cómo se configura

1. Desplegar la function (desde la carpeta que contiene `firebase.json`): `npx firebase-tools deploy --only functions:notifyNewReport --project <proyecto>`.
2. Crear el canal y la alerta (una vez por proyecto): `scripts/setup-report-alert.sh <proyecto> <correo>`. Es idempotente: si ya existen, no hace nada.
3. Probar sin crear un reporte real: `gcloud logging write qhpa-alert-test '{"alert":"qhpa_new_report","message":"prueba"}' --payload-type=json --severity=WARNING --project <proyecto>`; debe llegar un correo en unos minutos.
4. Repetir 1 y 2 en `quehaypahacer-prod` cuando tenga facturación. Si el correo no llega, revisa spam y que el canal figure como verificado en Cloud Monitoring → Alerting → Edit notification channels.
