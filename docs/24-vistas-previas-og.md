# 24 · Vistas previas de enlaces (og:image en WhatsApp, Facebook, X)

## Qué pasaba
Al compartir una ficha en WhatsApp no salía imagen ni título. Causa raíz (medida en develop):
- App Hosting (Google Frontend) **reemplaza el `User-Agent` de todos los clientes por `"Google"`** antes de que llegue a la app. Se comprobó con WhatsApp, Facebook, Twitter, Chrome y curl: todos llegan como `Google`.
- Next solo pone los metadatos dentro de `<head>` para los rastreadores que reconoce por User-Agent (`htmlLimitedBots`). Como nunca reconocía a ninguno, les entregaba los metadatos **en streaming: fuera de `<head>` y cerca del byte 100.000** (`og:image` en el 103.575 de un documento de 133 KB). WhatsApp y Facebook buscan las etiquetas en el `<head>` y leen solo el principio del HTML.

## Arreglo
`htmlLimitedBots: /.*/` en `next.config.ts`: los metadatos van siempre en `<head>` para todos (con User-Agent `Google` o cualquier otro). Medido en local: `og:image` pasó del byte ~103.000 (fuera de `<head>`) al ~3.500 (dentro) en fichas de sitios y de eventos.
- Costo: la página espera sus metadatos antes de transmitirse (salen de lecturas cacheadas, `use cache`); se pierde el atajo del "shell" prerenderizado también para navegadores. Las páginas servidas por el CDN (`s-maxage`) no lo notan.
- No depender nunca de detectar al rastreador por User-Agent en esta plataforma.

## Pendiente / límites
- Imagen por defecto y formato de la portada: ver el final de este documento cuando se haga (WebP es poco fiable en WhatsApp; las landings no tenían imagen).
- No se probó con WhatsApp real: solo se comprobó el HTML que recibe un rastreador. Tras desplegar, usar "Compartir" a un chat o el depurador de Facebook (Sharing Debugger) y recordar que WhatsApp cachea las vistas previas por enlace (probar con un enlace nuevo o añadiendo `?v=2`).
