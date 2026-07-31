# Instalación del portal de tres áreas

1. En `index.html`, pega `bloque-portal-areas.html` inmediatamente después de:
   `<main id="contenido">`

2. Cambia:
   `<section class="hero section-shell">`
   por:
   `<section class="hero section-shell" id="inicio-general">`

3. Reemplaza el menú actual con `menu-actualizado.html`.

4. Pega `agregar-al-final-styles.css` al final de `styles.css`.

5. En el `<head>` cambia:
   `<link rel="stylesheet" href="styles.css">`
   por:
   `<link rel="stylesheet" href="styles.css?v=areas-v1">`

6. Sube a la raíz del repositorio las carpetas:
   `docencia`, `running` y `saneamiento`.

7. Haz commit, espera GitHub Pages y recarga con Ctrl + F5.
