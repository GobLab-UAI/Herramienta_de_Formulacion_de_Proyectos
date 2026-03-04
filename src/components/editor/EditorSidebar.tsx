import { FORM_SECTIONS, REQUIRED_FIELDS, type FormField, type TableConfig } from "@/lib/formSections";
import { Check } from "lucide-react";

function isFieldFilled(key: string, val: any): boolean {
  if (val == null) return false;
  // Table data (object or array)
  if (typeof val === "object") {
    if (Array.isArray(val)) {
      // Check if at least one row has meaningful content
      return val.some((row: any) => {
        if (Array.isArray(row)) return row.some((cell: string) => cell && cell.trim().length > 0);
        if (typeof row === "object" && row !== null) return Object.values(row).some((v: any) => v && String(v).trim().length > 0);
        return false;
      });
    }
    // Object with values
    return Object.values(val).some((v: any) => v && String(v).trim().length > 0);
  }
  // String fields - just need non-empty content
  if (typeof val === "string") return val.trim().length > 0;
  return false;
}

export function EditorSidebar({
  activeSection,
  onSectionClick,
  responses,
  commentCounts,
}: {
  activeSection: string;
  onSectionClick: (id: string) => void;
  responses: Record<string, any>;
  commentCounts: Record<string, number>;
}) {
  // Calculate overall completion from required fields
  const filledCount = REQUIRED_FIELDS.filter((key) => isFieldFilled(key, responses[key])).length;
  const completionPct = Math.round((filledCount / REQUIRED_FIELDS.length) * 100);

  // Per-section completion
  const getSectionCompletion = (section: typeof FORM_SECTIONS[0]) => {
    const requiredFields = section.fields.filter((f) => {
      if ("required" in f && f.required) return true;
      // Table fields in REQUIRED_FIELDS
      return REQUIRED_FIELDS.includes(f.key);
    });
    if (requiredFields.length === 0) return { filled: 0, total: 0, complete: true };
    const filled = requiredFields.filter((f) => isFieldFilled(f.key, responses[f.key])).length;
    return { filled, total: requiredFields.length, complete: filled === requiredFields.length };
  };

  return (
    <aside className="w-[252px] shrink-0 border-r bg-card overflow-y-auto h-[calc(100vh-60px)] sticky top-[60px]">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
          <span>Progreso general</span>
          <span className="font-semibold text-foreground">{completionPct}%</span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${completionPct}%` }}
          />
        </div>
      </div>

      <nav className="p-2 space-y-0.5">
        {FORM_SECTIONS.map((section) => {
          const sectionComments = section.fields.reduce((acc, f) => acc + (commentCounts[f.key] || 0), 0);
          const isActive = activeSection === section.id;
          const { complete, filled, total } = getSectionCompletion(section);

          return (
            <button
              key={section.id}
              onClick={() => onSectionClick(section.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-left text-sm transition-colors ${
                isActive
                  ? "bg-accent text-accent-foreground font-medium"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <span className={`flex h-6 w-6 items-center justify-center rounded-md text-[11px] font-bold shrink-0 ${
                complete && total > 0
                  ? "bg-primary text-primary-foreground"
                  : isActive
                    ? "bg-primary/20 text-primary"
                    : "bg-muted text-muted-foreground"
              }`}>
                {complete && total > 0 ? <Check className="h-3.5 w-3.5" /> : section.number}
              </span>
              <span className="truncate flex-1">{section.title}</span>
              {total > 0 && !complete && (
                <span className="text-[10px] text-muted-foreground shrink-0">
                  {filled}/{total}
                </span>
              )}
              {sectionComments > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-amber text-[10px] font-bold text-primary-foreground px-1">
                  {sectionComments}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
