

## Plan: Multiple UI Text and Content Updates

### Changes Summary

**1. Section 4 (Objetivos) - Table header** (`formSections.ts` line 98)
- Change `"#"` to `"N°"` in headers array.

**2. Section 5 (Actividades) - Title and table label** (`formSections.ts` lines 106, 181)
- Change title from `"Actividades"` to `"Actividades del proceso"`.
- In `DynamicTable.tsx` line 181: change `"Momento"` to `"Etapa del Proyecto"`.
- In `exportPdf.ts` line 414: change `"Momento"` to `"Etapa del Proyecto"`.

**3. AuthLayout - HOME text updates** (`AuthLayout.tsx`)
- Line 25: Replace `"Diseña proyectos de IA y ciencia de datos para el sector público"` with `"Diseña proyectos de IA y ciencia de datos viables y responsables"`.
- Add mention to ANID project (e.g., below the subtitle or as part of the footer text).
- Line 32: Replace `"GobLab UAI"` with `"GobLab Ficha de Proyecto"` (or add it alongside).
- Add GobLab and Herramientas Algoritmos Eticos logos. Since we don't have actual logo files, we'll use the existing SVG logo and add a text reference for "Herramientas Algoritmos Eticos", or place placeholder image tags if URLs are provided.

**4. Register - "Entidad" to "Organización"** (`Register.tsx` line 76)
- Change label from `"Entidad"` to `"Organización"`.
- Update placeholder accordingly.

**5. Dashboard - Subtitle text** (`Dashboard.tsx` line 178)
- Change `"Gestiona y formula tus proyectos..."` to `"Formula tus proyectos de IA y ciencia de datos"`.

**6. Section 1 (Datos del Proyecto) - Fecha hint and Equipo placeholder** (`formSections.ts`)
- Add hint to fecha field: `"Fecha inicio de formulación de proyecto"`.
- Add hint to equipo field as placeholder text: `"Escribe los nombres y apellidos de los integrantes del equipo que está formulando el proyecto"`.

**7. Section 2 (Definición del Problema) - 2.8 hint** (`formSections.ts` line 74)
- Update hint to include the new link (Algoritmos de IA en America Latina from UniAndes) and change algoritmospublicos.cl to point to `/repositorio`: `"Revisar Algoritmos Públicos, Data Science for Social Good y Algoritmos de IA en América Latina."`.

**8. Section 3 (Prefactibilidad) - 3.2 question text** (`formSections.ts` line 83)
- Change label to: `"3.2 ¿Tendrá que asociarse con otras organizaciones públicas o privadas? ¿Cuáles?"`.

**9. Section 3 (Prefactibilidad) - 3.4 hint** (`formSections.ts` line 85)
- Change hint from `"¿Están desagregados por género, edad, etnia, territorio?"` to `"¿Están desagregados según las dimensiones de la población afectada?"`.

### Clarification needed
- For the GobLab and Herramientas Algoritmos Eticos logos: do you have image URLs or files to use? I can place the existing SVG GobLabLogo and add a text label for now.
- For the ANID mention: what specific text should appear? (e.g., "Proyecto financiado por ANID" or a specific grant number?)

### Files to modify
- `src/lib/formSections.ts` — section titles, table headers, hints, question labels
- `src/components/editor/DynamicTable.tsx` — "Momento" to "Etapa del Proyecto"
- `src/lib/exportPdf.ts` — "Momento" to "Etapa del Proyecto"
- `src/components/AuthLayout.tsx` — HOME text, logos, ANID mention
- `src/pages/Register.tsx` — "Entidad" to "Organización"
- `src/pages/Dashboard.tsx` — subtitle text

