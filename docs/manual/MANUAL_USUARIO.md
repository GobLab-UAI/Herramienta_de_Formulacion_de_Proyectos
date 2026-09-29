# Manual de Usuario

## Herramienta de Formulación de Proyectos de IA y Ciencia de Datos — GobLab UAI

**Versión de la aplicación:** v1.2.0 · **Manual actualizado:** septiembre de 2026

---

## Tabla de contenidos

1. [¿Qué es esta herramienta?](#1-qué-es-esta-herramienta)
2. [Conceptos clave: roles y estados](#2-conceptos-clave-roles-y-estados)
3. [Acceso a la plataforma](#3-acceso-a-la-plataforma)
   - 3.1 [Crear una cuenta (registro)](#31-crear-una-cuenta-registro)
   - 3.2 [Iniciar sesión](#32-iniciar-sesión)
4. [El Panel de Proyectos (Dashboard)](#4-el-panel-de-proyectos-dashboard)
5. [Crear y formular un proyecto](#5-crear-y-formular-un-proyecto)
   - 5.1 [El editor de proyecto](#51-el-editor-de-proyecto)
   - 5.2 [Guardado de tu trabajo](#52-guardado-de-tu-trabajo)
   - 5.3 [Las 9 secciones del formulario](#53-las-9-secciones-del-formulario)
   - 5.4 [Cómo usar las tablas dinámicas](#54-cómo-usar-las-tablas-dinámicas)
6. [Trabajo en equipo (colaboración)](#6-trabajo-en-equipo-colaboración)
   - 6.1 [Invitar colaboradores con un código](#61-invitar-colaboradores-con-un-código)
   - 6.2 [Unirse a un proyecto existente](#62-unirse-a-un-proyecto-existente)
   - 6.3 [Gestionar el equipo](#63-gestionar-el-equipo)
7. [Comentarios y revisión](#7-comentarios-y-revisión)
   - 7.1 [Dejar y responder comentarios](#71-dejar-y-responder-comentarios)
   - 7.2 [El panel de Historial](#72-el-panel-de-historial)
8. [Flujo de estados de un proyecto](#8-flujo-de-estados-de-un-proyecto)
9. [Exportar a PDF](#9-exportar-a-pdf)
10. [Guía para el Consultor / Revisor](#10-guía-para-el-consultor--revisor)
11. [Guía para el Docente](#11-guía-para-el-docente)
12. [Guía para el Superadmin: Gestión de usuarios](#12-guía-para-el-superadmin-gestión-de-usuarios)
13. [Conexión con asistentes de IA (MCP)](#13-conexión-con-asistentes-de-ia-mcp)
14. [Preguntas frecuentes (FAQ)](#14-preguntas-frecuentes-faq)

---

## 1. ¿Qué es esta herramienta?

Es una aplicación web que te acompaña en la **formulación, diseño y evaluación de prefactibilidad de proyectos de Inteligencia Artificial y Ciencia de Datos**, siguiendo la metodología del **GobLab UAI** (Escuela de Gobierno de la Universidad Adolfo Ibáñez).

La herramienta te guía, paso a paso, a través de una **ficha estructurada en 9 secciones** que cubren desde la definición del problema hasta las consideraciones éticas del proyecto. Permite:

- Completar la ficha de forma colaborativa con tu equipo.
- Recibir comentarios y observaciones de revisores/consultores.
- Llevar un historial de cambios y de comentarios.
- Exportar el proyecto terminado a un documento **PDF**.

> La ficha está basada en el trabajo original del *Center for Data Science and Public Policy* de la Universidad de Chicago, actualizada por el GobLab UAI y colaboradores. Se distribuye bajo licencia **Creative Commons CC BY-SA 3.0**.

---

## 2. Conceptos clave: roles y estados

Antes de empezar conviene entender dos ideas centrales.

### Roles de usuario

| Rol | Cómo se obtiene | Qué puede hacer |
|-----|-----------------|-----------------|
| **Formulador** | Es el rol por defecto al registrarte. | Crear proyectos, editar todo el formulario, invitar colaboradores, dejar comentarios, enviar a revisión, exportar PDF y eliminar sus proyectos. |
| **Comentarista** | Se asigna al unirte a un proyecto eligiendo esta opción. | Leer el formulario y dejar comentarios. **No puede editar** el texto del formulario. |
| **Consultor (Revisor)** | Cuenta administrativa especial otorgada por el GobLab. | Ver **todos** los proyectos de todos los formuladores, comentarlos, aprobarlos y restaurar proyectos eliminados. No edita el contenido. |
| **Docente** | Cuenta creada por el Superadmin (no se registra sola). | Unirse a proyectos con un código, leerlos, **comentarlos** y **aprobarlos**. Organiza sus proyectos en **carpetas**. No crea ni edita proyectos. |
| **Superadmin** | Cuenta administrativa del GobLab. | Ve todos los proyectos, crea y elimina cuentas desde **Gestión de usuarios** y puede eliminar proyectos definitivamente. |

> Cada miembro de un proyecto también tiene un **rol descriptivo libre** (por ejemplo "Científico de Datos", "Líder de TI", "Líder de proyecto"), que sirve únicamente para identificar su función dentro del equipo.

### Estados de un proyecto

| Estado | Significado |
|--------|-------------|
| **Borrador** | El proyecto se está formulando. Es el estado inicial. |
| **En revisión** | El formulador lo envió para que un consultor lo revise. |
| **Con observaciones** | El revisor devolvió el proyecto con comentarios por resolver. |
| **Aprobado** | El proyecto fue validado por un consultor o docente. Solo en este estado se puede **exportar el PDF**. |
| **Archivado** | Estado de cierre/inactivo. |

---

## 3. Acceso a la plataforma

### 3.1 Crear una cuenta (registro)

Solo los **formuladores** se registran por sí mismos. Los docentes reciben su cuenta del Superadmin (ver sección 12). Para crear tu cuenta:

1. Entra a la página de inicio de sesión y haz clic en **"Regístrate como formulador"**.
2. Completa el formulario:
   - **Nombre de usuario** *(obligatorio)* — con este nombre iniciarás sesión (ej. `jperez`).
   - **Nombre completo** *(obligatorio)*.
   - **Correo electrónico** *(obligatorio)*.
   - **Cargo** *(opcional)* — por ejemplo "Analista de datos".
   - **Organización** *(opcional)* — la entidad a la que perteneces.
   - **Contraseña** *(obligatoria)* — mínimo **6 caracteres**.
3. Haz clic en **"Crear cuenta"**. Quedarás autenticado y entrarás directamente a tu panel de proyectos.

> 💡 Recuerda tu **nombre de usuario**: lo necesitarás para iniciar sesión (no se ingresa el correo, sino el usuario).

### 3.2 Iniciar sesión

1. En la pantalla de inicio, ingresa tu **nombre de usuario** y tu **contraseña**.
2. Haz clic en **"Ingresar"**.

Si las credenciales son incorrectas, la aplicación te avisará. Verifica tu nombre de usuario y contraseña.

> Si llegaste al inicio de sesión desde un enlace directo (por ejemplo, al autorizar una conexión externa), al ingresar volverás automáticamente a esa página.

---

## 4. El Panel de Proyectos (Dashboard)

Al iniciar sesión llegas al panel principal. Lo que ves depende de tu rol:

- **Como formulador** verás **"Mis Proyectos"**: la lista de proyectos que creaste o a los que te uniste.
- **Como consultor o Superadmin** verás **"Todos los Proyectos"**: los proyectos de todos los formuladores.
- **Como docente** verás **"Proyectos asignados"**: los proyectos a los que te uniste con un código de invitación, organizados en carpetas (ver sección 11).

Cada proyecto se muestra como una **tarjeta** con:

- **Título** y **organización**.
- **Estado** (Borrador, En revisión, etc.).
- **Barra de progreso** (porcentaje de campos obligatorios completados).
- **Fecha** de última modificación.
- **Comentarios pendientes** (si los hay).
- **Código de invitación** y número de **colaboradores** (al pasar el cursor se listan los miembros).

### Herramientas del panel

- **Buscar proyectos:** usa la barra de búsqueda para filtrar por título.
- **Filtros de estado:** botones para mostrar solo *Todos*, *Borrador*, *En revisión*, *Con observaciones* o *Aprobado*.
- **Formular proyecto:** crea un proyecto nuevo (solo formuladores).
- **Unirme a un proyecto:** te integras a un proyecto con un código (formuladores y docentes).

### Acciones sobre cada tarjeta

- **Abrir:** haz clic en la tarjeta para entrar al editor.
- **Enviar a revisión:** disponible si el proyecto está en *Borrador* o *Con observaciones*.
- **Aprobar** (consultores y docentes): disponible en *En revisión* y *Con observaciones*. El botón queda **deshabilitado mientras haya comentarios pendientes**; al pasar el cursor aparece el aviso "Resuelve todos los comentarios para poder aprobar".
- **Eliminar** (icono de papelera): elimina el proyecto de tu lista. Es un **borrado suave**: un consultor puede restaurarlo después.
- **Eliminar definitivamente** (solo Superadmin): borra el proyecto con todas sus respuestas, comentarios, historial y miembros. **No se puede deshacer.**

---

## 5. Crear y formular un proyecto

Para crear un proyecto nuevo, en el panel haz clic en **"Formular proyecto"**. Se creará un proyecto llamado *"Nuevo Proyecto"* y entrarás automáticamente al editor.

### 5.1 El editor de proyecto

El editor tiene tres zonas:

```
┌─────────────────────────────────────────────────────────────┐
│  BARRA SUPERIOR: título · rol · estado · acciones           │
├──────────────┬──────────────────────────────┬───────────────┤
│              │                              │               │
│  MENÚ DE     │   DOCUMENTO (formulario)      │  PANEL DE     │
│  SECCIONES   │   con las 9 secciones         │  HISTORIAL    │
│  (izquierda) │                              │  (opcional)   │
│              │                              │               │
└──────────────┴──────────────────────────────┴───────────────┘
```

**Barra superior** — contiene:
- El **título del proyecto** (editable haciendo clic sobre él).
- Una etiqueta con tu **rol** (Formulador / Comentarista / Consultor / Docente).
- El **estado** del proyecto.
- Botones de acción: **Guardar**, **Exportar PDF** (activo solo cuando el proyecto está *Aprobado*), **Historial**, **Equipo**, **Enviar a revisión** / **Aprobar** (según corresponda; *Aprobar* se habilita cuando no quedan comentarios pendientes), e indicador de **estado de guardado**.

**Menú de secciones (izquierda)** — muestra las 9 secciones del formulario con:
- Un indicador de **progreso general** en la parte superior.
- Una **marca de verificación (✓)** en las secciones con todos sus campos obligatorios completos.
- El conteo `X/Y` de campos obligatorios por completar.
- Una **insignia ámbar** con el número de comentarios pendientes.

Haz clic en cualquier sección para desplazarte a ella.

**Documento central** — es donde respondes el formulario, organizado en secciones.

### 5.2 Guardado de tu trabajo

No necesitas preocuparte por perder información:

- **Guardado automático** cada 30 segundos.
- **Guardado manual:** botón **"Guardar"** o atajo de teclado **Ctrl + S** (**⌘ + S** en Mac).
- El indicador en la barra superior muestra el estado: *Guardado ✓*, *Guardando…*, *Sin guardar* o *Error ⚠️*.

> El **porcentaje de avance** se recalcula automáticamente al guardar, según cuántos campos obligatorios hayas completado.
>
> El campo **Fecha** de la portada se completa solo con la fecha de hoy (según tu zona horaria) y queda guardado como una respuesta más; es la misma fecha que verás en el PDF.

### 5.3 Las 9 secciones del formulario

El formulario sigue la metodología del GobLab. Cada pregunta incluye **pistas (💡)** que te orientan sobre qué responder. Los campos marcados como obligatorios cuentan para el porcentaje de avance.

| # | Sección | Qué se completa |
|---|---------|-----------------|
| **1** | **Datos del Proyecto** | Nombre del proyecto, organización, fecha e integrantes del equipo de diseño (tabla). |
| **2** | **Conformación de equipo** | Tabla con las áreas/organizaciones participantes y la contraparte (responsables de datos, TI, legal, analítica, etc.). |
| **3** | **Definición del Problema** | Contexto institucional, descripción del problema, sus causas, afectados, cuántos y cuánto les afecta, medidas actuales y referencias a proyectos similares. |
| **4** | **Análisis de Prefactibilidad** | Facultades legales, posibles asociaciones, prioridad del problema, disponibilidad de datos, recursos y riesgos. |
| **5** | **Objetivos** | Tabla de objetivos del proyecto (medibles, no la solución técnica) y sus limitaciones. |
| **6** | **Actividades del proceso** | Tabla de actividades que ejecutan las personas (antes / durante / después), no pasos de ciencia de datos. |
| **7** | **Mapeo de Datos** | Datos internos disponibles, datos de fuentes externas y datos ideales que se querrían obtener. |
| **8** | **Análisis** | Tabla con los análisis planificados: tipo, propósito, actividades asociadas y cómo se validarán. |
| **9** | **Consideraciones Éticas** | Preguntas agrupadas en: Proporcionalidad, Licencia Social, Protección de Datos, Transparencia, Discriminación/Equidad y Responsabilidad. |

> 💡 Consejos de la metodología que aparecen en las pistas:
> - En **Objetivos**: la solución técnica **no** es el objetivo; debe ser **medible** (usa verbos como aumentar, reducir, mejorar).
> - En **Actividades**: describe tareas que hacen las **personas**, no etapas de ciencia de datos.
> - En **Análisis**: el análisis no es el objetivo; elige el adecuado para el problema y define cómo lo validarás.

### 5.4 Cómo usar las tablas dinámicas

Varias secciones usan tablas que puedes ampliar. Hay tres tipos:

- **Tablas de filas dinámicas** (ej. equipo, objetivos, medidas actuales): escribe en cada celda y usa **"Agregar fila"** para añadir más. El icono de papelera elimina una fila. La columna **#** se numera automáticamente.
- **Tablas de columnas dinámicas** (ej. mapeo de datos, análisis): las filas son campos fijos (Nombre, ¿Qué contiene?, etc.) y cada **columna** es una base de datos o análisis. Usa **"Agregar columna"** para añadir más.
- **Tabla de actividades** (sección 6): tiene una estructura especial con tres momentos — **ANTES**, **DURANTE** y **DESPUÉS** — y una columna por cada actividad. Puedes **nombrar cada actividad**, **agregar actividades** y **eliminarlas**.

Las celdas se **expanden automáticamente** a medida que escribes, para que veas todo el texto.

---

## 6. Trabajo en equipo (colaboración)

Los proyectos pueden formularse entre varias personas.

### 6.1 Invitar colaboradores con un código

Cada proyecto tiene un **código de invitación** único de 6 caracteres (3 letras + 3 números, por ejemplo `ABC123`).

1. Dentro del editor, haz clic en el botón **"Equipo"** de la barra superior.
2. Se abrirá un panel lateral con el **código de invitación**.
3. Usa el botón de **copiar** y comparte ese código con tus colaboradores.

> El código también aparece en la tarjeta del proyecto en el panel; puedes copiarlo desde ahí.

### 6.2 Unirse a un proyecto existente

Si alguien te compartió un código:

1. En el panel principal, haz clic en **"Unirme a un proyecto"**.
2. Ingresa el **código de 6 caracteres**.
3. Elige **cómo quieres unirte**:
   - **Formulador:** podrás editar el formulario y dejar comentarios.
   - **Comentarista:** solo podrás leer y comentar (no editas el texto).
4. Indica **tu rol en el proyecto** (texto libre; hay sugerencias como "Científico de Datos", "Líder de TI", etc.).

> Si eres **docente**, no se te pregunta cómo unirte ni tu rol: siempre entras como **Docente**, con permiso para leer y comentar, sin editar el formulario.
5. Haz clic en **"Unirme"**. Entrarás directamente al proyecto.

### 6.3 Gestionar el equipo

En el panel **"Equipo"** (dentro del editor) verás la lista de miembros, cada uno con su nombre y rol descriptivo. Allí puedes:

- **Editar tu propio rol** descriptivo (icono de lápiz).
- Si eres el **dueño del proyecto** (el creador, marcado con una 👑), puedes **remover** a otros miembros.

---

## 7. Comentarios y revisión

Los comentarios permiten dar retroalimentación campo por campo. Pueden dejarlos los **consultores**, los **docentes** y los **comentaristas** (y también los formuladores pueden responder).

### 7.1 Dejar y responder comentarios

1. Pasa el cursor sobre cualquier pregunta o tabla: aparecerá un **icono de globo de comentario (💬)**.
2. Haz clic en el icono para abrir el cuadro de comentario junto al campo.
3. Escribe tu comentario y pulsa **"Comentar"**.
4. Sobre un comentario existente puedes:
   - **Responder** — para abrir una conversación (hilo).
   - **Resolver** — para marcarlo como atendido.
   - **Eliminar** — para retirarlo.

Los campos con comentarios pendientes muestran el globo resaltado en color **ámbar**, y el menú lateral indica cuántos comentarios pendientes tiene cada sección. La barra superior muestra el total de **comentarios pendientes** del proyecto.

> Un proyecto **no se puede aprobar mientras tenga comentarios pendientes**. Las **respuestas** dentro de un hilo no cuentan como pendientes: solo los comentarios principales sin resolver bloquean la aprobación.

### 7.2 El panel de Historial

El botón **"Historial"** (barra superior) abre un panel lateral con cuatro pestañas:

- **Pend.** — comentarios pendientes por resolver.
- **Resueltos** — comentarios ya resueltos.
- **Elim.** — comentarios eliminados.
- **Cambios** — el **historial de modificaciones** de cada campo (qué se cambió, quién lo cambió y cuándo). Para las tablas se muestra un resumen del cambio.

Al hacer clic en el nombre de un campo dentro del historial, el editor te lleva directamente a ese campo en el documento.

---

## 8. Flujo de estados de un proyecto

El ciclo de vida típico de un proyecto es:

```
  BORRADOR  ──"Enviar a revisión"──▶  EN REVISIÓN
     ▲                                     │
     │                                     ├──"Aprobar" (consultor)──▶ APROBADO
     │                                     │
     └──── CON OBSERVACIONES ◀─────────────┘
            (devuelto con comentarios)
```

- **Formulador:** desde *Borrador* o *Con observaciones*, usa **"Enviar a revisión"** (en la tarjeta del panel o en la barra del editor).
- **Consultor o docente:** desde *En revisión* o *Con observaciones*, usa **"Aprobar"** para validar el proyecto. El botón se habilita solo cuando **no quedan comentarios pendientes**.

---

## 9. Exportar a PDF

El PDF se puede generar **cuando el proyecto está *Aprobado***. Antes de eso, el botón aparece deshabilitado y, al pasar el cursor, indica "Disponible cuando el proyecto esté aprobado".

1. En la barra superior del editor, haz clic en **"Exportar PDF"** (mostrará "Generando..." unos segundos).
2. Se descargará un documento con formato de **"Ficha de diseño y factibilidad de proyecto"**, con la identidad del GobLab UAI, todas tus respuestas y las tablas, numeración de páginas y notas de licencia.

La descarga funciona igual en Chrome, Safari y Safari en iPhone. El enlace de descarga es temporal (dura unos minutos); si expira, vuelve a hacer clic en **Exportar PDF**. Si aparece "No se pudo generar el PDF", reintenta en unos segundos.

Es ideal para compartir el proyecto fuera de la plataforma o archivarlo.

---

## 10. Guía para el Consultor / Revisor

El **consultor** es una cuenta administrativa con permisos especiales (la otorga el GobLab; no se crea mediante el registro público).

Como consultor puedes:

- Ver **todos los proyectos** de todos los formuladores en el panel.
- Alternar entre **"Ver activos"** y **"Ver eliminados"**, y **restaurar** proyectos que un formulador haya eliminado.
- Abrir cualquier proyecto en **modo revisión** (solo lectura del contenido).
- **Dejar comentarios y observaciones** campo por campo.
- **Aprobar** proyectos que estén *En revisión* o *Con observaciones*, una vez resueltos todos los comentarios pendientes.

> En modo revisión no se edita el texto del formulario: tu aporte es a través de comentarios y del cambio de estado.

---

## 11. Guía para el Docente

El **docente** acompaña y evalúa los proyectos de sus estudiantes. Su cuenta la crea el Superadmin (ver sección 12); no existe registro público para este rol.

- **Panel "Proyectos asignados":** muestra solo los proyectos a los que te uniste con un código de invitación. Si aún no tienes ninguno, verás "Únete a un proyecto con el código que te comparta el equipo".
- **Unirse a un proyecto:** botón **"Unirme a un proyecto"**. Ingresas el código de 6 caracteres y entras siempre como *Docente* (lectura y comentarios).
- **Comentar y aprobar:** puedes dejar comentarios campo por campo y **aprobar** el proyecto cuando no queden comentarios pendientes.
- **No puedes** crear proyectos ni editar el texto del formulario.

### Carpetas para organizar tus proyectos

Sobre la lista de proyectos verás una barra de carpetas (solo para docentes):

- **Nueva carpeta:** crea una carpeta llamada "Nueva carpeta". Usa el icono de lápiz (**Renombrar**) para ponerle nombre y confirma con el botón **Guardar**.
- **Mover un proyecto:** arrastra la tarjeta del proyecto y suéltala sobre la carpeta.
- **Sin carpeta:** muestra los proyectos que no están en ninguna carpeta. Al hacer clic en una carpeta se filtra la lista.
- **Eliminar carpeta:** borra la carpeta; sus proyectos **no se eliminan**, vuelven a "Sin carpeta".

---

## 12. Guía para el Superadmin: Gestión de usuarios

El **Superadmin** ve un botón **"Gestión de usuarios"** en la barra superior. Esa pantalla permite:

1. **Crear una cuenta docente:** completa *Nombre completo*, *Correo*, *Nombre de usuario* y *Contraseña temporal* (mínimo 8 caracteres) y confirma. El docente ya puede iniciar sesión con esos datos; conviene pedirle que cambie la contraseña temporal.
2. **Ver los docentes registrados:** lista con nombre, usuario y correo. El icono de papelera elimina la cuenta: el docente pierde el acceso a los proyectos a los que se había unido, pero **sus comentarios se conservan**.
3. **Ver todas las cuentas** de la plataforma, con un buscador por nombre, usuario o correo. Desde aquí también se puede eliminar una cuenta: los proyectos y comentarios se conservan.

> La eliminación de cuentas **no se puede deshacer**; la aplicación pide confirmación antes de hacerla.

El Superadmin también puede **eliminar proyectos definitivamente** desde su tarjeta en el panel (ver sección 4).

---

## 13. Conexión con asistentes de IA (MCP)

La plataforma ofrece una conexión opcional con asistentes de IA compatibles con MCP. Al conectarla, tu asistente pide autorización (pantalla de consentimiento con los botones **Autorizar** y **Cancelar**; si no has iniciado sesión, primero te lleva al login y luego vuelve) y, una vez autorizado, puede:

- **Listar** los proyectos a los que tienes acceso.
- **Leer** las respuestas guardadas de un proyecto.
- **Leer** los comentarios de un proyecto.
- **Agregar** un comentario en un campo específico.

Solo ve lo que tu cuenta ya puede ver. Autoriza únicamente asistentes que uses y conozcas.

---

## 14. Preguntas frecuentes (FAQ)

**¿Pierdo mi trabajo si cierro el navegador?**
No. La aplicación guarda automáticamente cada 30 segundos, y puedes forzar el guardado con **Ctrl/⌘ + S**. Verifica que el indicador diga *"Guardado ✓"* antes de salir.

**Olvidé mi nombre de usuario.**
Inicias sesión con tu **nombre de usuario**, no con tu correo. Si no lo recuerdas, contacta al equipo del GobLab para recuperarlo.

**¿Cómo invito a alguien que solo debe opinar, sin editar?**
Comparte el código y pídele que se una eligiendo el rol **"Comentarista"**. Podrá leer y comentar, pero no modificar el formulario.

**No puedo exportar el PDF.**
El PDF solo está disponible cuando el proyecto está **Aprobado**. Un consultor o docente debe resolver los comentarios pendientes y aprobarlo.

**El botón "Aprobar" aparece deshabilitado.**
Quedan comentarios pendientes. Resuélvelos (o pide al formulador que los atienda) y el botón se habilitará.

**Soy docente, ¿cómo creo un proyecto?**
Los docentes no crean proyectos: se unen a los de sus estudiantes con el código de invitación y los revisan.

**Eliminé un proyecto por error.**
El borrado es **reversible**: un consultor puede restaurarlo desde la vista **"Ver eliminados"**.

**¿Qué cuenta para el porcentaje de avance?**
Solo los **campos obligatorios** de la ficha. Puedes ver el detalle por sección en el menú izquierdo del editor (`X/Y`).

**¿Tengo que completar las secciones en orden?**
No. Puedes navegar libremente entre secciones y completarlas en cualquier orden; el progreso se actualiza igual.

---

<sub>Herramienta desarrollada por el **GobLab UAI**. Proyecto financiado por el Laboratorio de Gobierno y el Servicio Civil, en colaboración con el *Center for Data Science and Public Policy* de la Universidad de Chicago. Licencia CC BY-SA 3.0 · [goblab.uai.cl](https://goblab.uai.cl)</sub>
