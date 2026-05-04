# Colaboración multi-usuario en proyectos

Permitir que varios formuladores se unan a un mismo proyecto usando un **código único** (3 letras + 3 números, ej. `ABC123`), con un **rol personalizado** que se identifique en el historial y comentarios.

## Modelo de datos (migración)

1. `**projects.join_code**` — `text unique not null`, generado al crear el proyecto.
  - Formato: 3 letras mayúsculas + 3 dígitos (`ABC123`). Trigger `before insert` lo genera y reintenta si colisiona.
2. **Reusar `project_members**` (ya existe) y agregarle:
  - `custom_role text` — rol libre que el usuario escribe al unirse (ej. "Líder de TI", "Científico de Datos"). Sugeriremos opciones predefinidas pero el campo es abierto.
  - El owner original queda con `is_owner = true` y `custom_role = 'Creador del proyecto'` (vía trigger en creación).
3. `**field_history**` ya guarda `changed_by`. Bastará con hacer `join` a `project_members` para mostrar el `custom_role` del autor en el historial.
4. `**comments**`: misma idea — el `author_id` se cruza con `project_members` para mostrar el rol del comentarista.

## Reglas RLS (clave)

Se reescriben para que los miembros del proyecto tengan acceso, no sólo el creador:

- `projects` SELECT/UPDATE: permitir si `auth.uid() = created_by` **o** existe fila en `project_members` con ese `user_id` y `project_id` **o** es CONSULTOR.
- `form_responses`, `comments`, `field_history`, `notifications`: SELECT/INSERT/UPDATE permitidos a miembros del proyecto.
- Función security-definer `is_project_member(user_id, project_id)` ya existe — la usamos en todas las políticas para evitar recursión.

## Flujo de UI

### a) Al crear proyecto

- Mostrar modal con el código generado y botón "Copiar". Texto: "Comparte este código con tu equipo para que se unan."

### b) Card del proyecto en Dashboard

- Mostrar el código en chip junto al título (visible para owner/miembros).
- Menú de acciones gana opción "Gestionar equipo".

### c) Botón global "Unirse a un proyecto" en Dashboard

- Abre diálogo con dos campos:
  - Código (input con máscara `AAA000`).
  - Mi rol en el proyecto (input libre + sugerencias: Líder de proyecto, Administrador de recursos, Líder de TI, Coordinador de ciencia de datos, Científico de datos).
- Al confirmar: busca el proyecto por `join_code`, inserta en `project_members` con el `custom_role` y redirige al editor.

### d) Dashboard: query

- Reemplazar el filtro `created_by = user.id` por: proyectos donde `created_by = user.id` **OR** existe membresía. Mostrar badge "Miembro · {custom_role}" cuando el usuario no sea el creador.

### e) Página/Drawer "Equipo del proyecto" (dentro del editor)

- Lista de miembros con avatar, nombre, `custom_role`, fecha de ingreso.
- El owner puede: cambiar rol de un miembro, expulsar.
- Cualquier miembro puede editar su propio `custom_role`.

### f) Comentarios e historial

- En `CommentBubble` y `CommentHistorySidebar`: junto al nombre mostrar `· {custom_role}` (ej. "María · Científica de Datos").
- En el sidebar de historial de cambios de un campo, cada entrada muestra `quién (rol) · cuándo · valor anterior → valor nuevo`.

### g) Historial de cambios por campo (mejora)

- Hoy `field_history` se inserta pero no hay UI dedicada. Añadir un botón "Ver historial" en cada campo (icono reloj) que abra un popover con las últimas N versiones, mostrando autor + rol.

## Detalles técnicos

- **Generación de código** (SQL):
  ```sql
  create or replace function gen_join_code() returns text language plpgsql as $$
  declare letters text := 'ABCDEFGHJKLMNPQRSTUVWXYZ'; digits text := '0123456789'; code text;
  begin
    loop
      code := substr(letters,1+floor(random()*24)::int,1)||substr(letters,1+floor(random()*24)::int,1)||substr(letters,1+floor(random()*24)::int,1)
            ||substr(digits,1+floor(random()*10)::int,1)||substr(digits,1+floor(random()*10)::int,1)||substr(digits,1+floor(random()*10)::int,1);
      exit when not exists (select 1 from projects where join_code = code);
    end loop;
    return code;
  end$$;
  ```
  Trigger `before insert on projects` que setea `join_code` si es null y crea el row de `project_members` para el creador.
- **Cliente**: nueva carpeta `src/components/team/` con `JoinProjectDialog.tsx`, `TeamPanel.tsx`, `JoinCodeBadge.tsx`. Hooks `useProjectMembers(projectId)`, `useJoinProject()`.
- **Seguridad**: validar formato del código en cliente con regex `/^[A-Z]{3}\d{3}$/`. Insert en `project_members` se hace desde el cliente porque la RLS exige `auth.uid() = user_id` y existencia del proyecto con ese código (policy con `exists (select 1 from projects where id = project_id)`).

## Archivos a crear / editar

- **Migración** nueva (columnas + trigger + RLS rewrites).
- `src/pages/Dashboard.tsx` — botón "Unirse a un proyecto", query incluye membresías, modal con código al crear.
- `src/pages/ProjectEditor.tsx` — botón "Equipo", mostrar `custom_role` junto al autor, historial de campo enriquecido.
- `src/components/ProjectCard.tsx` — chip con código, badge de rol propio.
- `src/components/team/JoinProjectDialog.tsx` (nuevo).
- `src/components/team/TeamPanel.tsx` (nuevo).
- `src/components/editor/CommentBubble.tsx` y `CommentHistorySidebar.tsx` — anexar rol al nombre del autor.
- `src/contexts/AuthContext.tsx` — sin cambios (los roles de proyecto se leen por proyecto, no global).

## Decisiones a confirmar antes de implementar

1. Formato del código: confirmamos **3 letras + 3 números** (ej. `ABC123`). ¿OK o prefieres 6 dígitos? -R: quiero las 3 letras + 3 numeros
2. ¿Los CONSULTORES también pueden unirse con código, o sólo formuladores? solo los formuladores los consultores es un único rol. 
3. Al expulsar a un miembro, ¿qué pasa con sus comentarios e historial? Propuesta: se mantienen (auditoría). -> se deben mantener en una auditoria.
4. ¿Quieres también notificación in-app cuando alguien se une al proyecto? -> siii, que cuando alguien se una entonces le notifique al owner quien se ha unido y a qué proyecto.