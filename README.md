# Mily Torres — Contenido que Vende

Landing page de las asesorías 1:1 de **Mily Torres ([@bymilytorres](https://www.instagram.com/bymilytorres/))**: estrategia, guiones, hooks y edición en CapCut.

Estructura tipo **"creator studio"** con la **paleta y tipografía de marca de Mily**:

- Colores: rosa `#F464BE` (hover `#D749A4`, suave `#FFC0E5`), ciruela `#19182C`, fondos `#FFF1F8` / `#FFF8FC`, texto `#6D6D7D` y dorado `#BC9142`
- Tipografía: **Italiana** (títulos) y **Poppins** 300–600 (texto y etiquetas)

Elementos y animaciones:

- Intro tipo "REC" con contador 0 → 100
- Foto principal dentro de un marco de Reel (barras de historia, @usuario, acciones) con stickers que se pueden arrastrar
- Titulares que entran por líneas/palabras con resaltado lima animado
- Cifras con contadores, comparador antes/después deslizable
- Dolores presentados como notificaciones del celular
- Método con scroll horizontal fijado (escritorio) y mini visuales: calendario, guion, línea de tiempo de CapCut
- Planes en tabla editorial, Pack Estrella con insignia giratoria y cuenta regresiva
- Cursor personalizado, botones magnéticos, scroll suave (Lenis + GSAP ScrollTrigger)
- Respeta `prefers-reduced-motion` (sin animaciones para quien las tiene desactivadas)

## Estructura

```
index.html        → todo el contenido (textos, precios, enlaces de pago)
src/style.css     → estilos y paleta (variables en :root)
src/main.js       → animaciones e interacciones
public/favicon.svg
```

## Desarrollo

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # genera /dist listo para publicar
npm run preview   # sirve /dist localmente
```

## Cómo editar lo más común

| Qué | Dónde |
| --- | --- |
| Precios | `index.html`, buscar `data-count="…"` dentro de cada plan (el número visible y el `data-count` deben coincidir) y el precio tachado `price-old` |
| Enlaces de pago (Hotmart) | `index.html`, buscar `pay.hotmart.com` |
| WhatsApp | `index.html`, buscar `wa.me/18132151280` |
| Colores | `src/style.css`, variables `--ink`, `--bg`, `--accent`, `--accent-soft`, `--gold` en `:root` |
| Duración de la cuenta regresiva | `src/main.js`, constante `SPAN` (48 h) |

## Imágenes

Las imágenes están en `public/img/` (banner, perfil antes/después y testimonios). Para cambiar una, reemplaza el archivo con el mismo nombre o cambia la ruta `/img/…` en `index.html`.

La imagen para compartir en redes (`og:image`) usa la URL completa de GitHub Pages; si se conecta un dominio propio, hay que actualizarla en `index.html`.

## Publicar

El build (`dist/`) es estático: funciona en GitHub Pages, Netlify, Vercel o cualquier hosting (usa rutas relativas).
