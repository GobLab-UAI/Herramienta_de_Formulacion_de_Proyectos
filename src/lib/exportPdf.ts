import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { FORM_SECTIONS, type FormField, type TableConfig } from "./formSections";

const MARGIN = 20;
const PAGE_WIDTH = 210;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

const COLORS = {
  primary: [0, 82, 136] as [number, number, number],       // UAI blue
  sectionBg: [230, 240, 250] as [number, number, number],
  text: [30, 30, 30] as [number, number, number],
  hint: [100, 100, 100] as [number, number, number],
  lightBorder: [200, 210, 220] as [number, number, number],
  headerBg: [0, 82, 136] as [number, number, number],
  headerText: [255, 255, 255] as [number, number, number],
  altRow: [245, 248, 252] as [number, number, number],
};

function checkPageBreak(doc: jsPDF, y: number, needed: number): number {
  if (y + needed > doc.internal.pageSize.getHeight() - MARGIN) {
    doc.addPage();
    return MARGIN + 5;
  }
  return y;
}

function addFooter(doc: jsPDF) {
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const h = doc.internal.pageSize.getHeight();
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.hint);
    doc.text(
      "Ficha de diseño y factibilidad de proyecto · GobLab UAI · CC BY-SA 3.0",
      PAGE_WIDTH / 2,
      h - 8,
      { align: "center" }
    );
    doc.text(`${i} / ${pageCount}`, PAGE_WIDTH - MARGIN, h - 8, { align: "right" });
  }
}

export function generateProjectPDF(
  title: string,
  responses: Record<string, any>
) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  let y = MARGIN;

  // ── Cover page ──
  y = 40;
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, PAGE_WIDTH, 12, "F");

  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text("UNIVERSIDAD ADOLFO IBÁÑEZ · GOBLAB", PAGE_WIDTH / 2, 8, { align: "center" });

  doc.setTextColor(...COLORS.primary);
  doc.setFontSize(22);
  doc.text("Ficha de diseño y factibilidad", PAGE_WIDTH / 2, y, { align: "center" });
  y += 9;
  doc.text("de proyecto", PAGE_WIDTH / 2, y, { align: "center" });
  y += 16;

  // Separator line
  doc.setDrawColor(...COLORS.primary);
  doc.setLineWidth(0.8);
  doc.line(MARGIN + 30, y, PAGE_WIDTH - MARGIN - 30, y);
  y += 14;

  // Project title
  doc.setFontSize(16);
  doc.setTextColor(...COLORS.text);
  const titleText = title || responses["portada-nombre"] || "Sin título";
  const titleLines = doc.splitTextToSize(titleText, CONTENT_WIDTH - 20);
  doc.text(titleLines, PAGE_WIDTH / 2, y, { align: "center" });
  y += titleLines.length * 8 + 10;

  // Cover fields
  const coverFields = [
    { label: "Organización", key: "portada-org" },
    { label: "Fecha", key: "portada-fecha" },
    { label: "Equipo formulador", key: "portada-equipo" },
  ];

  doc.setFontSize(11);
  for (const cf of coverFields) {
    const val = responses[cf.key] || "—";
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COLORS.primary);
    doc.text(`${cf.label}:`, MARGIN + 10, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...COLORS.text);
    const valLines = doc.splitTextToSize(String(val), CONTENT_WIDTH - 50);
    doc.text(valLines, MARGIN + 55, y);
    y += valLines.length * 6 + 4;
  }

  // ── Content pages ──
  doc.addPage();
  y = MARGIN + 5;

  // Skip portada section (index 0)
  for (let sIdx = 1; sIdx < FORM_SECTIONS.length; sIdx++) {
    const section = FORM_SECTIONS[sIdx];

    // Section header
    y = checkPageBreak(doc, y, 20);
    doc.setFillColor(...COLORS.sectionBg);
    doc.roundedRect(MARGIN, y - 4, CONTENT_WIDTH, 12, 2, 2, "F");
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COLORS.primary);
    doc.text(`${section.number}. ${section.title}`, MARGIN + 4, y + 4);
    y += 14;

    if (section.globalHint) {
      doc.setFontSize(8);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(...COLORS.hint);
      const hintLines = doc.splitTextToSize(`💡 ${section.globalHint}`, CONTENT_WIDTH - 8);
      y = checkPageBreak(doc, y, hintLines.length * 4 + 4);
      doc.text(hintLines, MARGIN + 4, y);
      y += hintLines.length * 4 + 4;
    }

    for (const field of section.fields) {
      const isTable =
        "headers" in field ||
        "rowLabels" in field ||
        ("type" in field &&
          ["dynamic-rows", "dynamic-cols", "activities"].includes(
            (field as any).type
          ));

      if (isTable) {
        y = renderTable(doc, field as TableConfig, responses[field.key], y);
      } else {
        y = renderTextField(doc, field as FormField, responses[field.key], y);
      }
    }

    y += 6;
  }

  // Footer on all pages
  addFooter(doc);

  // Download
  const safeName = (title || "proyecto").replace(/[^a-zA-Z0-9áéíóúñÁÉÍÓÚÑ ]/g, "").trim().replace(/\s+/g, "_");
  doc.save(`Ficha_${safeName}.pdf`);
}

