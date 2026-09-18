# Roadmap

## Sistema de roles de 3 niveles (docente / estudiante)
- [x] Confirmar dónde vive el rol hoy (tabla `user_roles` + `has_role`, NO en `profiles`)
- [x] Migración: agregar valor `DOCENTE` al enum `app_role`
- [x] RLS: bloquear a DOCENTE de crear/editar/eliminar proyectos, respuestas e historial
- [x] RLS: DOCENTE ve solo proyectos donde es miembro (`project_members`); comentar permitido
- [x] RLS: nadie puede auto-asignarse rol (solo Superadmin ADMIN)
- [x] AuthContext: isDocente / isSuperadmin
- [x] Dashboard: vista "Proyectos asignados" para docente; acceso total para Superadmin
- [x] ProjectEditor: docente en solo lectura con comentarios activos
- [x] Pantalla Superadmin `/admin/docentes` para crear cuentas docente
- [x] Edge function `create-docente` validando que el llamante sea Superadmin
- [x] Convertir `profeDiplomado2026` a DOCENTE
- [x] Validar los 6 casos de prueba (probados directo contra la base de datos)

## Exportación PDF fiable en Chrome y Safari
- [x] Fecha (`portada-fecha`) se inicializa en local y se persiste; aparece siempre en el PDF
- [x] Función de servidor valida sesión (401), permiso (403), estado Aprobado (403) y UUID (400) antes de generar enlace
- [x] Bucket privado `project-pdfs` con enlace firmado de 5 min y descarga forzada (Content-Disposition attachment)
- [x] Limpieza: borra PDFs previos del proyecto al generar uno nuevo + cron cada hora borra archivos >1h
- [x] Verificado: descarga OK y Fecha 2026-09-17 en Chromium, WebKit escritorio y WebKit tamaño iPhone
