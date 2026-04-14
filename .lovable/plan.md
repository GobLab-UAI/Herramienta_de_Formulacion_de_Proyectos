

## Plan: UI Text and Structure Updates

### Changes Overview

**1. Topbar brand name** (Topbar.tsx, AuthLayout.tsx)
- Change "GobLab Ficha" to "Portal de Evaluación de Proyectos de IA" in both the dashboard topbar and the auth layout left panel.

**2. Dashboard footer** (Dashboard.tsx, line 264-266)
- Replace current long text with:
  > Desarrollado por el GobLab UAI. Proyecto financiado por el Laboratorio de Gobierno y el Servicio Civil, en colaboración con el Center for Data Science and Public Policy de la Universidad de Chicago.
  > Licencia CC BY-SA 3.0 · goblab.uai.cl

**3. "Formular proyecto" buttons** (Dashboard.tsx)
- Change both "Nuevo proyecto" (line 189) and "Crear proyecto" (line 236) to "Formular proyecto".

**4. Remove green + icon in empty state** (Dashboard.tsx)
- Remove the `<Plus>` icon inside the rounded circle (lines 221-224) in the empty state view.

**5. Renumber sections 1-10** (formSections.ts)
- Portada (P) becomes **1** with title "Datos del Proyecto"
- Section 4 becomes **2** (Definicion del Problema)
- Section 5 becomes **3** (Analisis de Prefactibilidad)
- Section 6 becomes **4** (Objetivos)
- Section 7 becomes **5** (Actividades)
- Section 8 becomes **6** (Mapeo de Datos)
- Section 9 becomes **7** (Analisis)
- Section 10 becomes **8** (Consideraciones Eticas)
- Section 11 becomes **9** (Piloto y Validacion)
- Section 12 becomes **10** (Equipo)
- All field labels (e.g., "4.1" to "2.1", "5.1" to "3.1", etc.) and table labels updated accordingly.

**6. Form header text** (ProjectEditor.tsx)
- Add a subtitle/description at the top of the form document:
  > Completa tu proyecto por etapas. Cada seccion agrupa la informacion necesaria para avanzar en el proceso de formulacion.

**7. Update hints for section 2 (current section 4)** (formSections.ts)
- 2.1: "Describe brevemente la mision, funciones y contexto operativo del area que presenta el proyecto (max 400-500 caracteres)"
- 2.2: "Explica que problema existe y por que es relevante. Evita incluir la solucion; esta se aborda al final de la seccion."
- 2.3: "Identifica las causas principales del problema. Si no tienes toda la informacion, describe las causas que se conocen."
- 2.4: "Selecciona los grupos afectados y describe brevemente como se relacionan con el problema"
- 2.5: "Ingresa la cantidad de personas u organizaciones afectadas. Puedes desagregar segun los criterios disponibles (edad, genero, territorio, etc.)."
- 2.6: "Describe la intensidad o severidad del problema usando un indicador cuantitativo cuando sea posible."
- 2.7: "Explica que acciones existen hoy para enfrentar el problema y por que no son suficientes."
- 2.8: Change hint to reference named links "Algoritmos Publicos" and "Data Science for Social Good" instead of raw URLs.

**8. Fix section number display** (ProjectEditor.tsx)
- Remove the `section.number !== "P"` check (line 446) since there's no longer a "P" section; all sections now have numeric numbers.

### Files to modify
- `src/components/Topbar.tsx` - brand name
- `src/components/AuthLayout.tsx` - brand name in auth panel
- `src/pages/Dashboard.tsx` - footer, button labels, remove + icon
- `src/lib/formSections.ts` - section renumbering, title change, hint updates
- `src/pages/ProjectEditor.tsx` - form header text, remove "P" check

