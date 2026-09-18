# Plan: exportación PDF confiable en Safari

## Objetivo
Lograr que Safari permita guardar el PDF desde la vista previa, donde la aplicación está dentro de un marco que puede bloquear descargas automáticas.

## Cambios propuestos
1. **Separar generación y descarga**
   - El primer clic generará el PDF y preparará el archivo.
   - En vez de intentar una descarga automática silenciosa, se mostrará una ventana de descarga dentro de la herramienta.

2. **Exigir un clic directo para Safari**
   - La ventana tendrá un enlace real **“Descargar PDF”** para que Safari reciba una acción directa del usuario.
   - Incluirá una alternativa **“Abrir PDF”** si Safari no permite descargarlo desde la vista previa.
   - Chrome y otros navegadores conservarán la descarga directa actual.

3. **Mostrar resultados y errores**
   - Indicar claramente cuándo el archivo está listo.
   - Si Safari bloquea ambas acciones, mostrar un mensaje explicando que debe abrirse la página publicada directamente, en lugar de fallar sin respuesta.
   - Liberar el archivo temporal al cerrar la ventana para evitar consumo innecesario de memoria.

4. **Verificación**
   - Comprobar que el PDF generado siga siendo válido y conserve su nombre.
   - Probar el flujo normal de Chrome y el flujo alternativo de Safari.
   - Verificar que el botón permanezca deshabilitado para proyectos no aprobados.

## Detalles técnicos
El flujo actual genera un `Blob` y prueba primero la hoja de compartir de Safari; si esta no está disponible, simula un clic sobre un enlace oculto. Dentro de la vista previa ese clic puede ser bloqueado silenciosamente. El nuevo flujo mantendrá el archivo preparado y hará que la descarga ocurra mediante un enlace visible pulsado directamente por la persona.
