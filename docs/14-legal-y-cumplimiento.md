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
| Datos del responsable (nombre, correo, teléfono) | `LEGAL_ENTITY` en `app/components/layout/shared/LegalDocument.tsx` |
| Aceptación probada al registrarse (términos + mayoría de edad, y autorización de datos en casilla aparte); el servidor la exige | `RegisterForm.tsx`, `register.action.ts`; se guarda `acceptedTerms`, `acceptedTermsAt`, `acceptedTermsVersion` |
| Aceptación con Google: la cuenta nueva **no se crea** hasta aceptar | `google-auth.action.ts`, `GoogleAuthButton.tsx` |
| Declaración del autor al publicar (derechos, permisos, veracidad, responsabilidad); el servidor la exige y guarda la evidencia | `AuthorDeclaration.tsx`, `publish-event.action.ts`, `publish-site.action.ts`, `update-site.action.ts`; colección `contentDeclarations/{tipo}_{id}` |
| Reportar contenido con motivos y detalle; un reporte por persona y objetivo | `ReportButton.tsx`, colección `reports`; `scripts/list-reports.ts` |
| Plan de datos: transmisión a Google (EE. UU.) autorizada expresamente; conservación de evidencia | `/privacidad` |

Las colecciones `reports`, `contentDeclarations` y `planChanges` no son accesibles desde el cliente (las reglas niegan todo por defecto; solo escribe el Admin SDK).

## Pendientes y decisiones

1. **Registro de oferentes (art. 53) ⛔.** Hoy no se guarda documento ni dirección de los organizadores. Propuesta: pedirlos (privados, solo para atender quejas y autoridades) a quien publique eventos con venta de entradas o un enlace de compra. Es una decisión de producto y de privacidad: más datos, más obligaciones de custodia.
2. **Reaceptación al cambiar los términos.** Los textos prometen pedir aceptación nueva en cambios importantes; falta el mecanismo (comparar `acceptedTermsVersion` con `LEGAL_VERSION` y bloquear hasta aceptar). Los usuarios anteriores a este cambio no tienen versión guardada.
3. **Editar una sesión de un evento ya publicado** no pide una declaración nueva (la declaración se pide al publicar o republicar el evento).
4. **Contenido ya publicado** antes de este cambio no tiene declaración registrada.
5. **Moderación operativa:** no hay panel para atender reportes (se usa el script), ni plazos internos definidos para aviso y retiro.
6. **Constituir una S.A.S.** antes de cobrar o de crecer: separa el patrimonio personal del de la plataforma. Consulta con un contador (RUT, facturación electrónica) y con la Cámara de Comercio de Ibagué.
7. **Datos del responsable:** completar `owner`, `email` y `phone` en `LEGAL_ENTITY` con un correo dedicado (p. ej. `legal@<dominio>`).
8. **Revisión por un abogado** de ambos textos, de la cláusula de indemnidad y del tope de responsabilidad (puede chocar con las reglas de cláusulas abusivas del Estatuto del Consumidor si el usuario es consumidor).
9. **Formularios personalizados (Premium):** el organizador puede pedir datos sensibles; los términos se lo prohíben salvo autorización expresa, pero la plataforma no lo valida.