function renderTextField(
  doc: jsPDF,
  field: FormField,
  value: string | undefined,
  y: number
): number {
  y = checkPageBreak(doc, y, 20);

  // Label
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.text);
  const labelLines = doc.splitTextToSize(field.label, CONTENT_WIDTH - 6);
  doc.text(labelLines, MARGIN + 2, y);
  y += labelLines.length * 5 + 2;

  // Value
  const val = value || "—";
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(val === "—" ? 160 : 30, val === "—" ? 160 : 30, val === "—" ? 160 : 30);
  const valLines = doc.splitTextToSize(String(val), CONTENT_WIDTH - 6);

  // Check if we need multiple page breaks for very long text
  for (let i = 0; i < valLines.length; i++) {
    y = checkPageBreak(doc, y, 6);
    doc.text(valLines[i], MARGIN + 2, y);
    y += 5;
  }

  // Separator line
  y += 2;
  doc.setDrawColor(...COLORS.lightBorder);
  doc.setLineWidth(0.2);
  doc.line(MARGIN, y, PAGE_WIDTH - MARGIN, y);
  y += 5;

  return y;
}

function renderTable(
  doc: jsPDF,
  config: TableConfig,
  data: any,
  y: number
): number {
  y = checkPageBreak(doc, y, 25);

  // Table label
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.text);
  doc.text(config.label, MARGIN + 2, y);
  y += 6;

  if (config.hint) {
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(...COLORS.hint);
    const hintLines = doc.splitTextToSize(`💡 ${config.hint}`, CONTENT_WIDTH - 8);
    doc.text(hintLines, MARGIN + 4, y);
    y += hintLines.length * 4 + 2;
  }

  if (!data || (Array.isArray(data) && data.length === 0)) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(160, 160, 160);
    doc.text("Sin datos ingresados", MARGIN + 4, y);
    y += 8;
    return y;
  }

  try {
    if (config.type === "dynamic-rows" && config.headers) {
      const rows = Array.isArray(data) ? data : [];
      autoTable(doc, {
        startY: y,
        head: [config.headers],
        body: rows.map((row: string[]) => row || []),
        margin: { left: MARGIN, right: MARGIN },
        styles: { fontSize: 8, cellPadding: 2, textColor: COLORS.text },
        headStyles: {
          fillColor: COLORS.headerBg,
          textColor: COLORS.headerText,
          fontStyle: "bold",
          fontSize: 8,
        },
        alternateRowStyles: { fillColor: COLORS.altRow },
        theme: "grid",
      });
      y = (doc as any).lastAutoTable.finalY + 6;
    } else if (config.type === "dynamic-cols" && config.rowLabels) {
      // Transpose: rowLabels are the first column, data columns follow
      const cols = Array.isArray(data) ? data : [];
      const numCols = cols.length || config.initialCols || 2;
      const head = ["", ...Array.from({ length: numCols }, (_, i) => `${i + 1}`)];
      const body = config.rowLabels.map((label, rowIdx) => {
        const cells = [label];
        for (let c = 0; c < numCols; c++) {
          cells.push(cols[c]?.[rowIdx] || "");
        }
        return cells;
      });

      autoTable(doc, {
        startY: y,
        head: [head],
        body,
        margin: { left: MARGIN, right: MARGIN },
        styles: { fontSize: 7, cellPadding: 2, textColor: COLORS.text },
        headStyles: {
          fillColor: COLORS.headerBg,
          textColor: COLORS.headerText,
          fontStyle: "bold",
          fontSize: 7,
        },
        columnStyles: { 0: { fontStyle: "bold", cellWidth: 45 } },
        alternateRowStyles: { fillColor: COLORS.altRow },
        theme: "grid",
      });
      y = (doc as any).lastAutoTable.finalY + 6;
    } else if (config.type === "activities") {
      // Activities table: structured data
      const activities = Array.isArray(data) ? data : [];
      if (activities.length === 0) {
        doc.setFontSize(9);
        doc.setFont("helvetica", "italic");
        doc.setTextColor(160, 160, 160);
        doc.text("Sin actividades ingresadas", MARGIN + 4, y);
        y += 8;
      } else {
        const activityLabels = [
          "Momento",
          "Nombre actividad",
          "¿Qué insumo se necesita?",
          "¿Quién entrega el insumo?",
          "¿En qué consiste?",
          "¿Quién la realiza?",
          "¿Con qué frecuencia?",
          "¿Dónde se realiza?",
          "¿Cuál es el resultado?",
          "¿Quién recibe el resultado?",
          "¿Qué hacen con el resultado?",
          "¿Cómo queremos cambiar la actividad?",
        ];
        const head = ["", ...activities.map((_: any, i: number) => `Act. ${i + 1}`)];
        const body = activityLabels.map((label, rowIdx) => {
          const cells = [label];
          for (const act of activities) {
            cells.push(Array.isArray(act) ? act[rowIdx] || "" : "");
          }
          return cells;
        });

        autoTable(doc, {
          startY: y,
          head: [head],
          body,
          margin: { left: MARGIN, right: MARGIN },
          styles: { fontSize: 7, cellPadding: 2, textColor: COLORS.text },
          headStyles: {
            fillColor: COLORS.headerBg,
            textColor: COLORS.headerText,
            fontStyle: "bold",
            fontSize: 7,
          },
          columnStyles: { 0: { fontStyle: "bold", cellWidth: 42 } },
          alternateRowStyles: { fillColor: COLORS.altRow },
          theme: "grid",
        });
        y = (doc as any).lastAutoTable.finalY + 6;
      }
    }
  } catch {
    doc.setFontSize(9);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(160, 160, 160);
    doc.text("Error al renderizar tabla", MARGIN + 4, y);
    y += 8;
  }

  return y;
}
