# 25. Monetización del módulo de sitios

Estado: **propuesta para decidir** (2026-10-24). Nada de esto está construido. Resume una auditoría del código y cuatro investigaciones de mercado (unas 270 búsquedas y lecturas en total). Las cifras en COP de QHPA son **hipótesis** a validar con dueños de negocio, no datos.

Leyenda de evidencia: **[V]** página oficial o prensa verificable · **[M]** afirmación de marketing del proveedor · **[T]** tercero, competidor o estimación · **[H]** hipótesis nuestra.

## 1. Dónde estamos hoy (código)

> Actualización (2026-10-24): se **quitó `/studio/sites`** del Studio (y todo su código: rutas, componentes, métodos de `StudioService`, `isStudioSiteOwner`), el texto de `/premium` quedó solo para eventos y se está implementando la medición real de sitios (`docs/26`) y el incentivo de eventos por sitio (`docs/27`). Lo siguiente describe el estado *antes* de esos cambios.

- **Todo lo de sitios es gratis y sin límites.** Crear, publicar y editar sitios, hasta 30 archivos de media, sin tope por plan. Lo único Premium es `/studio/sites[/id]`, que muestra los mismos contadores que el dueño ya ve gratis más una gráfica.
- **No se mide casi nada.** Nada incrementa `analytics.views` ni `analytics.clicks` de los sitios (`docs/23` lo reconoce). La gráfica semanal del Studio agrupa por un campo `type` que las interacciones reales no traen, así que solo funciona con datos sembrados. `eventCount` solo lo fija un script.
- **`/premium` promete algo que no existe:** "exportación a CSV" de estadísticas de eventos *y sitios*. El CSV solo existe para inscritos de eventos.
- **No existen:** seguir un sitio, reseñas, ofertas, reservas, menú, teléfono o WhatsApp como campo, promoción de sitios, equipo por sitio (un único `author.id`), pasarela de pago. Premium es para organizadores de eventos; un dueño de cafetería no tiene motivo para pagarlo.
- **Infraestructura reutilizable:** QR de check-in con escáner (`checkIn.ts`, `jsqr`, `qrcode.react`), campanita de avisos (`NotificationService`), campañas con conteo de vistas/clics (`/api/campaigns/track`, `campaigns/{id}/stats/{día}`), imágenes con `sharp` (`/og`), insignias (`badges`, hoy solo de usuarios), colaboradores con roles (solo eventos), eventos vinculados a un sitio.

## 2. Qué dice el mercado

### Convergencias entre las cuatro investigaciones
1. **Lo básico es gratis en Google** [V]: ficha, menú, reservas, ofertas, publicaciones y estadísticas de vistas, llamadas y rutas. Menú y contadores no pueden ser el muro de pago.
2. **Con poco tráfico no se vende visibilidad ni se cobra por clic.** Yelp admite que los anuncios rinden cuando el perfil ya tiene tracción; los dueños dicen que no pueden verificar los clics [V/T]. Se paga **tarifa fija con entregable** o **resultado verificado**.
3. **El pago por resultado funciona si lo verifica un evento observable** (visita hecha, comensal sentado, check-in en menos de 20 min). La queja número uno de Fresha, Booksy y Treatwell es quién cuenta como "cliente nuevo" (cobran clientes propios como nuevos) [T]. Si **el propio negocio confirma el canje con el escáner QR**, esa disputa desaparece.
4. **Groupon falló por diseño, no por el descuento:** voucher prepagado, comisión de ~50%, pago diferido, cliente de una sola vez y cero control. Estudio de Rice (2011, 324 negocios): 55,5% ganó, 26,6% perdió, solo ~20% volvió a precio completo [T]. Un descuento canjeado en el local, con cupo y en franja valle corrige casi todo.
5. **Pasaportes con sellos QR:** hay precedentes en Colombia y fuera, y casi siempre los paga un tercero.
   - Bogotá, Compass Group: COP 20.000, de 13 a 24+ cafés, "fue rentable" sin cifras [V/M].
   - Bucaramanga, Cafetopía: 4.ª edición en 2025, 9 cafés [V].
   - Monterrey: MXN 175, 103 locales, 4.ª edición [V].
   - Medellín (Alcaldía), "Coleccionistas de Museos": gratis, 30 museos, sellos QR, 1.700 pasaportes en la 1.ª edición [V].
   - Pasaporte La Candelaria (Bogotá): gratis, con descuentos de comercios [V].
   - Hobart: la ciudad pagó los bonos; cada US$1 público dejó ≥ US$2,31 a los locales [M, caso del proveedor]. Yellowknife: los comercios pagaron C$100–200 por participar.
   - Edmonton: el café gana US$5 por pasaporte vendido.
   - Ninguno publica ventas.
