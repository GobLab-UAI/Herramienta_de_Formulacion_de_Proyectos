import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, HelpCircle } from "lucide-react";
import type { TableConfig } from "@/lib/formSections";

interface DynamicTableProps {
  config: TableConfig;
  data: any;
  onChange: (data: any) => void;
  readOnly: boolean;
}

export function DynamicTable({ config, data, onChange, readOnly }: DynamicTableProps) {
  const getInitialData = () => {
    if (data) return data;
    if (config.type === "dynamic-rows") {
      const headers = config.headers || [];
      const rows = config.prefillRows || Array.from({ length: config.initialRows || 3 }, (_, ri) =>
        headers.map((h, ci) => h === "#" ? String(ri + 1) : "")
      );
      // Ensure "#" columns are filled for prefillRows too
      const numberedRows = rows.map((row, ri) =>
        row.map((cell, ci) => headers[ci] === "#" ? String(ri + 1) : cell)
      );
      return { headers, rows: numberedRows };
    }
    if (config.type === "dynamic-cols") {
      const colCount = config.initialCols || 2;
      const cells: Record<string, string> = {};
      return { rowLabels: config.rowLabels || [], colCount, cells };
    }
    if (config.type === "activities") {
      const activityCount = config.initialCols || 2;
      return {
        activityCount,
        activityNames: Array.from({ length: activityCount }, (_, i) => `Actividad ${i + 1}`),
        cells: {},
      };
    }
    return {};
  };

  const [tableData, setTableData] = useState(getInitialData);

  const updateAndNotify = (newData: any) => {
    setTableData(newData);
    onChange(newData);
  };

  if (config.type === "dynamic-rows") {
    const td = tableData as { headers: string[]; rows: string[][] };
    return (
      <div className="space-y-2">
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-secondary text-secondary-foreground">
                {td.headers.map((h, i) => (
                  <th
                    key={i}
                    className={
                      h === "#"
                        ? "px-2 py-2 text-center font-medium text-xs w-10"
                        : "px-3 py-2 text-left font-medium text-xs"
                    }
                  >
                    <span className="inline-flex items-center gap-1">
                      {h}
                      {config.headerHints?.[i] && (
                        <span title={config.headerHints[i]} className="cursor-help inline-flex">
                          <HelpCircle className="h-3 w-3 text-muted-foreground/70" />
                        </span>
                      )}
                    </span>
                  </th>
                ))}
                {!readOnly && <th className="w-10" />}
              </tr>
            </thead>
            <tbody>
              {td.rows.map((row, ri) => (
                <tr key={ri} className="border-t">
                  {row.map((cell, ci) => (
                    <td
                      key={ci}
                      className={td.headers[ci] === "#" ? "px-1 py-1 w-10" : "px-1 py-1"}
                    >
                      <Input
                        value={cell}
                        onChange={(e) => {
                          const newRows = [...td.rows];
                          newRows[ri] = [...newRows[ri]];
                          newRows[ri][ci] = e.target.value;
                          updateAndNotify({ ...td, rows: newRows });
                        }}
                        readOnly={readOnly || (td.headers[ci] === "#")}
                        className={
                          td.headers[ci] === "#"
                            ? "border-0 bg-transparent h-8 text-xs text-center px-1 w-10 text-muted-foreground"
                            : "border-0 bg-transparent h-8 text-xs"
                        }
                        placeholder={readOnly ? "" : "..."}
                      />
                    </td>
                  ))}
                  {!readOnly && (
                    <td className="px-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => {
                        const newRows = td.rows.filter((_, i) => i !== ri).map((row, i) =>
                          row.map((cell, ci) => td.headers[ci] === "#" ? String(i + 1) : cell)
                        );
                        updateAndNotify({ ...td, rows: newRows });
                      }}>
                        <Trash2 className="h-3 w-3 text-muted-foreground" />
                      </Button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!readOnly && (
          <Button variant="outline" size="sm" onClick={() => {
            const newRow = Array.from({ length: td.headers.length }, (_, i) =>
              td.headers[i] === "#" ? String(td.rows.length + 1) : ""
            );
            updateAndNotify({ ...td, rows: [...td.rows, newRow] });
          }}>
            <Plus className="h-3 w-3 mr-1" /> Agregar fila
          </Button>
        )}
      </div>
    );
  }

  if (config.type === "dynamic-cols") {
    const td = tableData as { rowLabels: string[]; colCount: number; cells: Record<string, string> };
    return (
      <div className="space-y-2">
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-secondary text-secondary-foreground">
                <th className="px-3 py-2 text-left font-medium text-xs w-48">Campo</th>
                {Array.from({ length: td.colCount }, (_, i) => (
                  <th key={i} className="px-3 py-2 text-left font-medium text-xs">
                    Fuente {i + 1}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {td.rowLabels.map((label, ri) => (
                <tr key={ri} className="border-t">
                  <td className="px-3 py-2 text-xs font-medium text-foreground bg-muted/30">{label}</td>
                  {Array.from({ length: td.colCount }, (_, ci) => (
                    <td key={ci} className="px-1 py-1">
                      <Input
                        value={td.cells[`${ri}-${ci}`] || ""}
                        onChange={(e) => {
                          const newCells = { ...td.cells, [`${ri}-${ci}`]: e.target.value };
                          updateAndNotify({ ...td, cells: newCells });
                        }}
                        readOnly={readOnly}
                        className="border-0 bg-transparent h-8 text-xs"
                        placeholder={readOnly ? "" : "..."}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!readOnly && (
          <Button variant="outline" size="sm" onClick={() => {
            updateAndNotify({ ...td, colCount: td.colCount + 1 });
          }}>
            <Plus className="h-3 w-3 mr-1" /> Agregar columna
          </Button>
        )}
      </div>
    );
  }

  // Activities table
  if (config.type === "activities") {
    const td = tableData as { activityCount: number; activityNames: string[]; cells: Record<string, string> };
    const momentRows = [
      { moment: "ANTES", questions: ["¿Qué insumo se necesita?", "¿Quién entrega el insumo?"], span: 2 },
      { moment: "DURANTE", questions: ["¿En qué consiste la actividad?", "¿Quién realiza?", "¿Con qué frecuencia?", "¿Dónde se realiza?", "¿Cuál es el resultado?"], span: 5 },
      { moment: "DESPUÉS", questions: ["¿Quién recibe el resultado?", "¿Qué hacen con él?", "¿Cómo queremos cambiar la actividad?"], span: 3 },
    ];

    let rowIndex = 0;
    return (
      <div className="space-y-2">
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-secondary text-secondary-foreground">
                <th className="px-3 py-2 text-left font-medium text-xs w-24">Etapa del Proyecto</th>
                <th className="px-3 py-2 text-left font-medium text-xs w-48">Pregunta</th>
                {Array.from({ length: td.activityCount }, (_, i) => (
                  <th key={i} className="px-1 py-1 min-w-[160px]">
                    <Input
                      value={td.activityNames[i] || `Actividad ${i + 1}`}
                      onChange={(e) => {
                        const names = [...td.activityNames];
                        names[i] = e.target.value;
                        updateAndNotify({ ...td, activityNames: names });
                      }}
                      readOnly={readOnly}
                      className="border-0 bg-transparent h-7 text-xs font-medium text-center"
                    />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {momentRows.map((m) => {
                const rows = m.questions.map((q, qi) => {
                  const currentRow = rowIndex++;
                  return (
                    <tr key={`${m.moment}-${qi}`} className="border-t">
                      {qi === 0 && (
                        <td rowSpan={m.span} className="px-2 py-2 bg-navy-mid text-center align-middle">
                          <span className="text-xs font-bold tracking-wider text-primary-foreground [writing-mode:vertical-lr] rotate-180">
                            {m.moment}
                          </span>
                        </td>
                      )}
                      <td className="px-3 py-2 text-xs font-medium text-foreground bg-muted/30 whitespace-nowrap">{q}</td>
                      {Array.from({ length: td.activityCount }, (_, ci) => (
                        <td key={ci} className="px-1 py-1">
                          <Input
                            value={td.cells[`${currentRow}-${ci}`] || ""}
                            onChange={(e) => {
                              const newCells = { ...td.cells, [`${currentRow}-${ci}`]: e.target.value };
                              updateAndNotify({ ...td, cells: newCells });
                            }}
                            readOnly={readOnly}
                            className="border-0 bg-transparent h-8 text-xs"
                            placeholder={readOnly ? "" : "..."}
                          />
                        </td>
                      ))}
                    </tr>
                  );
                });
                return rows;
              })}
            </tbody>
          </table>
        </div>
        {!readOnly && (
          <Button variant="outline" size="sm" onClick={() => {
            const names = [...td.activityNames, `Actividad ${td.activityCount + 1}`];
            updateAndNotify({ ...td, activityCount: td.activityCount + 1, activityNames: names });
          }}>
            <Plus className="h-3 w-3 mr-1" /> Agregar actividad
          </Button>
        )}
      </div>
    );
  }

  return null;
}
