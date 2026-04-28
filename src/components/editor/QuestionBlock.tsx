import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { FormField } from "@/lib/formSections";

interface QuestionBlockProps {
  field: FormField;
  value: string | { choice?: "si" | "no"; details?: string };
  onChange: (value: any) => void;
  readOnly: boolean;
  showCommentButton: boolean;
  pendingComments?: number;
  onComment?: () => void;
  isCommentActive?: boolean;
}

export function QuestionBlock({
  field, value, onChange, readOnly, showCommentButton, pendingComments = 0, onComment, isCommentActive = false,
}: QuestionBlockProps) {
  const isYesNo = field.type === "yesno";
  const yesNoVal: { choice?: "si" | "no"; details?: string } =
    isYesNo && typeof value === "object" && value !== null ? (value as any) : {};
  const stringVal = typeof value === "string" ? value : "";
  const detailLabel =
    yesNoVal.choice === "si"
      ? field.yesDetailLabel || "Indica el nombre de las entidades y su rol en el proyecto."
      : yesNoVal.choice === "no"
        ? field.noDetailLabel || "Fundamenta la respuesta."
        : null;

  return (
    <div
      className={`group relative rounded-lg transition-all duration-200 px-1 py-3 ${
        isCommentActive ? "bg-accent/20 ring-1 ring-primary/20" : "hover:bg-muted/20"
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <Label className="text-sm font-medium text-foreground leading-relaxed">
          {field.label}
          {field.required && <span className="text-destructive ml-1">*</span>}
        </Label>
        {showCommentButton && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onComment?.();
            }}
            className={`shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded ${
              pendingComments > 0 ? "opacity-100" : ""
            }`}
            title="Agregar comentario"
          >
            <MessageSquare
              className={`h-4 w-4 ${pendingComments > 0 ? "text-amber fill-amber/20" : "text-muted-foreground"}`}
            />
            {pendingComments > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber text-[9px] font-bold text-primary-foreground px-0.5">
                {pendingComments}
              </span>
            )}
          </button>
        )}
      </div>
      {field.hint && (
        <p className="text-xs text-muted-foreground mb-2 pl-0.5">
          💡 {field.hint.split(/(https?:\/\/[^\s,)]+|[a-zA-Z0-9-]+\.[a-zA-Z]{2,}[^\s,)]*)/).map((part, i) =>
            /^(https?:\/\/|[a-zA-Z0-9-]+\.[a-zA-Z]{2,})/.test(part) ? (
              <a
                key={i}
                href={part.startsWith("http") ? part : `https://${part}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline hover:text-primary/80"
              >
                {part}
              </a>
            ) : (
              <span key={i}>{part}</span>
            )
          )}
        </p>
      )}
      {isYesNo ? (
        <div className="space-y-3">
          <RadioGroup
            value={yesNoVal.choice || ""}
            onValueChange={(v) => {
              if (readOnly) return;
              onChange({ choice: v as "si" | "no", details: yesNoVal.details || "" });
            }}
            disabled={readOnly}
            className="flex gap-6"
          >
            <div className="flex items-center gap-2">
              <RadioGroupItem value="si" id={`${field.key}-si`} />
              <Label htmlFor={`${field.key}-si`} className="text-sm cursor-pointer">Sí</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="no" id={`${field.key}-no`} />
              <Label htmlFor={`${field.key}-no`} className="text-sm cursor-pointer">No</Label>
            </div>
          </RadioGroup>
          {detailLabel && (
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">{detailLabel}</Label>
              <Textarea
                value={yesNoVal.details || ""}
                onChange={(e) =>
                  onChange({ choice: yesNoVal.choice, details: e.target.value })
                }
                readOnly={readOnly}
                placeholder={readOnly ? "Sin respuesta" : "Escribe tu respuesta aquí..."}
                className={`min-h-[80px] resize-y border-0 border-b border-border rounded-none bg-transparent focus-visible:ring-0 focus-visible:border-primary px-0.5 text-sm ${
                  readOnly ? "text-muted-foreground cursor-not-allowed" : ""
                }`}
              />
            </div>
          )}
        </div>
      ) : field.type === "textarea" ? (
        <Textarea
          value={stringVal}
          onChange={(e) => onChange(e.target.value)}
          readOnly={readOnly}
          placeholder={readOnly ? "Sin respuesta" : "Escribe tu respuesta aquí..."}
          className={`min-h-[100px] resize-y border-0 border-b border-border rounded-none bg-transparent focus-visible:ring-0 focus-visible:border-primary px-0.5 text-sm ${
            readOnly ? "text-muted-foreground cursor-not-allowed" : ""
          }`}
        />
      ) : field.type === "date" ? (
        <Input
          type="date"
          value={stringVal}
          onChange={(e) => onChange(e.target.value)}
          readOnly={readOnly}
          className={`border-0 border-b border-border rounded-none bg-transparent focus-visible:ring-0 focus-visible:border-primary px-0.5 ${
            readOnly ? "text-muted-foreground cursor-not-allowed" : ""
          }`}
        />
      ) : (
        <Input
          value={stringVal}
          onChange={(e) => onChange(e.target.value)}
          readOnly={readOnly}
          placeholder={readOnly ? "Sin respuesta" : "Escribe aquí..."}
          className={`border-0 border-b border-border rounded-none bg-transparent focus-visible:ring-0 focus-visible:border-primary px-0.5 ${
            readOnly ? "text-muted-foreground cursor-not-allowed" : ""
          }`}
        />
      )}
    </div>
  );
}
