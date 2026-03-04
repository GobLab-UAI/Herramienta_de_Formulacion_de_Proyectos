import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Calendar, MessageSquare, User } from "lucide-react";
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
}

export function ProjectCard({
  id, title, organizationName, status, completionPct, updatedAt, commentCount = 0, role, creatorName,
}: ProjectCardProps) {
  const statusInfo = statusConfig[status] || statusConfig.DRAFT;
  const editUrl = role === "CONSULTOR" ? `/projects/${id}/review` : `/projects/${id}/edit`;

  return (
    <Link to={editUrl}>
      <Card className="group cursor-pointer transition-all hover:shadow-goblab hover:-translate-y-0.5 animate-fade-in">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-display text-lg text-foreground group-hover:text-primary transition-colors line-clamp-2">
              {title || "Sin título"}
            </h3>
            <Badge variant="outline" className={statusInfo.className + " shrink-0 text-xs"}>
              {statusInfo.label}
            </Badge>
          </div>
          {organizationName && (
            <p className="text-sm text-muted-foreground">{organizationName}</p>
          )}
          {creatorName && (
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <User className="h-3 w-3" />
              {creatorName}
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
                <MessageSquare className="h-3.5 w-3.5" />
                {commentCount}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
