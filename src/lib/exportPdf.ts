import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { FORM_SECTIONS, type FormField, type TableConfig } from "./formSections";

const MARGIN = 18;
const PAGE_WIDTH = 210;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

const COLORS = {
  primary: [0, 82, 136] as [number, number, number],
  sectionBg: [0, 82, 136] as [number, number, number],
  sectionText: [255, 255, 255] as [number, number, number],
  text: [30, 30, 30] as [number, number, number],
  muted: [120, 120, 120] as [number, number, number],
  lightBorder: [210, 218, 226] as [number, number, number],
  headerBg: [0, 82, 136] as [number, number, number],
  headerText: [255, 255, 255] as [number, number, number],
  altRow: [243, 247, 251] as [number, number, number],
  rowLabelBg: [235, 240, 245] as [number, number, number],
  momentBg: [0, 60, 100] as [number, number, number],
  momentText: [255, 255, 255] as [number, number, number],
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
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.muted);
    doc.text(
      "Ficha de diseño y factibilidad de proyecto · GobLab UAI",
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

  // ── Cover page ──
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, PAGE_WIDTH, 14, "F");
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text("UNIVERSIDAD ADOLFO IBÁÑEZ · GOBLAB", PAGE_WIDTH / 2, 9, { align: "center" });

  let y = 50;
  doc.setTextColor(...COLORS.primary);
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("Ficha de diseño y factibilidad", PAGE_WIDTH / 2, y, { align: "center" });
  y += 10;
  doc.text("de proyecto", PAGE_WIDTH / 2, y, { align: "center" });
  y += 18;

  doc.setDrawColor(...COLORS.primary);
  doc.setLineWidth(0.6);
  doc.line(MARGIN + 40, y, PAGE_WIDTH - MARGIN - 40, y);
  y += 16;

  // Project title
  const titleText = title || responses["portada-nombre"] || "Sin título";
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.text);
  const titleLines = doc.splitTextToSize(titleText, CONTENT_WIDTH - 30);
  doc.text(titleLines, PAGE_WIDTH / 2, y, { align: "center" });
  y += titleLines.length * 9 + 14;

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
    doc.text(`${cf.label}:`, MARGIN + 20, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...COLORS.text);
    const valLines = doc.splitTextToSize(String(val), CONTENT_WIDTH - 65);
    doc.text(valLines, MARGIN + 60, y);
    y += valLines.length * 6 + 5;
  }

  // ── Content pages ──
  doc.addPage();
  y = MARGIN + 5;

  for (let sIdx = 1; sIdx < FORM_SECTIONS.length; sIdx++) {
    const section = FORM_SECTIONS[sIdx];

    // Section header bar
    y = checkPageBreak(doc, y, 22);
    doc.setFillColor(...COLORS.sectionBg);
    doc.roundedRect(MARGIN, y - 5, CONTENT_WIDTH, 11, 1.5, 1.5, "F");
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COLORS.sectionText);
    doc.text(`${section.number}. ${section.title}`, MARGIN + 5, y + 2);
    y += 12;

    if (section.id === "seccion-10") {
      // Group ethics fields by subsection
      const ethicsGroups: { title: string; prefixes: string[] }[] = [
        { title: "Proporcionalidad", prefixes: ["eth-prop", "eth-imp"] },
        { title: "Licencia Social", prefixes: ["eth-lic"] },
        { title: "Protección de Datos", prefixes: ["eth-dat"] },
        { title: "Transparencia", prefixes: ["eth-tra"] },
        { title: "Discriminación / Equidad", prefixes: ["eth-eq"] },
        { title: "Responsabilidad", prefixes: ["eth-res"] },
      ];

      for (const group of ethicsGroups) {
        // Subsection header
        y = checkPageBreak(doc, y, 16);
        doc.setFillColor(235, 240, 245);
        doc.roundedRect(MARGIN, y - 4, CONTENT_WIDTH, 9, 1, 1, "F");
        doc.setFontSize(9.5);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...COLORS.primary);
        doc.text(group.title, MARGIN + 4, y + 1.5);
        y += 10;

        const groupFields = section.fields.filter((f) =>
          group.prefixes.some((p) => f.key.startsWith(p))
        );
        for (const field of groupFields) {
          const rawLabel = (field as FormField).label;
          const dashIdx = rawLabel.indexOf("—");
          const cleanLabel = dashIdx !== -1 ? rawLabel.substring(dashIdx + 1).trim() : rawLabel;
          y = renderTextField(doc, field as FormField, responses[field.key], y, cleanLabel);
        }
      }
    } else {
      for (const field of section.fields) {
        const isTable =
          "headers" in field ||
          "rowLabels" in field ||
          ("type" in field && ["dynamic-rows", "dynamic-cols", "activities"].includes((field as any).type));

        if (isTable) {
          y = renderTable(doc, field as TableConfig, responses[field.key], y);
        } else {
          y = renderTextField(doc, field as FormField, responses[field.key], y);
        }
      }
    }

    y += 4;
  }

  // ── Attribution box ──
  y = checkPageBreak(doc, y, 80);
  if (y + 80 > doc.internal.pageSize.getHeight() - MARGIN) {
    doc.addPage();
    y = MARGIN + 5;
  }

  const boxX = MARGIN;
  const boxW = CONTENT_WIDTH;
  const boxPadding = 5;
  const lineHeight = 3.8;
  const fontSize = 7;

  const attributionParagraphs = [
    "Esta ficha está bajo Licencia Creative Commons Attribution-ShareAlike 3.0 Unported (CC BY-SA 3.0), los términos y condiciones están disponibles en https://creativecommons.org/licenses/by-sa/3.0/. Debes citar esta licencia al utilizarla.",
    "Esta ficha fue desarrollada originalmente por el Center for Data Science and Public Policy de la Universidad de Chicago. Para más información sobre nuestros programas y trabajo, por favor visita http://datasciencepublicpolicy.org o escríbenos a info@datascienceforsocialgood.org",
    "Esta versión de la ficha ha sido actualizada a través de una colaboración entre el GobLab UAI, Carnegie Mellon University y el Instituto Tecnológico de Monterrey. Posteriormente se actualizó a partir de un trabajo con el Laboratorio de Gobierno de Chile y a través de una colaboración con CoDaTecs de la Universidad Nacional del Rosario.",
    "El GobLab UAI es el laboratorio de innovación de la Escuela de Gobierno de la Universidad Adolfo Ibáñez. Su misión es contribuir a la innovación en políticas públicas para beneficiar a la sociedad. Trabaja con organismos públicos, organizaciones de la sociedad civil e investigadores para lograr políticas públicas más eficaces, eficientes y equitativas mediante la ciencia de datos. Para obtener más información, visita https://goblab.uai.cl o envía un correo electrónico a goblab@uai.cl.",
  ];

  // Calculate total height
  doc.setFontSize(fontSize);
  let totalTextHeight = 0;
  const wrappedParagraphs: string[][] = [];
  for (const para of attributionParagraphs) {
    const lines = doc.splitTextToSize(para, boxW - boxPadding * 2);
    wrappedParagraphs.push(lines);
    totalTextHeight += lines.length * lineHeight + 3;
  }
  totalTextHeight += 6; // for the CC BY-SA label at the bottom

  const boxH = totalTextHeight + boxPadding * 2 + 2;

  // Check if we need a new page for the box
  y = checkPageBreak(doc, y, boxH + 5);

  // Draw box border
  doc.setDrawColor(...COLORS.lightBorder);
  doc.setLineWidth(0.3);
  doc.setFillColor(245, 247, 250);
  doc.roundedRect(boxX, y, boxW, boxH, 1.5, 1.5, "FD");

  let textY = y + boxPadding + 3;
  doc.setTextColor(100, 100, 100);

  for (let pi = 0; pi < wrappedParagraphs.length; pi++) {
    const lines = wrappedParagraphs[pi];
    if (pi === 0) {
      // First paragraph: bold the first part
      doc.setFont("helvetica", "bold");
      doc.setFontSize(fontSize);
    } else {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(fontSize);
    }
    for (const line of lines) {
      doc.text(line, boxX + boxPadding, textY);
      textY += lineHeight;
    }
    if (pi === 0) {
      doc.setFont("helvetica", "normal");
    }
    textY += 2;
  }

  // CC BY-SA centered label
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(60, 60, 60);
  doc.text("Attribution ShareAlike (CC BY-SA)", PAGE_WIDTH / 2, textY, { align: "center" });

  addFooter(doc);

  const safeName = (title || "proyecto").replace(/[^a-zA-Z0-9áéíóúñÁÉÍÓÚÑ ]/g, "").trim().replace(/\s+/g, "_");
  doc.save(`Ficha_${safeName}.pdf`);
}

