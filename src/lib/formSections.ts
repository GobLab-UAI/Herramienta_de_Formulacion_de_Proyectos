export interface FormField {
  key: string;
  label: string;
  hint?: string;
  type: "text" | "textarea" | "date" | "table" | "yesno";
  required?: boolean;
  defaultValue?: string;
  // For yesno type: labels for the textarea shown after each choice
  yesDetailLabel?: string;
  noDetailLabel?: string;
}

export interface TableConfig {
  key: string;
  label: string;
  hint?: string;
  type: "dynamic-rows" | "dynamic-cols" | "activities";
  headers?: string[];
  headerHints?: string[];
  rowLabels?: string[];
  initialRows?: number;
  initialCols?: number;
  prefillRows?: string[][];
  colLabel?: string;
}

export interface FormSection {
  id: string;
  number: string;
  title: string;
  globalHint?: string;
  fields: (FormField | TableConfig)[];
}

export const REQUIRED_FIELDS = [
  "portada-nombre", "portada-org",
  "ans-4-1", "ans-4-2", "ans-4-3", "ans-4-4", "ans-4-6", "table-2-7",
  "ans-5-1", "ans-5-4", "ans-5-6",
  "table-6", "table-7", "table-8a", "ans-8-c", "table-9",
  "eth-prop", "eth-lic1", "eth-dat1", "eth-tra1", "eth-eq1", "eth-res1",
  "table-12",
];