6. **Pagar por una campaña curada con demanda tiene más precedente local que una suscripción mensual:** Burger Master 2026 cobra COP 3.000.000 de inscripción a cada restaurante (51 ciudades, 500+ restaurantes) y dice que se recupera con ~300 hamburguesas [V/M, todo del organizador].
7. **Los modelos de créditos (ClassPass, Wellhub, TotalPass) enseñan mecánicas, no una red:** primera visita gratis con tope por persona y por mes, pago por check-in validado, cupos y franjas que fija el negocio. ClassPass admite que es relleno de cupos vacíos, no generador de leads [T/M].
8. **Los escalones "gratis / medio / alto" con herramientas operativas funcionan en vida nocturna:** Xceed (oficial) cobra gratis / €29 / €44 al mes, y el plan alto incluye contabilidad automática de promotores y mapa de mesas; incluye crédito de publicidad de €200–300 y paga 15% de referido por reservas verificadas [V].

### Por vertical
| Vertical (categorías de QHPA) | Qué paga el negocio y cuánto | Idea de mayor encaje |
|---|---|---|
| **Gastronomía y café** (restaurantes, cafeterías) | Delivery: Rappi 25% + 2% + IVA, DiDi 25% (no opera en Ibagué), Uber Eats se fue en 2020 [V]. Lealtad: tarjetas digitales US$19–39/mes [T]; papel ~US$0,04 por tarjeta (techo). Menú QR: gratis; además la SIC exige precios visibles | Pasaporte del café, catas y talleres (eventos), semanas temáticas con inscripción, botón "pedir directo" gratis |
| **Noche** (bares, discotecas) | Boletería 10–15% (Tuboleta, con cargos de la SIC), RA ~12% al comprador. RRPP: £10–20 por invitado y 10–25% de mesas [T] | Módulo de promotores y listas verificadas con QR; **no vender entradas** (operadores autorizados por MinCultura) |
| **Alojamiento** (hoteles, hostales) | Booking ~15% (10–25%), Hostelworld 16,2–17,7% efectivo, Airbnb 3–16% [V/T]. Guías digitales para huéspedes: desde £1,99 por propiedad al mes (Boostly) [V] | Guía del huésped con QR, **insignia "RNT verificado"** (obligatorio por Ley 2068/2020), conteo de clics; precio muy bajo, ~COP 20–40 mil |
| **Bienestar** (gimnasios, spas) | Fresha COP 24.300/mes + comisión por cliente nuevo; Booksy 30% (tope US$100); Treatwell 35% de la primera reserva [V]. AgendaPro COP 29.900–510.000 [V]. Gimnasios en Ibagué: COP 70–130 mil/mes | Primera visita o clase de prueba con QR (cupo, franja valle, 1 por persona), no comisión por cliente nuevo |
| **Comercio** (centros comerciales) | El que paga es el anunciante o el propio mall. Simon+ es gratis para tiendas; Simon Media vende medición de visitas incrementales [V] | Paquete con reporte de afluencia por QR y sub-directorio de tiendas |
| **Cultura y aire libre** (museos, teatros, sitios culturales, parques, miradores, otros) | Museos pequeños no viven de membresías (<1% del ingreso en los grandes) [T]. Un parque o mirador no tiene a quién cobrar | Museos y teatros: Premium de eventos + "amigos" validados por QR. Parques y miradores: **patrocinador mensual por sitio**; pasaportes culturales pagados por municipio o patrocinadores |

### Anclas de precio en Colombia [V]
- Software para pymes: Fresha COP 24.300/mes (COP 16.200 por persona), AgendaPro 29.900 / 99.000 / 150.000, Treinta 39.900 / 79.900, Alegra 17.900 / 49.900 / 99.900 / 179.900.
- Gremios: Cámara de Comercio de Ibagué COP 58.200–157.300 al año (2022).
- Campaña curada: COP 3.000.000 de inscripción (Burger Master).
- Premium de eventos de QHPA: COP 50.000/mes.
- Pasarelas: Wompi QR 1%, tarjeta 2,99% + COP 600 + IVA, PSE 1,49% + COP 1.200 [T]. Una recarga de COP 20.000 pierde 6–9% en comisión y una de 100.000 solo 2,5–4%. El cobro recurrente (Nequi, Daviplata) es frágil: prepago o anual.
- Una membresía lleva IVA 19% y exige factura electrónica DIAN: confirmar con un contador [H].

