# Rosas Para Toda la Vida — Sitio web

Sitio estático (HTML + CSS + JavaScript). Se abre con doble clic en `index.html` y se publica gratis en Netlify o GitHub Pages.

## Estructura

```
index.html            Página principal
privacidad.html       Política de Privacidad (LOPDP Ecuador)
cookies.html          Política de Cookies
terminos.html         Términos y Condiciones
envios.html           Política de Envíos
devoluciones.html     Cambios, Devoluciones y Reembolsos
aviso-legal.html      Aviso Legal
404.html              Página de error con pétalo cayendo
css/estilos.css       Todos los estilos (colores en :root)
js/config.js          ★ DATOS DEL NEGOCIO, PRECIOS, ENVÍOS, REDES ★
js/rosa.js            Animación de la rosa (Canvas 2D)
js/comun.js           Menú, cookies, WhatsApp, volver arriba
js/inicio.js          Catálogo, carrito, configurador, FAQ, contacto
fotos/                Tus fotos (lee fotos/LEEME.txt)
sitemap.xml, robots.txt, site.webmanifest, favicon.svg
```

## Cambios más comunes

| Quiero cambiar…               | Archivo                                              |
|-------------------------------|------------------------------------------------------|
| Precios, productos, envíos    | `js/config.js`                                       |
| Correo y redes sociales       | `js/config.js` → `correo` y `redes`                  |
| Foto de mi rosa               | Guarda `fotos/rosa-eterna-1.jpg`                     |
| Testimonios reales            | `index.html` → busca `PENDIENTE` en la sección Opiniones |
| Colores                       | `css/estilos.css` → bloque `:root`                   |
| Dominio (SEO)                 | Reemplaza `rosasparatodalavida.netlify.app` en todos los `.html`, `sitemap.xml` y `robots.txt` |

## Publicar en Netlify (recomendado: el formulario de contacto funciona solo)

1. Entra a https://app.netlify.com y crea una cuenta gratis.
2. Ve a **Add new site → Deploy manually**.
3. Arrastra la carpeta completa del sitio a la zona indicada.
4. En **Site configuration → Change site name** escribe `rosasparatodalavida`.
5. Listo: `https://rosasparatodalavida.netlify.app`. Los mensajes del formulario llegan en **Forms**.

## Publicar en GitHub Pages

1. Crea una cuenta en https://github.com y un repositorio público (por ejemplo, `rosas`).
2. **Add file → Upload files**, arrastra todo el contenido de la carpeta y pulsa **Commit changes**.
3. **Settings → Pages → Branch: main / (root) → Save**.
4. En 1–2 minutos estará en `https://TU-USUARIO.github.io/rosas/`.
5. En GitHub Pages el formulario de contacto envía el mensaje por WhatsApp.