export const FORM_SECTIONS: FormSection[] = [
  {
    id: "section-1",
    number: "1",
    title: "Datos del Proyecto",
    fields: [
      { key: "portada-nombre", label: "Nombre del proyecto", type: "text", required: true },
      { key: "portada-org", label: "Organización", type: "text", required: true },
      { key: "portada-fecha", label: "Fecha", type: "date", defaultValue: new Date().toISOString().split("T")[0], hint: "Fecha inicio de formulación de proyecto" },
      {
        key: "portada-equipo",
        label: "Integrantes del Equipo de Diseño del Proyecto",
        type: "dynamic-rows",
        hint: "Ingresa los integrantes del equipo que está formulando el proyecto.",
        headers: ["#", "Nombre completo", "Rol", "Organización/Departamento"],
        initialRows: 3,
      } as TableConfig,
    ],
  },
  {
    id: "section-2",
    number: "2",
    title: "Equipo",
    fields: [
      {
        key: "table-12", label: "Equipo del proyecto", type: "dynamic-rows",
        headers: ["#", "Organización/Departamento", "Descripción de la participación deseada", "Nombre/Rol de la contraparte"],
        initialRows: 4,
      } as TableConfig,
    ],
  },
  {
    id: "section-3",
    number: "3",
    title: "Definición del Problema",
    fields: [
      { key: "ans-4-1", label: "3.1 ¿Cuál es el contexto institucional?", type: "textarea", required: true, hint: "Describe brevemente la misión, funciones y contexto operativo del área que presenta el proyecto (máx 400-500 caracteres)." },
      { key: "ans-4-2", label: "3.2 Describe el problema que enfrentan.", type: "textarea", required: true, hint: "Explica qué problema existe y por qué es relevante. Evita incluir la solución; esta se aborda al final de la sección." },
      { key: "ans-4-3", label: "3.3 ¿Cuáles son las causas del problema?", type: "textarea", required: true, hint: "Identifica las causas principales del problema. Si no tienes toda la información, describe las causas que se conocen." },
      { key: "ans-4-4", label: "3.4 ¿Quiénes o qué son los afectados por el problema?", type: "textarea", required: true, hint: "Menciona los grupos afectados y describe brevemente cómo se relacionan con el problema." },
      {
        key: "table-4-5", label: "3.5 ¿Cuántos son afectados?", type: "dynamic-rows",
        hint: "Ingresa la cantidad de personas u organizaciones afectadas. Puedes desagregar según los criterios disponibles (edad, género, territorio, etc.).",
        headers: ["Dimensión", "Grupo/Categoría", "N° estimado de afectados", "Fuente/Año"],
        prefillRows: [
          ["Total", "", "", ""],
          ["Género", "", "", ""],
          ["Territorio", "", "", ""],
          ["Edad", "", "", ""],
          ["Etnia", "", "", ""],
        ],
      } as TableConfig,
      { key: "ans-4-6", label: "3.6 ¿Cuánto les afecta?", type: "textarea", required: true, hint: "Describe la intensidad o severidad del problema usando un indicador cuantitativo cuando sea posible." },
      {
        key: "table-2-7",
        label: "3.7 ¿Cuáles son las medidas actuales para abordar el problema y sus deficiencias?",
        type: "dynamic-rows",
        hint: "Lista las medidas actuales y, en cada una, indica sus limitaciones o brechas. Puedes agregar tantas filas como necesites.",
        headers: ["Medida actual", "Limitaciones o brechas"],
        headerHints: [
          "Describe las acciones, programas o procesos que existen hoy para enfrentar el problema",
          "Explica por qué las medidas actuales no resuelven el problema o qué aspectos quedan pendientes",
        ],
        initialRows: 3,
      } as TableConfig,
      { key: "ans-4-8", label: "3.8 ¿Cómo otros proyectos han utilizado la ciencia de datos o IA para resolver problemas similares?", type: "textarea", hint: "Revisar Algoritmos Públicos (algoritmospublicos.cl/repositorio), Data Science for Social Good (dssgfellowship.org/projects) y Algoritmos de IA en América Latina (algoritmos.uniandes.edu.co)." },
    ],
  },
  {
    id: "section-4",
    number: "4",
    title: "Análisis de Prefactibilidad",
    fields: [
      { key: "ans-5-1", label: "4.1 ¿Qué facultades tiene la institución para actuar sobre el problema?", type: "textarea", required: true, hint: "Cita la norma legal que habilita la intervención." },
      {
        key: "ans-5-2",
        label: "4.2 ¿Tendrá que asociarse con otras organizaciones públicas o privadas?",
        type: "yesno",
        yesDetailLabel: "Indica el nombre de las entidades y su rol en el proyecto.",
        noDetailLabel: "Fundamenta la respuesta.",
      },
      { key: "ans-5-3", label: "4.3 ¿Dónde se ha manifestado que es prioritario resolver el problema?", type: "textarea", hint: "Indica en qué documentos, planes o compromisos institucionales se establece que este problema es prioritario." },
      { key: "ans-5-4", label: "4.4 ¿Existen, y podemos acceder a los datos relevantes? ¿Están desagregados según las dimensiones de la población afectada?", type: "textarea", required: true },
      { key: "ans-5-5", label: "4.5 ¿Tenemos los recursos humanos y financieros para llevar a cabo el proyecto?", type: "textarea" },
      { key: "ans-5-6", label: "4.6 ¿Cuáles son los riesgos del proyecto?", type: "textarea", required: true, hint: "Considera: éticos (sesgos, privacidad), licencia social, implementación, datos, técnicos y políticos." },
    ],
  },
  {
    id: "section-5",
    number: "5",
    title: "Objetivos",
    globalHint: "La solución técnica NO es el objetivo. Debe ser medible. Usa verbos: aumentar, disminuir, mejorar, reducir. Considera trade-offs.",
    fields: [
      {
        key: "table-6", label: "Objetivos del proyecto", type: "dynamic-rows",
        headers: ["#", "Objetivo", "Limitaciones"],
        initialRows: 3,
      } as TableConfig,
    ],
  },
  {
    id: "section-6",
    number: "6",
    title: "Actividades del proceso",
    globalHint: "Las actividades son tareas que ejecuta una persona en la institución. NO incluyas pasos de ciencia de datos.",
    fields: [
      {
        key: "table-7", label: "Tabla de actividades", type: "activities",
        initialCols: 2,
      } as TableConfig,
    ],
  },
  {
    id: "section-7",
    number: "7",
    title: "Mapeo de Datos",
    globalHint: "Los datos tienen que conectarse con las actividades que respaldan, de modo que la organización pueda alcanzar su objetivo.\n\nLos proyectos típicos de ciencia de datos usan datos administrativos como la fuente primaria de datos y la mejoran con fuentes de datos disponibles públicamente (censo, otros datos abiertos). La asociación con el sector privado u organizaciones sin fines de lucro podría ser una forma de obtener datos que podrían faltar a nivel interno.",
    fields: [
      {
        key: "table-8a", label: "7.A ¿Qué datos tienes internamente?", type: "dynamic-cols",
        rowLabels: ["Nombre", "¿Qué contiene?", "Nivel de granularidad", "Frecuencia de actualización", "Identificadores únicos", "Responsable", "¿Cómo se almacena?", "Comentarios adicionales"],
        initialCols: 2,
        colLabel: "Base de datos",
      } as TableConfig,
      {
        key: "table-8b", label: "7.B ¿Qué datos puedes obtener de fuentes externas, privadas o públicas?", type: "dynamic-cols",
        rowLabels: ["Nombre", "¿Qué contiene?", "Nivel de granularidad", "Frecuencia de actualización", "Identificadores únicos", "Responsable", "¿Cómo se almacena?", "¿Son necesarios acuerdos legales para el acceso?", "Comentarios adicionales"],
        initialCols: 2,
        colLabel: "Base de datos",
      } as TableConfig,
      { key: "ans-8-c", label: "7.C En un mundo ideal, ¿qué datos adicionales querrías obtener?", type: "textarea", required: true, hint: "Encuestas, CCTV, registros telefónicos, ADN, diferente frecuencia o granularidad. Sé ambicioso." },
    ],
  },
  {
    id: "section-8",
    number: "8",
    title: "Análisis",
    globalHint: "Tipos comunes: descripción, predicción, detección, optimización, cambio de comportamiento.",
    fields: [
      {
        key: "table-9", label: "Análisis planificados", type: "dynamic-cols",
        rowLabels: ["Tipo de análisis", "Propósito del análisis", "¿Qué actividades utilizarán este análisis?", "¿Cómo se validará? (incluye la prueba de campo o ensayo aleatorio controlado que se diseñará para validar el proyecto: alcance, duración y criterios de éxito alineados con los objetivos de la sección 4)"],
        initialCols: 3,
        colLabel: "Análisis",
      } as TableConfig,
    ],
  },
  {
    id: "section-9",
    number: "9",
    title: "Consideraciones Éticas",
    fields: [
      { key: "eth-prop", label: "⚖️ Proporcionalidad — ¿Es la ciencia de datos/IA el medio adecuado? ¿Evaluaste alternativas?", type: "textarea", required: true },
      { key: "eth-imp", label: "⚖️ Proporcionalidad — ¿Qué impactos negativos podría tener el proyecto?", type: "textarea" },
      { key: "eth-lic1", label: "🤝 Licencia Social — ¿Los usuarios/afectados encontrarán aceptable el uso de datos? ¿Por qué?", type: "textarea", required: true },
      { key: "eth-lic2", label: "🤝 Licencia Social — Si la población completa del país se entera, ¿lo aprobará? ¿Por qué?", type: "textarea" },
      { key: "eth-dat1", label: "🔒 Protección de Datos — ¿Estás trabajando con datos personales y/o sensibles identificables? ¿Cuáles?", type: "textarea", required: true },
      { key: "eth-dat2", label: "🔒 Protección de Datos — ¿Identificaste la base legal? ¿Necesitas mecanismos para garantizar derechos?", type: "textarea" },
      { key: "eth-tra1", label: "👁 Transparencia — ¿Qué partes interesadas deben estar al tanto?", type: "textarea", required: true },
      { key: "eth-tra2", label: "👁 Transparencia — ¿Hay mecanismo de comunicación y reclamos para las partes interesadas?", type: "textarea" },
      { key: "eth-eq1", label: "⚖️ Discriminación / Equidad — ¿Qué inequidades de base existen en el entorno del proyecto?", type: "textarea", required: true },
      { key: "eth-eq2", label: "⚖️ Discriminación / Equidad — ¿Existen grupos para los que deseas garantizar equidad? ¿Qué sesgos pueden tener los datos?", type: "textarea" },
      { key: "eth-res1", label: "🧭 Responsabilidad — ¿Quién elabora la respuesta ante requerimientos? ¿Quién responde si el sistema se equivoca?", type: "textarea", required: true },
      { key: "eth-res2", label: "🧭 Responsabilidad — ¿Hay mecanismos de monitoreo, control y formación del equipo?", type: "textarea" },
    ],
  },
];