### Contexto local [V/T]
- Tolima cerró 2025 con 62,2% de ocupación hotelera (nacional 56,7%); Cotelco proyectó 71,3% para Ibagué en junio–julio de 2026.
- Civitatis lista ~20 actividades en Ibagué con 22 reseñas; el turismo internacional es mínimo y el nacional es el canal.
- Rappi dice que los pedidos de corrientazo en Ibagué crecieron 414% (cifra de la empresa).
- Hay Denominación de Origen Tolima (2017), Ibagué Café Festival y un concurso de cafés especiales: un patrocinador institucional es plausible.

## 3. Principios de diseño

1. **Gratis = ficha completa y descubrible. Pago = herramientas para crecer y para demostrar resultados.** Los negocios pagan por *saber si funciona*, *llegar a sus propios clientes* y *aparecer más*, en ese orden de facilidad de venta.
2. **Arrancar con herramientas que funcionan con los clientes del propio negocio** (QR en la mesa, sellos, seguidores, ofertas canjeadas en el local). QHPA tiene poco tráfico: el negocio trae su gente y la plataforma crece a través de ellos.
3. **Cobrar tarifa fija o por resultado verificado por el propio negocio.** Nunca porcentaje sobre un descuento, nunca CPC.
4. **Un solo motor, varios paquetes.** No se construyen 15 productos: se construyen cinco primitivas y se empaquetan por vertical.
5. **Confianza primero:** todo lo pago se etiqueta "Promocionado" (la SIC puede multar hasta 2.000 SMMLV por publicidad engañosa; multó a Rappi con ~COP 4.003 M en abril de 2026), 1–2 posiciones fijas y nada de tocar estrellas ni reseñas [V/T].

## 4. La propuesta: tres capas sobre un mismo motor

### Motor (lo que se construye una vez)
| # | Primitiva | Reutiliza | Habilita |
|---|---|---|---|
| 1 | **Medición real** de la ficha: vistas, clics (cómo llegar, WhatsApp, reservar, redes, llamar, compartir), origen de la visita. Arregla la gráfica del Studio y cumple el CSV prometido | patrón de `/api/campaigns/track` | estadísticas, prueba de resultados, todo lo demás |
| 2 | **Canje por QR validado por el negocio** (oferta → usuario la reclama → el personal escanea → queda registrado) | `checkIn.ts`, `jsqr`, `qrcode.react` | ofertas, primera visita, sellos, listas de invitados, afluencia |
| 3 | **Seguir sitio + avisos** | campanita (`NotificationService`) | novedades a audiencia propia, "último cupo" |
| 4 | **Campañas con inscripción y sellos** (pasaportes, semanas temáticas) | QR, `badges`, campañas | ingreso por inscripción y patrocinio |
| 5 | **Monedero de créditos** (libro de movimientos) | planChanges como modelo de auditoría | pago por canje, destacados, avisos extra |
| 6 | **Equipo por sitio** (personal que escanea) | colaboradores de eventos | uso en el local |
| 7 | **Kit de redes** (stories y posts desde la ficha) | `/og` con `sharp` | valor percibido inmediato sin diseñador |

### Capa A: membresía "Sitio Pro"
Cuota fija mensual, con créditos incluidos. Incluye: estadísticas completas (historial, por origen y hora, comparativo con tu categoría, CSV, resumen semanal), ofertas con canje QR (con N canjes al mes), avisos a seguidores (N al mes), kit de redes completo, equipo de hasta 3 personas, constructor de carta avanzado y 10 créditos al mes.

**Gratis para siempre:** ficha completa, horarios, botón de WhatsApp y llamar, carta simple (lista o foto), métricas de 7 días como gancho ("tu ficha tuvo 214 visitas"), una plantilla del kit con marca QHPA, contador de seguidores, y aparecer como sello pasivo en pasaportes cuando el negocio se inscriba.

### Capa B: créditos ("monedas")
Prepago. **1 crédito = COP 1.000** (hipótesis). Recargas mínimas de COP 50.000 para que la comisión de pasarela no se coma el pago; paquetes de 100.000 con +20% de bono. Vigencia de 12 meses. No se devuelven a la tarjeta (lo mismo que Thumbtack). Con ellos se paga lo que tiene resultado verificable:

