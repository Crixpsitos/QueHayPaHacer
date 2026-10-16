# 24 · Vistas previas de enlaces (og:image en WhatsApp, Facebook, X)

## Qué pasaba
Al compartir una ficha en WhatsApp no salía imagen ni título. Causa raíz (medida en develop):
- App Hosting (Google Frontend) **reemplaza el `User-Agent` de todos los clientes por `"Google"`** antes de que llegue a la app. Se comprobó con WhatsApp, Facebook, Twitter, Chrome y curl: todos llegan como `Google`.
- Next solo pone los metadatos dentro de `<head>` para los rastreadores que reconoce por User-Agent (`htmlLimitedBots`). Como nunca reconocía a ninguno, les entregaba los metadatos **en streaming: fuera de `<head>` y cerca del byte 100.000** (`og:image` en el 103.575 de un documento de 133 KB). WhatsApp y Facebook buscan las etiquetas en el `<head>` y leen solo el principio del HTML.

## Arreglo
`htmlLimitedBots: /.*/` en `next.config.ts`: los metadatos van siempre en `<head>` para todos (con User-Agent `Google` o cualquier otro). Medido en local: `og:image` pasó del byte ~103.000 (fuera de `<head>`) al ~3.500 (dentro) en fichas de sitios y de eventos.
- Costo: la página espera sus metadatos antes de transmitirse (salen de lecturas cacheadas, `use cache`); se pierde el atajo del "shell" prerenderizado también para navegadores. Las páginas servidas por el CDN (`s-maxage`) no lo notan.
- No depender nunca de detectar al rastreador por User-Agent en esta plataforma.

## Imágenes de vista previa (`app/og/`)
Además de las etiquetas, la imagen misma tenía problemas:
- **Eventos:** `opengraph-image.tsx` generaba un **PNG de 1,3 MB en cada petición** (`no-store`): lento y demasiado pesado para WhatsApp.
- **Sitios:** se publicaba la portada tal cual, en **WebP** (WhatsApp no lo muestra de forma fiable).
- **Listados e inicio:** no tenían ninguna imagen.

Ahora:
- `/og/site/<id>` y `/og/event/<slug o id>`: la portada convertida a **JPEG 1200×630** con `sharp` (calidad 78; ~7 KB un sitio de prueba, ~130 KB un evento con foto real), con `Cache-Control: public, s-maxage=7 días` para que el CDN la guarde. Solo sitios públicos y eventos publicados: un borrador nunca filtra su portada.
- `/og/default`: imagen de marca (PNG pequeño) para inicio, listados y como respaldo. Si la portada no se puede leer, se sirve la de marca con caché de solo 5 minutos (un fallo pasajero no se queda una semana en el CDN).
- La descarga de portadas solo acepta `https` y hosts permitidos (`app/og/_lib/og.ts`, probado): la URL sale de la base de datos y la baja el servidor.
- El generador `opengraph-image.tsx` de eventos se eliminó. Dependencia nueva: `sharp` (ya la usa Next para optimizar imágenes).

## Cómo probar tras un despliegue
1. `curl -s -A "WhatsApp/2.23" <ficha> | grep og:image`: la etiqueta debe ir **dentro de `<head>`** y apuntar a `/og/...`.
2. `curl -I <url de la imagen>`: `image/jpeg` (o PNG la de marca), pocos KB, y `cdn-cache-status: hit` en la segunda petición.
3. En WhatsApp: pegar el enlace en un chat. **WhatsApp guarda en caché la vista previa de cada enlace**: probar con un enlace nuevo o con `?v=2`. El depurador de Facebook (Sharing Debugger) permite forzar la recarga.

## Límites
- No se probó con WhatsApp real: solo el HTML y las imágenes que recibe un rastreador.
- La imagen no lleva texto superpuesto (WhatsApp ya muestra título y descripción al lado).
- Si el sitio cambia de dominio, ajustar `NEXT_PUBLIC_SITE_URL` (las URLs de las imágenes son absolutas a partir de ahí).
