# Exportación PDF consistente en Chrome y Safari

## Estado actual comprobado

- El botón llama directamente a `generateProjectPDF(title, responses)` desde su evento de clic.
- La plantilla se construye de forma programática con `jsPDF 4.2.0` y `jspdf-autotable 5.0.7`.
- No se usa `html2canvas`, captura del formulario, `window.print()`, iframe ni `window.open()`.
- No hay ningún `await`, carga de fuente, consulta de datos ni conversión de imagen antes de iniciar la descarga.
- La descarga actual termina en `doc.save(fileName)`. Ese mecanismo crea internamente un archivo temporal y dispara una descarga desde JavaScript; es el punto que Safari está bloqueando o ignorando, especialmente dentro de la vista previa embebida.
- Los colores del PDF son valores RGB escritos directamente con jsPDF. El formulario usa Tailwind 3 y variables HSL, no `oklch()`/`oklab()`; además, ese CSS nunca participa en la generación. `backdrop-filter` tampoco interviene.

## Hallazgo sobre Fecha

- El campo se llama `portada-fecha` y la portada del PDF sí intenta imprimirlo.
- En pantalla, la Fecha puede mostrarse desde `defaultValue` aunque ese valor nunca haya entrado al estado ni se haya guardado. Esa diferencia explica por qué históricamente podía verse en el formulario y faltar al exportar.
- El código actual añadió un fallback al exportar. En la prueba de Chrome realizada sobre “Prueba Drag y Drop”, se descargó un PDF válido de 6 páginas y el texto extraído contiene `Fecha: 2026-09-18`.
- Ese fallback usa `new Date().toISOString()`, es decir UTC. Puede mostrar el día siguiente en Chile/Colombia durante la noche y no garantiza que la fecha visible sea exactamente la persistida por el usuario.

## Implementación propuesta

### 1. Corregir Fecha como dato real del formulario

- Inicializar `portada-fecha` dentro del estado del formulario con una fecha local, no UTC.
- Guardar ese valor igual que cualquier otro campo, incluso cuando el usuario no modifica manualmente el control.
- Hacer que la plantilla use primero la fecha guardada; el fallback local quedará solo para proyectos antiguos sin ese registro.
- Añadir una prueba que cubra una fecha elegida por el usuario y otra fecha por defecto.

### 2. Separar generación y entrega del archivo

- Convertir la función actual en dos responsabilidades: generar bytes PDF y entregar el archivo.
- Mantener una única plantilla para que Chrome, Safari y el servidor produzcan exactamente los mismos campos y formato.
- Comprobar explícitamente que el PDF generado sea no vacío y contenga Nombre, Organización y Fecha antes de ofrecerlo.

### 3. Evitar otro parche dependiente de Safari

Dado que ya fallaron la descarga sintética, la pestaña con Blob y el segundo clic con enlace Blob, mover la entrega final al backend:

- Una función segura generará el PDF con los datos del proyecto que el usuario tiene permiso de consultar.
- Solo permitirá exportar proyectos aprobados.
- Guardará temporalmente el PDF en almacenamiento privado y devolverá un enlace HTTPS firmado de corta duración.
- El botón abrirá ese enlace real mediante un `<a>` normal. Esto evita Blob URLs, popups, `download` sobre URLs temporales y diferencias entre navegadores.
- El archivo temporal tendrá expiración/limpieza para no acumular documentos.
- La interfaz mostrará “Generando…” y un error visible si el servidor no puede producir el documento.

### 4. Compatibilidad y regresiones

- Conservar el nombre actual del archivo y el diseño existente.
- Confirmar que tablas, textos largos, caracteres acentuados, portada, atribuciones y Fecha sigan presentes.
- No modificar el flujo de aprobación ni habilitar exportación antes del estado Aprobado.

## Verificación antes de cerrar

1. Chrome escritorio: descargar, abrir, verificar PDF no vacío y Fecha correcta.
2. WebKit escritorio automatizado: descargar desde el enlace HTTPS y verificar el contenido.
3. WebKit con tamaño/agente de iPhone: repetir descarga y comprobación.
4. Verificar por extracción de texto que el PDF contiene todos los campos definidos, incluida Fecha, y revisar visualmente todas las páginas.
5. Probar un proyecto antiguo sin Fecha guardada y uno con Fecha editada.

La sandbox permite probar Chromium y WebKit, pero no ejecutar Safari real sobre macOS ni un iPhone físico. Antes de declararlo resuelto, entregaré los resultados automatizados; la confirmación final en Safari de Apple requerirá una prueba corta en tus dispositivos sobre la versión publicada.

## Aclaraciones solicitadas

### 1. Autorización en el servidor

La validación no dependerá de ocultar el botón. La función de servidor exigirá, en este orden:

- Sesión válida: sin token de usuario, respuesta 401.
- Permiso sobre el proyecto: se comprueba contra la regla de visibilidad existente en la base de datos, con la identidad del usuario que llama. Un proyecto ajeno responde 403/404 según corresponda.
- Estado Aprobado: si el proyecto no está aprobado, responde 403 y no se emite ningún enlace.
- El identificador de proyecto se valida como UUID antes de cualquier consulta.

Llamar la función directamente con el ID de un proyecto ajeno o no aprobado será rechazado, incluso desde fuera de la aplicación.

### 2. Expiración y limpieza

- El PDF vive en un bucket privado, nunca público.
- El enlace firmado durará 5 minutos.
- Al generar un PDF nuevo para un proyecto, se borran primero los archivos anteriores de ese mismo proyecto, de modo que solo exista la copia vigente.
- Además, una limpieza programada cada hora elimina cualquier archivo con más de una hora de antigüedad, para cubrir generaciones interrumpidas.

### 3. Descarga forzada

- El enlace firmado se emitirá con descarga forzada y nombre de archivo, es decir el servidor responde con `Content-Disposition: attachment; filename="Ficha_<proyecto>.pdf"`.
- Por eso el navegador guarda el archivo en vez de abrirlo o navegar sobre la pestaña actual, y el comportamiento es el mismo en Chrome y en Safari, incluido iPhone.