| Uso | Precio en créditos (hipótesis) | Verificación |
|---|---|---|
| Canje de una oferta en restaurante o café | 2 | el personal escanea el QR |
| Primera visita o clase de prueba en gimnasio, spa o belleza | 5 | escaneo + 1 por persona cada 30 días + cupo |
| Aviso extra a seguidores | 3 | envío registrado |
| Destacado en categoría, por día | 5 | solo cuando haya tráfico medible; con reporte y devolución de lo no entregado |
| Inscripción a una campaña corta | ver capa C | |

### Capa C: campañas curadas (la que mejor encaja con la evidencia local)
Pasaportes y semanas temáticas que organiza QHPA, con inscripción fija por negocio y patrocinio de terceros.
- **Pasaporte del Café Ibagué**, **Semana de la Hamburguesa**, **Semana del Cóctel**, **Ruta de los museos**, **Ibagué Activa** (gimnasios y parques).
- Inscripción por negocio: **COP 80.000–250.000 por edición** (hipótesis; Burger Master cobra 3 M, Yellowknife C$100–200).
- Patrocinadores posibles: Comité de Cafeteros del Tolima, Alcaldía, Cámara de Comercio, Cotelco, marcas de bebidas, EPS, un centro comercial.
- La primera edición **gratis para negocios fundadores** a cambio de QR en el local y contenido.
- Usa QR e insignias que ya existen.

### Paquetes por vertical (mismo motor, otra cara)
- **Café y restaurante:** carta con campos propios del café de especialidad (origen, finca, proceso, notas de cata, método), "plato o café del día", agotado en vivo, QR de mesa con marca, catas recurrentes como eventos, oferta de martes, pasaporte, sellos.
- **Noche:** enlace o QR por promotor (RRPP), lista de invitados verificada en la puerta, reporte de comisiones por promotor, staff como colaboradores. Es el módulo que Xceed reserva para su plan alto. Cuota sugerida: COP 60.000–150.000/mes (hipótesis).
- **Alojamiento:** guía del huésped con QR en recepción (eventos de hoy, ficha del hotel), insignia RNT verificado, conteo de clics. Precio bajo, COP 20.000–40.000/mes (hipótesis; Boostly cobra ~US$2 por propiedad).
- **Bienestar:** primera visita con QR y cupos, ofertas de franja valle, botón "agendar por WhatsApp" con mensaje prellenado.
- **Comercio:** reporte de afluencia por QR (la medición que vende Simon), sub-directorio de tiendas, campañas. Cuota alta, pagada por el administrador del mall, no por las tiendas.
- **Cultura:** museos y teatros usan el Premium de eventos (multifecha) y "amigos" validados por QR. Parques y miradores: un **patrocinador mensual por sitio** ("este mirador lo acompaña X"), con el sitio siempre gratis.

## 5. Precios de partida (hipótesis a validar)

| Producto | Precio | Ancla |
|---|---|---|
| Sitio Pro, regular | COP 49.900/mes (37.425 pagando anual, −25%) | Alegra Pyme 49.900; Premium eventos 50.000 |
| Sitio Pro, fundador | COP 29.900/mes, congelado 12 meses, tras 3 meses gratis; primeros 30–50 negocios | AgendaPro Individual 29.900 |
| Recarga de créditos | 50.000 (+10%) / 100.000 (+20%) | pérdida de pasarela en montos pequeños |
| Campaña curada | 80.000–250.000 por edición | Cámara de Comercio 58–157 mil/año; Burger Master 3 M |
| Alojamiento | 20.000–40.000/mes | Boostly ~US$2 |
| Noche | 60.000–150.000/mes | Xceed €29–44 (~120–180 mil COP) |

Decisión abierta: si el Premium actual de eventos y el de sitios son **un solo plan** (más simple, pero canibaliza) o **dos** ("Premium" y "Negocio").

## 6. Hoja de ruta

