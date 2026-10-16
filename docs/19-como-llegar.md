# 19 · "¿Cómo llego?" (etapa 3)

Bloque en la ficha pública del sitio (`HowToGetThere`, dentro de "¿Dónde estamos ubicados?"). Solo aparece si el sitio tiene coordenadas reales (no 0,0).

## Qué hace
- Botón **Usar mi ubicación**: pide el permiso del navegador **solo al tocarlo**, nunca al cargar la página. Con la posición calcula la distancia en línea recta (Haversine) y la estima por calle (× 1,3).
- Sugiere medios según esa distancia, del más conveniente al menos (`adviseTravel`, lógica pura con tests en `domain/entities/sites/directions.ts`):
  - ≤ 1,5 km por calle: caminando, taxi/moto/carro.
  - ≤ 5 km: taxi/moto/carro, bici (y caminando si ≤ 3 km).
  - más lejos: taxi/moto/carro.
  - a más de 40 km en línea recta no se estiman tiempos ("estás lejos…").
- Tiempos aproximados a velocidades urbanas (a pie 5, bici 12, motor 22 km/h), redondeados a 5 min y marcados con "≈". Siempre con la advertencia de que el tráfico y el recorrido real varían.
- Botón **Abrir ruta en Google Maps** (siempre visible): enlace `maps/dir/?api=1&destination=lat,lng` **sin** `travelmode`, para que la persona elija el medio allí. La ubicación de origen la gestiona Google, no nosotros.
- Estados: sin pedir, buscando, listo, permiso denegado, sin soporte de geolocalización, error/tiempo agotado (10 s). Las ayudas de texto explican cómo seguir con el mapa.

## Lo que deliberadamente NO hace
- **No menciona rutas de bus**: aún no hay datos verificados. Se añadirá en la etapa 4 solo con rutas que los usuarios hayan indicado y con su etiqueta de "informado por…".
- No guarda ni envía la ubicación: el cálculo ocurre en el navegador, sin llamadas al servidor ni registros.
- No permite escribir un barrio de partida (requeriría geocodificar). Si no hay ubicación, se remite al mapa de Google.

## Privacidad
La ubicación es un dato personal (Ley 1581 de 2012). Como no sale del dispositivo, no la tratamos ni almacenamos; el texto junto al botón lo dice. Si más adelante se calcula la ruta en el servidor (API de rutas) o se guarda algo, hay que actualizar `/privacidad` (texto legal: revisarlo con el abogado) y subir `LEGAL_VERSION`.

## Límites conocidos
- La estimación en línea recta puede subestimar mucho en zonas con barreras (ríos, pendientes); por eso se dice "aproximado".
- La precisión depende del dispositivo (se pide ubicación "normal", sin GPS de alta precisión, con caché de 5 min).
- Probado con ubicaciones simuladas (cerca, lejos, denegado) en 1300, 390 y 360 px; no probado con un teléfono real ni en iOS Safari.