function renderTextField(
  doc: jsPDF,
  field: FormField,
  value: string | undefined,
  y: number,
  labelOverride?: string
): number {
  y = checkPageBreak(doc, y, 18);

  // Label
  doc.setFontSize(9.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.text);
  const labelText = labelOverride || field.label;
  const labelLines = doc.splitTextToSize(labelText, CONTENT_WIDTH - 4);
  doc.text(labelLines, MARGIN + 1, y);
  y += labelLines.length * 4.5 + 2;

  // Value
  const val = value || "—";
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  const isEmpty = val === "—";
  doc.setTextColor(isEmpty ? 170 : 30, isEmpty ? 170 : 30, isEmpty ? 170 : 30);
  const valLines = doc.splitTextToSize(String(val), CONTENT_WIDTH - 4);

  for (let i = 0; i < valLines.length; i++) {
    y = checkPageBreak(doc, y, 5);
    doc.text(valLines[i], MARGIN + 1, y);
    y += 4.5;
  }

  y += 3;
  doc.setDrawColor(...COLORS.lightBorder);
  doc.setLineWidth(0.15);
  doc.line(MARGIN, y, PAGE_WIDTH - MARGIN, y);
  y += 4;

  return y;
}

function renderTable(
  doc: jsPDF,
  config: TableConfig,
  data: any,
  y: number
): number {
  y = checkPageBreak(doc, y, 20);

  // Table label
  doc.setFontSize(9.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.text);
  doc.text(config.label, MARGIN + 1, y);
  y += 6;

  if (!data) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(170, 170, 170);
    doc.text("Sin datos ingresados", MARGIN + 4, y);
    y += 8;
    return y;
  }

  try {
    if (config.type === "dynamic-rows") {
      const td = data as { headers: string[]; rows: string[][] };
      if (!td.headers || !td.rows || td.rows.length === 0) {
        doc.setFontSize(9);
        doc.setFont("helvetica", "italic");
        doc.setTextColor(170, 170, 170);
        doc.text("Sin datos ingresados", MARGIN + 4, y);
        y += 8;
        return y;
      }
      autoTable(doc, {
        startY: y,
        head: [td.headers],
        body: td.rows.map((row) => row || []),
        margin: { left: MARGIN, right: MARGIN },
        styles: { fontSize: 8, cellPadding: 2.5, textColor: COLORS.text, lineColor: COLORS.lightBorder, lineWidth: 0.15 },
        headStyles: { fillColor: COLORS.headerBg, textColor: COLORS.headerText, fontStyle: "bold", fontSize: 8 },
        alternateRowStyles: { fillColor: COLORS.altRow },
        theme: "grid",
      });
      y = (doc as any).lastAutoTable.finalY + 6;
    } else if (config.type === "dynamic-cols") {
      const td = data as { rowLabels: string[]; colCount: number; cells: Record<string, string> };
      const colCount = td.colCount || config.initialCols || 2;
      const head = ["Campo", ...Array.from({ length: colCount }, (_, i) => `Fuente ${i + 1}`)];
      const labels = td.rowLabels || config.rowLabels || [];
      const body = labels.map((label, ri) => {
        const cells = [label];
        for (let c = 0; c < colCount; c++) {
          cells.push(td.cells?.[`${ri}-${c}`] || "");
        }
        return cells;
      });

      autoTable(doc, {
        startY: y,
        head: [head],
        body,
        margin: { left: MARGIN, right: MARGIN },
        styles: { fontSize: 7.5, cellPadding: 2.5, textColor: COLORS.text, lineColor: COLORS.lightBorder, lineWidth: 0.15 },
        headStyles: { fillColor: COLORS.headerBg, textColor: COLORS.headerText, fontStyle: "bold", fontSize: 7.5 },
        columnStyles: { 0: { fontStyle: "bold", fillColor: COLORS.rowLabelBg, cellWidth: 42 } },
        alternateRowStyles: { fillColor: COLORS.altRow },
        theme: "grid",
      });
      y = (doc as any).lastAutoTable.finalY + 6;
    } else if (config.type === "activities") {
      const td = data as { activityCount: number; activityNames: string[]; cells: Record<string, string> };
      const actCount = td.activityCount || config.initialCols || 2;

      const momentRows = [
        { moment: "ANTES", questions: ["¿Qué insumo se necesita?", "¿Quién entrega el insumo?"] },
        { moment: "DURANTE", questions: ["¿En qué consiste la actividad?", "¿Quién realiza?", "¿Con qué frecuencia?", "¿Dónde se realiza?", "¿Cuál es el resultado?"] },
        { moment: "DESPUÉS", questions: ["¿Quién recibe el resultado?", "¿Qué hacen con él?", "¿Cómo queremos cambiar la actividad?"] },
      ];

      const head = ["Momento", "Pregunta", ...td.activityNames.slice(0, actCount)];
      const body: any[][] = [];
      let rowIdx = 0;

      for (const m of momentRows) {
        for (let qi = 0; qi < m.questions.length; qi++) {
          const row: any[] = [];
          if (qi === 0) {
            row.push({ content: m.moment, rowSpan: m.questions.length, styles: { fillColor: COLORS.momentBg, textColor: COLORS.momentText, fontStyle: "bold", halign: "center", valign: "middle", fontSize: 7 } });
          }
          row.push(m.questions[qi]);
          for (let ci = 0; ci < actCount; ci++) {
            row.push(td.cells?.[`${rowIdx}-${ci}`] || "");
          }
          body.push(row);
          rowIdx++;
        }
      }

      autoTable(doc, {
        startY: y,
        head: [head],
        body,
        margin: { left: MARGIN, right: MARGIN },
        styles: { fontSize: 7, cellPadding: 2, textColor: COLORS.text, lineColor: COLORS.lightBorder, lineWidth: 0.15 },
        headStyles: { fillColor: COLORS.headerBg, textColor: COLORS.headerText, fontStyle: "bold", fontSize: 7 },
        columnStyles: {
          0: { cellWidth: 18 },
          1: { fontStyle: "bold", fillColor: COLORS.rowLabelBg, cellWidth: 38 },
        },
        alternateRowStyles: { fillColor: COLORS.altRow },
        theme: "grid",
      });
      y = (doc as any).lastAutoTable.finalY + 6;
    }
  } catch {
    doc.setFontSize(9);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(170, 170, 170);
    doc.text("Error al renderizar tabla", MARGIN + 4, y);
    y += 8;
  }

  return y;
}