| Fase | Contenido | Por qué en este orden |
|---|---|---|
| **1. Cimientos** | Medición real y arreglo del Studio (+ CSV); teléfono y WhatsApp como campos gratis; canje por QR; monedero de créditos con **cobro manual** (como hoy se activa Premium) | La medición arregla lo roto, cumple lo prometido y es la prueba que se necesita para vender todo lo demás |
| **2. Arranque en frío** | **Pasaporte del Café Ibagué** como piloto (10 cafés, sello QR, patrocinador); seguir sitio + avisos; paquete Sitio Pro | Es la apuesta con más precedente local; los cafés traen su audiencia y el patrocinador paga sin tráfico propio |
| **3. Paquetes** | Kit de redes; constructor de carta; equipo por sitio; noche (promotores); alojamiento (guía QR + RNT); bienestar (primera visita) | Cada uno reutiliza el motor |
| **4. Escala** | Pasarela de pago (Wompi o Bold); factura electrónica; convenios con Cámara de Comercio, Cotelco y Fenalco; destacados con tarifa fija cuando haya tráfico | El cobro automático y la visibilidad solo se justifican con volumen |

## 7. Qué no hacer
- Comisión por porcentaje sobre descuentos (modelo Groupon).
- Cobro por clic (CPC) o por cliente nuevo: la disputa de "quién es nuevo" ya hundió la reputación de otras plataformas.
- Vender entradas o boletería sin operador autorizado y sin pagos.
- Reservas con depósito antes de tener pagos.
- Competir en delivery.
- Vender "visibilidad" con poco tráfico.
- Tocar estrellas, reseñas o ranking orgánico con dinero.

## 8. Riesgos y límites de la investigación

**Riesgos:** fraude en canjes (colusión del personal, códigos compartidos), cobro recurrente frágil en Colombia, IVA y facturación DIAN, precio congelado a fundadores como obligación de largo plazo, canibalización del Premium de $50.000, y el segmento de restaurantes retiene peor (Yelp: ubicaciones pagas de restaurantes cayeron de 316 mil a 274 mil entre 2023 y 2024 [V]).

**Límites:**
- Buena parte de las cifras viene de proveedores o de competidores (Eat App sobre TheFork y OpenTable). No hay datos de conversión de gratis a pago de directorios locales, solo de SaaS en general (mediana 8% en ChartMogul; típico 2–5%; churn SMB 3–7% mensual) [T].
- No se pudo verificar: precios de Fourvenues, DICE, Shotgun, Passline, Rappi Ads, Tripadvisor para restaurantes, cuotas de Cotelco, Acodres y Cámara de Comercio de Ibagué vigentes, tarifa de Wellhub en Colombia, porcentaje oficial de Fresha, tarifas recurrentes de Wompi. Reddit estaba bloqueado para las herramientas, así que faltan voces de dueños.
- Todos los precios en COP de QHPA son hipótesis.

**Validación sugerida antes de construir (5 a 10 entrevistas de 20 minutos):** ¿qué herramienta usa hoy para promocionarse y cuánto paga?, ¿cuántos clientes nuevos trae Instagram frente a Google?, ¿pagaría por saber cuántas personas vieron su ficha y de dónde vienen?, ¿participaría en un pasaporte y cuánto pagaría por inscribirse?, ¿qué oferta haría en una franja valle?, ¿quién escanearía el QR en el local?

