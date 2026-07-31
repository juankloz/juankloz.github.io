# Guía de instalación y actualización

## Instalación inicial

1. Descomprime `docencia-universitaria-juankloz.zip`.
2. En la raíz de tu repositorio abre la carpeta `docencia`.
3. Reemplaza el archivo antiguo `docencia/index.html`.
4. Sube también:
   - `docencia/docencia.css`
   - `docencia/docencia.js`
   - la carpeta completa `docencia/cursos`
   - la carpeta completa `docencia/archivos`
5. Confirma los cambios en la rama `main`.
6. Espera el despliegue y abre:
   `https://juankloz.github.io/docencia/`

## Enlaces de Moodle

Cada curso muestra “Enlace Moodle pendiente”.

Cuando tengas la URL de un curso, busca en su `index.html`:

```html
<div class="moodle-pending">
  <span>Enlace Moodle pendiente</span>
  <b aria-hidden="true">🔒</b>
</div>
```

y reemplázalo por:

```html
<a
  class="moodle-pending"
  href="PEGA_AQUI_LA_URL_DEL_CURSO"
  target="_blank"
  rel="noopener noreferrer"
>
  <span>Ingresar al aula en Moodle</span>
  <b aria-hidden="true">↗</b>
</a>
```

## Publicar un resultado, rúbrica o recurso

1. Sube el archivo a la carpeta correspondiente:
   `docencia/archivos/NOMBRE-DEL-CURSO/resultados/`
   `docencia/archivos/NOMBRE-DEL-CURSO/rubricas/`
   `docencia/archivos/NOMBRE-DEL-CURSO/recursos/`
2. Abre la página HTML del curso.
3. Busca el comentario que comienza con:
   `Para agregar un resultado`, `Para agregar una rúbrica` o
   `Para agregar un recurso`.
4. Copia el ejemplo, quita los signos de comentario y cambia:
   - nombre del archivo;
   - título;
   - descripción.

## Privacidad

La página pública debe mostrar solamente productos colectivos o anonimizados.
Las entregas individuales, calificaciones y datos personales deben permanecer
en Moodle.
