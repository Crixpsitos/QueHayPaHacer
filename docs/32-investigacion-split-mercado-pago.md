# 32. Investigación: cobrar con comisión (split) en Colombia con Mercado Pago

Fecha de la investigación: 2026-11-10. Solo investigación, sin código. **Esto NO es asesoría legal ni tributaria; todo lo de la sección 6 debe validarlo un contador.**

Convención: cada afirmación lleva enlace a su fuente. "NO VERIFICADO" = no lo encontré en fuente oficial. Varias páginas de la documentación de Mercado Pago (MP) devolvieron 403 al consultarlas de forma automática; en esos casos lo indico y uso la versión de otro país solo como pista.

## Resumen corto

- Split Payments 1:1 **sí está listado para Colombia** ([overview CO](https://www.mercadopago.com.co/developers/en/docs/split-payments/split-1-1/overview)).
- Funciona con OAuth por vendedor; la comisión de QHPA se pone con `marketplace_fee` (Checkout Pro) o `application_fee` (Checkout API). El dinero del vendedor **no pasa por la cuenta de QHPA**: el reparto es automático ([integrar marketplace CO](https://www.mercadopago.com.co/developers/es/docs/checkout-pro-preferences/how-tos/integrate-marketplace)).
- Lo más importante que **no pude confirmar**: si QHPA como persona natural sin empresa puede ser el integrador, y si un vendedor persona natural cumple el "KYC 6" que exige el modelo. Eso se resuelve preguntando a MP (sección 8).

## 1. Disponibilidad en Colombia y requisitos del integrador

| Punto | Hallazgo | Fuente |
|---|---|---|
| País | Colombia aparece entre Argentina, Brasil, Chile, Colombia, México, Perú y Uruguay | [overview CO](https://www.mercadopago.com.co/developers/en/docs/split-payments/split-1-1/overview) |
| Modelo | 1:1 (un vendedor por pago) con Checkout Pro o Checkout API | [prerrequisitos (versión Chile, la de CO dio 403/no se pudo leer en español)](https://www.mercadopago.cl/developers/en/docs/split-payments/split-1-1/prerequisites) |
| Modelo 1:N (varios vendedores por pago) | Requiere contacto comercial de MP; máx. 10 vendedores secundarios | [1:N CO](https://www.mercadopago.com.co/developers/en/docs/split-payments-1-n/overview) |
| El integrador necesita | Credenciales de su aplicación, app Mercado Pago para gestionar pagos recibidos, flujo OAuth con cada vendedor. Fecha de liberación de la comisión del marketplace: se cambia solo vía ejecutivo comercial | [prerrequisitos (Chile)](https://www.mercadopago.cl/developers/en/docs/split-payments/split-1-1/prerequisites) |
| Tipos de cuenta en Colombia | Cuenta personal: cédula. Cuenta empresa: NIT, cédula y ser representante legal | [registro MP CO (según resultado de búsqueda)](https://www.mercadopago.com.co/hub/registration/landing) |
| ¿QHPA persona natural puede ser marketplace? ¿Necesita NIT/RUT? | **NO VERIFICADO.** Ninguna página pública dice que se exija persona jurídica, pero tampoco lo contrario. La página `signup/splitter` devolvió 403. | [signup/splitter](https://www.mercadopago.com.co/signup/splitter) |

Nota: el enlace `signup/splitter` aparece como "Para empezar, elige un tipo de cuenta", es decir, hay un registro específico para integradores; su contenido no pude leerlo.

## 2. Requisitos y límites para el vendedor persona natural

- La documentación pide que el vendedor tenga una cuenta de vendedor MP "con nivel KYC 6" ([prerrequisitos](https://www.mercadopago.cl/developers/en/docs/split-payments/split-1-1/prerequisites); de la versión Chile/otra región, consultada por el overview del repo de búsqueda). **Qué documentos exige el nivel 6 en Colombia: NO VERIFICADO.**
- Cuenta personal en Colombia: se registra con cédula; solo mayores de edad con capacidad legal ([registro](https://www.mercadopago.com.co/hub/registration/landing), [términos](https://www.mercadopago.com.co/c/terminosycondiciones)). MP valida identidad por normativa de conocimiento del cliente y usa biometría ([ayuda](https://www.mercadopago.com.co/ayuda/33106), [privacidad](https://www.mercadopago.com.co/privacidad)).
- Los pagos split usan saldo entre cuentas MP; no se permiten transferencias desde instituciones externas ([integrar marketplace](https://www.mercadopago.com.co/developers/en/docs/split-payments/integration-configuration/integrate-marketplace)).
- Cuenta bancaria para retiro, topes de retiro, topes de cuenta personal: **NO VERIFICADO** (no hallé página oficial). Un artículo patrocinado dice que retirar a cuenta bancaria en Colombia es gratis ([Portafolio, patrocinado](https://www.portafolio.co/contenido-patrocinado/comprar-y-vender-en-linea-nunca-fue-tan-facil-582993)); no es fuente oficial.
- Dato relevante: personas naturales tienen un solo depósito exento de 4x1000 hasta 65 UVT mensuales ([términos MP](https://www.mercadopago.com.co/c/terminosycondiciones)).

## 3. Tarifas, liberación y cálculo del neto

Tarifa oficial de Checkout en Colombia, por plazo de liberación (sin distinción por tarjeta/PSE en esa página; "todos los medios de pago"):

| Liberación | Comisión MP |
|---|---|
| Al instante | 3,29 % + $800 + IVA |
| 7 días | 2,99 % + $800 + IVA |
| 14 días | 2,79 % + $800 + IVA |

Fuente: [Checkout MP Colombia](https://www.mercadopago.com.co/herramientas-para-vender/check-out). La misma página dice "no hay costos fijos", lo que contradice el $800: probablemente se refiere a sin mensualidad, **confirmar con MP**. Tarifas distintas por PSE, efectivo, Nequi, etc.: **NO VERIFICADO** (una guía de Tiendanube cita 2,5 % + $800 + IVA para tarjeta y PSE, pero no es fuente de MP: [Tiendanube](https://ayuda.tiendanube.com/es_CO/122919-informacion/que-costos-tener-en-cuenta-al-integrar-una-pasarela-de-pagos-con-mi-tiendanube)). La ayuda oficial dice que la comisión depende del medio de cobro, del plazo y del medio de pago ([ayuda MP](https://www.mercadopago.com.co/ayuda/costo-recibir-pagos_1774), 403 al leerla, solo extracto de búsqueda).

**Cómo se descuenta la comisión de QHPA:** primero se descuenta la comisión de MP y luego la del marketplace del saldo restante ([integrar marketplace](https://www.mercadopago.com.co/developers/en/docs/split-payments/integration-configuration/integrate-marketplace)). Máximo permitido de `marketplace_fee`: **NO VERIFICADO** (no hay tope en las páginas leídas; solo hay que enviar un valor menor al monto, pero eso es inferencia). Plazo de liberación de la comisión del marketplace: se cambia por ejecutivo comercial ([prerrequisitos](https://www.mercadopago.cl/developers/en/docs/split-payments/split-1-1/prerequisites)).

### Simulación (supuestos propios)

Supuestos: comisión MP = (porcentaje x precio + $800) x 1,19 (IVA 19 % sobre la comisión de MP; supuesto), comisión QHPA = 10 % del precio bruto, sin 4x1000 ni retenciones, valores redondeados al peso.

Liberación inmediata (3,29 % + $800 + IVA):

| Venta | Comisión MP | Comisión QHPA (10 %) | Neto vendedor | Neto vendedor % |
|---|---|---|---|---|
| $15.000 | $1.539 | $1.500 | $11.961 | 79,7 % |
| $30.000 | $2.126 | $3.000 | $24.874 | 82,9 % |
| $100.000 | $4.867 | $10.000 | $85.133 | 85,1 % |

Liberación a 7 días (2,99 % + $800 + IVA):

| Venta | Comisión MP | Comisión QHPA | Neto vendedor |
|---|---|---|---|
| $15.000 | $1.486 | $1.500 | $12.014 |
| $30.000 | $2.019 | $3.000 | $24.981 |
| $100.000 | $4.510 | $10.000 | $85.490 |

Lectura: en ventas chicas el cargo fijo de $800 pesa casi tanto como la comisión de QHPA. Si QHPA absorbiera la comisión de MP en vez del vendedor, **no es lo que documenta MP** (la de MP sale primero del vendedor). Si la comisión de QHPA genera cargos adicionales de MP sobre la parte del marketplace: NO VERIFICADO.

## 4. Reembolsos y contracargos

- Reembolso: el monto se divide y se resta de la cuenta del vendedor y del marketplace en proporción. En 1:1 el marketplace **no puede hacer reembolso total si el vendedor no tiene fondos**: reembolsa solo su parte y el resto es responsabilidad del vendedor por otros medios ([integrar marketplace](https://www.mercadopago.com.co/developers/en/docs/split-payments/integration-configuration/integrate-marketplace)).
- Se requiere saldo suficiente para reembolsar; plazo de 180 días desde la aprobación; durante un contracargo el monto queda retenido en la cuenta del vendedor; resolución hasta 6 meses según la marca; puede haber cobertura por Programa de Protección al Vendedor ([resumen de búsqueda sobre docs MP](https://www.mercadopago.com.ar/developers/en/docs/checkout-pro-preferences/chargebacks/introduction); versión Argentina/Brasil, la de Colombia no la pude leer).
- Quién absorbe un contracargo cuando el dinero ya fue repartido y la comisión de QHPA ya se le acreditó a QHPA: **NO VERIFICADO**. Hay que preguntarlo: es el riesgo principal (QHPA podría tener que devolver su parte).

## 5. Flujo técnico mínimo y arquitectura

Flujo (documentación):
1. Cada vendedor autoriza a QHPA por OAuth (authorization code) y QHPA obtiene su `access_token` y `public_key`; esas credenciales se usan en backend/encabezado ([integrar marketplace](https://www.mercadopago.com.co/developers/es/docs/checkout-pro-preferences/how-tos/integrate-marketplace)).
2. Al crear el cobro, QHPA envía `marketplace_fee` (preferencia de Checkout Pro) o `application_fee` (pago de Checkout API).
3. Renovación: el `access_token` dura **180 días**; se renueva con `refresh_token` (POST `/oauth/token`), cada renovación entrega un **nuevo refresh_token** que hay que guardar; requiere scope `offline_access` autorizado por el vendedor. Si vence, hay que repetir toda la autorización ([renovación CO](https://www.mercadopago.com.co/developers/en/docs/oauth/renewal), [referencia OAuth](https://www.mercadopago.com.co/developers/en/reference/authentication/oauth/_oauth_token/post.md)). Los refresh tokens son de un solo uso y atados al `client_id` ([referencia MX](https://www.mercadopago.com.mx/developers/en/reference/authentication/oauth/_oauth_token/post.md)).
4. Webhooks/IPN para estado de pagos: existen en la documentación; su detalle de firma e idempotencia **no lo pude leer** (NO VERIFICADO para Colombia). Buena práctica propia: tratar cada notificación como "avisar" y volver a consultar el pago por API, y deduplicar por id de pago.
5. Reportes por vendedor y conciliación: ver [overview](https://www.mercadopago.com.co/developers/en/docs/split-payments/split-1-1/overview) (reportes de ventas y de liberaciones; el `external_reference` sirve para conciliar según [1:N](https://www.mercadopago.com.co/developers/en/docs/split-payments-1-n/overview.md)).

Encaje con Firebase/Next.js (sin código), como propuesta:
- Route Handlers de Next.js (servidor) para: callback OAuth, crear preferencia/pago, recibir webhooks y renovar tokens. Nada de esto en el cliente.
- Cloud Function programada (Scheduler) que renueva tokens antes de los 180 días (p. ej. a los ~150) y avisa al vendedor si falla.
- Firestore: documento por vendedor con estado de conexión y fecha de vencimiento; documento por orden con id de pago de MP (clave de idempotencia) y estado. Los tokens van en Secret Manager o en un documento cifrado y **sin lectura desde el cliente** (reglas de Firestore en denegar).
- Reglas del proyecto: este Next.js tiene cambios de API; consultar `node_modules/next/dist/docs/` antes de escribir los handlers.

Qué guardar y qué NO:

| Guardar | NO guardar |
|---|---|
| `user_id` MP del vendedor, `access_token` y `refresh_token` (cifrados, solo servidor), fecha de vencimiento, id de pago, monto, comisión, estado, `external_reference` | Datos de tarjeta (PAN, CVV): los toma el checkout de MP; credenciales del vendedor en MP; el `client_secret` en código o en cliente; documentos de identidad del vendedor más allá de lo estrictamente necesario (el KYC lo hace MP) |

## 6. Impuestos y obligaciones (NO es asesoría; validar con contador)

Lo único que pude respaldar:
- Personas naturales con ingresos brutos anuales de 3.500 UVT o más deben facturar electrónicamente, sean o no responsables de IVA; el tope de responsable de IVA también está en 3.500 UVT (4.000 UVT para contratistas del Estado). En 2026 se citó 3.500 UVT = $183.309.000 ([Gerencie](https://www.gerencie.com/personas-naturales-obligadas-a-facturar-electronicamente.html), [Vanguardia](https://www.vanguardia.com/economia/2025/06/19/quienes-estan-exentos-de-emitir-factura-electronica-en-colombia-esto-dice-la-dian/), [Siempre al Día](https://siemprealdia.co/colombia/impuestos/personas-naturales-obligadas-a-facturar/)). Hay discusión sobre si el tope se mide por ingresos o por consignaciones ([Gerencie](https://www.gerencie.com/personas-naturales-obligadas-a-facturar-electronicamente.html)).
- Sobre si la comisión de QHPA lleva IVA 19 %, retenciones (fuente, ICA), si QHPA debe facturar esa comisión al vendedor, si MP practica retenciones al vendedor, y si hay reglas DIAN específicas para plataformas intermediarias: **NO VERIFICADO**. Son las preguntas para el contador. Además: ¿QHPA debe inscribir RUT con actividad de intermediación?, ¿cambia algo si la comisión supera los topes?

## 7. Alternativas (verificación parcial)

| Opción | Split real sin pasar por QHPA | Persona natural receptora | Estado de verificación |
|---|---|---|---|
| Mercado Pago Split 1:1 | Sí, automático (documentado) | Cuenta personal existe; exigencia KYC 6: por confirmar | Oficial: [overview CO](https://www.mercadopago.com.co/developers/en/docs/split-payments/split-1-1/overview) |
| ePayco "Pagos Divididos" | Centraliza el recaudo y distribuye a varios beneficiarios (el dinero pasa por la plataforma/comercio; lanzado en abril de 2026) | **NO VERIFICADO** | Prensa: [La República](https://www.larepublica.co/finanzas/epayco-lanzo-una-nueva-herramienta-empresarial-para-el-pago-del-impuesto-4x1000-4368706), [Portafolio](https://www.portafolio.co/negocios/empresas/como-las-empresas-pueden-dividir-sus-pagos-entre-varios-beneficiarios-sin-tener-que-pagar-el-4x1000-489802) |
| Wompi Pagos a Terceros | Reparte después de cobrar (según lo ya conocido por QHPA) | No verificado en esta investigación | No reverificado |
| PayU "Marketplace", Stripe Connect, Wava, dLocal | Mencionados en guías comparativas; **Stripe Connect para cuentas colombianas: NO VERIFICADO** | NO VERIFICADO | Solo blogs: [Tiendanube](https://www.tiendanube.com/co/blog/pasarelas-de-pago-colombia/), [dLocal](https://www.dlocal.com/our-industries/shared-economy-and-marketplaces-industry) |

## 8. Recomendación y pasos siguientes

Recomendación: Mercado Pago Split 1:1 es la única opción donde pude confirmar con documentación oficial el reparto automático sin que el dinero del vendedor pase por QHPA, así que merece un piloto. Pero **no construir nada** hasta tener respuesta a las preguntas de abajo, porque pueden descartarlo (persona natural como integrador, KYC del vendedor).

Pasos:
1. Crear una cuenta de prueba en "Tus integraciones" de MP y leer en Colombia las páginas de Prerrequisitos, Credenciales, Reembolsos, Contracargos y Webhooks (varias dieron 403 al leerlas automáticamente; abrirlas en navegador).
2. Enviar las preguntas a MP (comercial/soporte de desarrolladores).
3. Consultar con un contador (sección 6) antes de cobrar la primera comisión.
4. Si MP responde bien: piloto con 1-2 vendedores conocidos (por ejemplo, negocios que ya están en QHPA).

Preguntas exactas para Mercado Pago Colombia:
1. ¿Una persona natural con cédula, sin NIT/RUT de empresa, puede registrarse como integrador/marketplace de Split Payments 1:1? Si no, ¿qué documento exacto se exige?
2. ¿Qué requisitos tiene exactamente el "KYC nivel 6" en Colombia para un vendedor persona natural (documentos, selfie, cuenta bancaria)? ¿Hay topes de ingreso, de saldo o de retiro para cuentas personales?
3. ¿Cuál es el valor máximo o porcentaje máximo permitido de `marketplace_fee`/`application_fee`? ¿Hay mínimo?
4. Tarifas vigentes por medio de pago (tarjeta crédito, débito, PSE, Nequi, efectivo): ¿el $800 es por transacción? ¿El IVA se cobra sobre la comisión? ¿Se aplica la misma tarifa al vendedor del split? ¿Se puede negociar?
5. ¿En qué plazo se libera la comisión del marketplace a QHPA y el dinero al vendedor? ¿Pueden ser plazos distintos?
6. En un contracargo o reembolso con el dinero ya liberado: ¿quién asume el faltante si el vendedor no tiene saldo? ¿Se le puede descontar a QHPA su comisión ya recibida? ¿Aplica la Protección al Vendedor en splits?
7. ¿MP practica retención en la fuente/ICA/IVA al vendedor o al marketplace? ¿Entrega certificados o reportes para el contador?
8. Webhooks: ¿cómo se verifica la firma, hay reintentos, qué garantiza la idempotencia en la creación de pagos?
9. ¿Qué pasa si el vendedor revoca la conexión o el token vence (180 días) con pagos pendientes?

Preguntas para ePayco: (1) ¿Pagos Divididos permite beneficiarios persona natural y cuáles son los requisitos de ellos? (2) ¿El dinero del vendedor pasa por la cuenta de QHPA o va directo? (3) ¿Cuánto cuesta el split y quién lo paga? (4) ¿Qué es el "modelo agregador activado por ticket" y qué exige a QHPA (RUT, cámara de comercio)? (5) Reembolsos y contracargos.

## Lo que NO pude verificar

- Si QHPA como persona natural sin empresa puede ser integrador de Split 1:1, y si necesita NIT/RUT.
- Requisitos concretos del KYC nivel 6 en Colombia; topes y costos de retiro; tope máximo de `marketplace_fee`.
- Tarifas por medio de pago distinto a la tabla general (PSE, efectivo, Nequi) y vigencia/fecha de la tabla oficial; aclaración del "no hay costos fijos" frente a los $800.
- Contracargos en split en Colombia: quién absorbe la pérdida cuando la comisión de QHPA ya fue acreditada.
- Detalle de webhooks, firma e idempotencia para Colombia.
- Páginas con 403 (no leídas): `signup/splitter`, prerrequisitos CO de split 1:1, ayuda de costos, ayuda de reembolsos/contracargos de Colombia.
- Toda la parte tributaria (IVA de la comisión, retenciones, facturación por plataformas).
- ePayco: persona natural receptora, costos y condiciones; Wompi y Stripe Connect Colombia: no reverificados.

## Fuentes

- [Split Payments 1:1 overview (CO)](https://www.mercadopago.com.co/developers/en/docs/split-payments/split-1-1/overview)
- [Integrar marketplace, Split 1:1 (CO)](https://www.mercadopago.com.co/developers/en/docs/split-payments/integration-configuration/integrate-marketplace)
- [Cómo integrar el checkout en marketplace (CO)](https://www.mercadopago.com.co/developers/es/docs/checkout-pro-preferences/how-tos/integrate-marketplace)
- [Prerrequisitos Split 1:1 (Chile)](https://www.mercadopago.cl/developers/en/docs/split-payments/split-1-1/prerequisites)
- [Split 1:N (CO)](https://www.mercadopago.com.co/developers/en/docs/split-payments-1-n/overview)
- [Renovar Access Token (CO)](https://www.mercadopago.com.co/developers/en/docs/oauth/renewal)
- [Referencia OAuth token (CO)](https://www.mercadopago.com.co/developers/en/reference/authentication/oauth/_oauth_token/post.md)
- [Referencia OAuth token (MX)](https://www.mercadopago.com.mx/developers/en/reference/authentication/oauth/_oauth_token/post.md)
- [Checkout MP Colombia, tarifas](https://www.mercadopago.com.co/herramientas-para-vender/check-out)
- [Ayuda MP: comisiones por cobro](https://www.mercadopago.com.co/ayuda/costo-recibir-pagos_1774)
- [Contracargos MP (AR)](https://www.mercadopago.com.ar/developers/en/docs/checkout-pro-preferences/chargebacks/introduction)
- [Registro MP Colombia](https://www.mercadopago.com.co/hub/registration/landing)
- [Términos y condiciones MP CO](https://www.mercadopago.com.co/c/terminosycondiciones)
- [Validación de identidad MP](https://www.mercadopago.com.co/ayuda/33106)
- [Privacidad MP CO](https://www.mercadopago.com.co/privacidad)
- [Portafolio patrocinado: Mercado Pago](https://www.portafolio.co/contenido-patrocinado/comprar-y-vender-en-linea-nunca-fue-tan-facil-582993)
- [Tiendanube: costos pasarelas CO](https://ayuda.tiendanube.com/es_CO/122919-informacion/que-costos-tener-en-cuenta-al-integrar-una-pasarela-de-pagos-con-mi-tiendanube)
- [Tiendanube: pasarelas en Colombia](https://www.tiendanube.com/co/blog/pasarelas-de-pago-colombia/)
- [dLocal marketplaces](https://www.dlocal.com/our-industries/shared-economy-and-marketplaces-industry)
- [La República: ePayco Pagos Divididos](https://www.larepublica.co/finanzas/epayco-lanzo-una-nueva-herramienta-empresarial-para-el-pago-del-impuesto-4x1000-4368706)
- [Portafolio: dividir pagos entre beneficiarios](https://www.portafolio.co/negocios/empresas/como-las-empresas-pueden-dividir-sus-pagos-entre-varios-beneficiarios-sin-tener-que-pagar-el-4x1000-489802)
- [Gerencie: personas naturales obligadas a facturar](https://www.gerencie.com/personas-naturales-obligadas-a-facturar-electronicamente.html)
- [Vanguardia: exentos de factura electrónica](https://www.vanguardia.com/economia/2025/06/19/quienes-estan-exentos-de-emitir-factura-electronica-en-colombia-esto-dice-la-dian/)
- [Siempre al Día: personas naturales obligadas a facturar](https://siemprealdia.co/colombia/impuestos/personas-naturales-obligadas-a-facturar/)