## 9. Fuentes principales
- Google Business Profile para restaurantes: <https://orders.co/blog/google-business-profile-for-restaurants/>
- Tripadvisor Business Advantage: <https://www.tripadvisor.com/business/business-advantage/frequently-asked-questions> · Premium para restaurantes: <https://www.thecaterer.com/news/tripadvisor-launches-new-paid-premium-subscription-services-for-hotels-and-restaurants>
- Yelp Ads y 10-K 2024: <https://agencyanalytics.com/blog/guide-to-yelp-ads> · <https://www.sec.gov/Archives/edgar/data/1345016/000134501625000007/yelp-20241231.htm>
- Thumbtack (reembolsos): <https://help.thumbtack.com/article/refund-policy> · Google Local Services: <https://support.google.com/adwords/answer/7195435>
- Fresha: <https://www.fresha.com/pricing> · Booksy: <https://biz.booksy.com/pricing> · Treatwell: <https://www.treatwell.co.uk/partners/pricing/> · StyleSeat: <https://www.styleseat.com/blog/does-styleseat-pay-for-itself/>
- AgendaPro Colombia: <https://agendapro.com/co/planes> · Alegra: <https://www.alegra.com/colombia/precios/> · Treinta: <https://www.treinta.co/>
- Wellhub: <https://wellhub.com/es-es/plans-pricing/> · TotalPass: <https://totalpass.com/br/blog/para-academias/rede-parceira-totalpass> · Urban Sports Club: <https://partnernewsroom.urbansportsclub.com/en/important-update-on-our-payouts-handout-faq/> · ClassPass: <https://gymdesk.com/blog/classpass-for-business>
- Xceed: <https://xceed.me/en/pricing> · RA: <https://support.ra.co/article/177-service-fees> · Fourvenues: <https://academy.fourvenues.com/en/reservation-rates/>
- Tuboleta y cargos de servicio: <https://www.eltiempo.com/economia/finanzas-personales/que-le-cobran-en-el-cargo-por-servicio-cuando-compra-una-boleta-en-colombia-815191>
- Comisiones Rappi y DiDi 2026: <https://www.chejefe.com/blog/independencia-de-las-apps/comision-rappi-didi-colombia-2026> · Uber Eats sale de Colombia: <https://www.elpais.com.co/colombia/uber-eats-se-va-la-empresa-anuncia-el-cese-de-su-operacion-en-y-argentina.html> · Rappi y Ibagué: <https://www.larepublica.co/empresas/pedidos-de-corrientazos-en-rappi-4507104>
- Burger Master: <https://www.colombia.com/gastronomia/noticias/cuanto-vale-inscribirse-en-el-burger-master-580739>
- Pasaportes de café: Bogotá <https://colombiareports.com/grab-a-coffee-in-bogota-parties-and-limited-edition-deals-are-about-to-be-served/> · Bucaramanga <https://radionacional.co/cultura/gastronomia/pasaporte-cafetero-2025-descubre-las-mejores-tiendas-de-cafe-en-bucaramanga-y> · Monterrey <https://monterreysecreto.com/en/regios-coffee-passport-2026/> · Edmonton <https://www.ctvnews.ca/edmonton/article/keeping-edmonton-caffeinated-local-man-launches-coffeepass-to-support-community/>
- Pasaportes públicos: Medellín <https://www.medellin.gov.co/es/sala-de-prensa/noticias/con-pasaporte-cultural-las-personas-podran-explorar-las-rutas-y-los-tesoros-escondidos-en-los-museos-de-medellin/> · La Candelaria <https://forbes.co/forbes-life/lanzan-el-pasaporte-de-la-candelaria-2-0> · Hobart <https://www.stampme.com/case-studies/city-of-hobart>
- Alojamiento: <https://www.houst.com/blog/booking-com-fees-for-hosts> · <https://www.hostfully.com/pricing/digital-guidebooks/> · <https://boostly.co.uk/marketplace/airguide/> · RNT y plataformas: <https://www.valoraanalitik.com/?p=200165>
- Experiencias: <https://arival.travel/article/getyourguide-commission-increasing-for-some-operators> · Civitatis en Ibagué: <https://civitatis.com/en/ibague/combeima-canyon-casa-loma-hiking-tour>
- Ocupación hotelera Ibagué: <https://www.portafolio.co/economia/el-mundial-frena-la-ocupacion-hotelera-en-colombia-santa-marta-ibague-y-barranquilla-lideran-para-mitad-de-ano-496262>
- Centros comerciales: <https://www.modernretail.co/marketing/location-data-fuels-mall-giant-simons-new-pitch-to-advertisers/> · <https://www.peru-retail.com/sector-retail-app-interconectada-92-malls-colombia/>
- Groupon: <https://blog.agrawals.org/2011/06/07/an-analysis-of-the-groupon-merchant-agreement/> · Pruebas gratis en gimnasios: <https://www.glofox.com/blog/why-the-free-gym-trial-is-dead/>
- Pasarelas Colombia: <https://www.guiadesoftware.com/blog/mejor-pasarela-pago-colombia> · Wompi QR 1%: <https://cambiocolombia.com/peso-a-peso-paso-a-paso/articulo/2026/9/wompi-amplia-los-pagos-sin-contacto-y-baja-al-uno-por-ciento-la-tarifa-de-los-pagos-con-qr>
- Cámara de Comercio de Ibagué (afiliados): <https://ccibague.org/afiliados/>
- Conversión freemium: <https://chartmogul.com/reports/saas-conversion-report/> · Churn: <https://kalungi.com/blog/saas-churn-rate-benchmarks>
- SIC y Rappi: <https://forbes.co/2026/04/08/negocios/sic-multa-a-rappi-con-4-000-millones-por-vulnerar-derechos-de-consumidores/>
