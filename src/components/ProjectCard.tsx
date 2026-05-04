import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Calendar, MessageSquare, User, Trash2, Send, CheckCircle2, RotateCcw, KeyRound } from "lucide-react";
import { Link } from "react-router-dom";

const statusConfig: Record<string, { label: string; className: string }> = {
  DRAFT: { label: "Borrador", className: "bg-muted text-muted-foreground" },
  IN_REVIEW: { label: "En revisión", className: "bg-amber-bg text-amber border-amber/30" },
  WITH_OBSERVATIONS: { label: "Con observaciones", className: "bg-status-red-bg text-status-red border-status-red/30" },
  APPROVED: { label: "Aprobado", className: "bg-status-green-bg text-status-green border-status-green/30" },
  ARCHIVED: { label: "Archivado", className: "bg-muted text-muted-foreground" },
};

interface ProjectCardProps {
  id: string;
  title: string;
  organizationName?: string;
  status: string;
  completionPct: number;
  updatedAt: string;
  commentCount?: number;
  role?: string;
  creatorName?: string;
  isDeleted?: boolean;
  joinCode?: string;
  myCustomRole?: string;
  isOwnerOfProject?: boolean;
  onDelete?: (id: string) => void;
  onRestore?: (id: string) => void;
  onSendToReview?: (id: string) => void;
  onApprove?: (id: string) => void;
}

export function ProjectCard({
  id, title, organizationName, status, completionPct, updatedAt,
  commentCount = 0, role, creatorName, isDeleted, joinCode, myCustomRole, isOwnerOfProject,
  onDelete, onRestore, onSendToReview, onApprove,
}: ProjectCardProps) {
  const statusInfo = statusConfig[status] || statusConfig.DRAFT;
  const editUrl = role === "CONSULTOR" ? `/projects/${id}/review` : `/projects/${id}/edit`;

  const isFormulador = role !== "CONSULTOR";
  const canSendToReview = isFormulador && (status === "DRAFT" || status === "WITH_OBSERVATIONS");
  const canApprove = !isFormulador && status === "IN_REVIEW";

  return (
    <Card className={`group transition-all hover:shadow-goblab hover:-translate-y-0.5 animate-fade-in ${isDeleted ? "opacity-60" : ""}`}>
      <Link to={isDeleted ? "#" : editUrl} className={isDeleted ? "pointer-events-none" : ""}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-display text-lg text-foreground group-hover:text-primary transition-colors line-clamp-2">
              {title || "Sin título"}
            </h3>
            <Badge variant="outline" className={statusInfo.className + " shrink-0 text-xs"}>
              {isDeleted ? "Eliminado" : statusInfo.label}
            </Badge>
          </div>
          {organizationName && <p className="text-sm text-muted-foreground">{organizationName}</p>}
          {creatorName && (
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <User className="h-3 w-3" />{creatorName}
            </p>
          )}
          {myCustomRole && !isOwnerOfProject && (
            <p className="text-xs text-primary flex items-center gap-1 mt-1 font-medium">
              Miembro · {myCustomRole}
            </p>
          )}
          {joinCode && isOwnerOfProject && (
            <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-1 font-mono">
              <KeyRound className="h-3 w-3" />{joinCode}
            </p>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Progreso</span>
              <span className="font-medium">{completionPct}%</span>
            </div>
            <Progress value={completionPct} className="h-1.5" />
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {new Date(updatedAt).toLocaleDateString("es-CL", { day: "numeric", month: "short", year: "numeric" })}
            </span>
            {commentCount > 0 && (
              <span className="flex items-center gap-1 text-amber">
                <MessageSquare className="h-3.5 w-3.5" />{commentCount}
              </span>
            )}
          </div>
        </CardContent>
      </Link>

      {/* Action buttons */}
      <div className="px-6 pb-4 flex gap-2 flex-wrap">
        {isDeleted && onRestore && (
          <Button size="sm" variant="outline" onClick={() => onRestore(id)} className="text-xs">
            <RotateCcw className="h-3 w-3 mr-1" /> Restaurar
          </Button>
        )}
        {!isDeleted && canSendToReview && onSendToReview && (
          <Button size="sm" variant="outline" onClick={() => onSendToReview(id)} className="text-xs">
            <Send className="h-3 w-3 mr-1" /> Enviar a revisión
          </Button>
        )}
        {!isDeleted && canApprove && onApprove && (
          <Button size="sm" variant="default" onClick={() => onApprove(id)} className="text-xs">
            <CheckCircle2 className="h-3 w-3 mr-1" /> Aprobar
          </Button>
        )}
        {!isDeleted && isFormulador && onDelete && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" variant="ghost" className="text-xs text-destructive hover:text-destructive ml-auto">
                <Trash2 className="h-3 w-3" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Eliminar proyecto?</AlertDialogTitle>
                <AlertDialogDescription>
                  El proyecto será eliminado y ya no aparecerá en tu lista. Esta acción puede ser revertida por un consultor.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={() => onDelete(id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Eliminar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </Card>
  );
}
