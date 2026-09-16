# Roadmap

## Sistema de roles de 3 niveles (docente / estudiante)
- [x] Confirmar dónde vive el rol hoy (tabla `user_roles` + `has_role`, NO en `profiles`)
- [ ] Migración: agregar valor `DOCENTE` al enum `app_role`
- [ ] RLS: bloquear a DOCENTE de crear/editar/eliminar proyectos, respuestas e historial
- [ ] RLS: DOCENTE ve solo proyectos donde es miembro (`project_members`); comentar permitido
- [ ] RLS: nadie puede auto-asignarse rol (solo Superadmin ADMIN)
- [ ] AuthContext: exponer isDocente / isSuperadmin
- [ ] Dashboard: vista "Proyectos asignados" para docente; acceso total para Superadmin
- [ ] ProjectEditor: docente en solo lectura con comentarios activos
- [ ] Pantalla Superadmin para crear cuentas docente (nombre, correo, usuario, clave)
- [ ] Edge function `create-docente` validando que el llamante sea Superadmin
- [ ] Convertir `profeDiplomado2026` a DOCENTE
- [ ] Validar los 6 casos de prueba
