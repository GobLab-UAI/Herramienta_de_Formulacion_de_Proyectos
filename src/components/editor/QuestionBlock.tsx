import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { FormField } from "@/lib/formSections";

interface QuestionBlockProps {
  field: FormField;
  value: string;
  onChange: (value: string) => void;
  readOnly: boolean;
  showCommentButton: boolean;
  pendingComments?: number;
  onComment?: () => void;
}

export function QuestionBlock({
  field, value, onChange, readOnly, showCommentButton, pendingComments = 0, onComment,
}: QuestionBlockProps) {
  return (
    <div className="group space-y-2 animate-fade-in">
      <div className="flex items-start justify-between gap-2">
        <Label className="text-sm font-semibold text-foreground leading-relaxed">
          {field.label}
          {field.required && <span className="text-destructive ml-1">*</span>}
        </Label>
        {showCommentButton && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onComment}
            className={pendingComments > 0 ? "text-amber hover:text-amber" : "text-muted-foreground"}
          >
            <MessageSquare className="h-4 w-4 mr-1" />
            {pendingComments > 0 ? pendingComments : "Comentar"}
          </Button>
        )}
      </div>
      {field.hint && (
        <p className="text-xs text-muted-foreground bg-accent/50 rounded-md px-3 py-2">
          💡 {field.hint}
        </p>
      )}
      {field.type === "textarea" ? (
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          readOnly={readOnly}
          placeholder={readOnly ? "Sin respuesta" : "Escribe tu respuesta aquí..."}
          className={`min-h-[120px] resize-y ${readOnly ? "bg-muted/50 cursor-not-allowed" : ""}`}
        />
      ) : field.type === "date" ? (
        <Input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          readOnly={readOnly}
          className={readOnly ? "bg-muted/50 cursor-not-allowed" : ""}
        />
      ) : (
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          readOnly={readOnly}
          placeholder={readOnly ? "Sin respuesta" : "Escribe aquí..."}
          className={readOnly ? "bg-muted/50 cursor-not-allowed" : ""}
        />
      )}
    </div>
  );
}
