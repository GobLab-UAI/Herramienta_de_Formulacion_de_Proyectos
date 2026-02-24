import { FORM_SECTIONS, REQUIRED_FIELDS } from "@/lib/formSections";

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
  // Calculate completion
  const filledCount = REQUIRED_FIELDS.filter((key) => {
    const val = responses[key];
    if (typeof val === "string") return val.length > 10;
    if (val && typeof val === "object") return true; // table data exists
    return false;
  }).length;
  const completionPct = Math.round((filledCount / REQUIRED_FIELDS.length) * 100);

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
                isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}>
                {section.number}
              </span>
              <span className="truncate flex-1">{section.title}</span>
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
