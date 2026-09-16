export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      comments: {
        Row: {
          author_id: string
          created_at: string | null
          deleted_at: string | null
          field_key: string
          id: string
          parent_id: string | null
          project_id: string
          resolved_at: string | null
          resolved_by: string | null
          status: Database["public"]["Enums"]["comment_status"] | null
          text: string
          updated_at: string | null
        }
        Insert: {
          author_id: string
          created_at?: string | null
          deleted_at?: string | null
          field_key: string
          id?: string
          parent_id?: string | null
          project_id: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["comment_status"] | null
          text: string
          updated_at?: string | null
        }
        Update: {
          author_id?: string
          created_at?: string | null
          deleted_at?: string | null
          field_key?: string
          id?: string
          parent_id?: string | null
          project_id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["comment_status"] | null
          text?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      field_history: {
        Row: {
          changed_at: string | null
          changed_by: string
          field_key: string
          id: string
          new_value: string | null
          old_value: string | null
          project_id: string
        }
        Insert: {
          changed_at?: string | null
          changed_by: string
          field_key: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          project_id: string
        }
        Update: {
          changed_at?: string | null
          changed_by?: string
          field_key?: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "field_history_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      form_responses: {
        Row: {
          field_key: string
          field_value: string | null
          id: string
          project_id: string
          table_data: Json | null
          updated_at: string | null
          updated_by: string
          version: number | null
        }
        Insert: {
          field_key: string
          field_value?: string | null
          id?: string
          project_id: string
          table_data?: Json | null
          updated_at?: string | null
          updated_by: string
          version?: number | null
        }
        Update: {
          field_key?: string
          field_value?: string | null
          id?: string
          project_id?: string
          table_data?: Json | null
          updated_at?: string | null
          updated_by?: string
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "form_responses_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          payload: Json | null
          project_id: string
          read_at: string | null
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          payload?: Json | null
          project_id: string
          read_at?: string | null
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          payload?: Json | null
          project_id?: string
          read_at?: string | null
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string | null
          domains: string[] | null
          id: string
          logo_url: string | null
          name: string
        }
        Insert: {
          created_at?: string | null
          domains?: string[] | null
          id?: string
          logo_url?: string | null
          name: string
        }
        Update: {
          created_at?: string | null
          domains?: string[] | null
          id?: string
          logo_url?: string | null
          name?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          cargo: string | null
          created_at: string | null
          email: string
          entidad: string | null
          full_name: string
          id: string
          is_verified: boolean | null
          last_login_at: string | null
          username: string
        }
        Insert: {
          avatar_url?: string | null
          cargo?: string | null
          created_at?: string | null
          email: string
          entidad?: string | null
          full_name?: string
          id: string
          is_verified?: boolean | null
          last_login_at?: string | null
          username: string
        }
        Update: {
          avatar_url?: string | null
          cargo?: string | null
          created_at?: string | null
          email?: string
          entidad?: string | null
          full_name?: string
          id?: string
          is_verified?: boolean | null
          last_login_at?: string | null
          username?: string
        }
        Relationships: []
      }
      project_members: {
        Row: {
          custom_role: string | null
          invited_at: string | null
          is_owner: boolean | null
          joined_at: string | null
          project_id: string
          role: Database["public"]["Enums"]["project_role"]
          user_id: string
        }
        Insert: {
          custom_role?: string | null
          invited_at?: string | null
          is_owner?: boolean | null
          joined_at?: string | null
          project_id: string
          role?: Database["public"]["Enums"]["project_role"]
          user_id: string
        }
        Update: {
          custom_role?: string | null
          invited_at?: string | null
          is_owner?: boolean | null
          joined_at?: string | null
          project_id?: string
          role?: Database["public"]["Enums"]["project_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          archived_at: string | null
          completion_pct: number | null
          created_at: string | null
          created_by: string
          deleted_at: string | null
          id: string
          join_code: string
          organization_id: string | null
          status: Database["public"]["Enums"]["project_status"] | null
          tags: string[] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          archived_at?: string | null
          completion_pct?: number | null
          created_at?: string | null
          created_by: string
          deleted_at?: string | null
          id?: string
          join_code?: string
          organization_id?: string | null
          status?: Database["public"]["Enums"]["project_status"] | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
        }
        Update: {
          archived_at?: string | null
          completion_pct?: number | null
          created_at?: string | null
          created_by?: string
          deleted_at?: string | null
          id?: string
          join_code?: string
          organization_id?: string | null
          status?: Database["public"]["Enums"]["project_status"] | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      tool_feedback: {
        Row: {
          created_at: string
          description: string
          email: string
          feedback_type: Database["public"]["Enums"]["feedback_type"]
          id: string
          organization: string | null
          pantalla: string | null
          pregunta: string | null
          progreso: number | null
          question_id: string | null
          seccion: string | null
          tool: Database["public"]["Enums"]["tool_name"]
        }
        Insert: {
          created_at?: string
          description: string
          email: string
          feedback_type: Database["public"]["Enums"]["feedback_type"]
          id?: string
          organization?: string | null
          pantalla?: string | null
          pregunta?: string | null
          progreso?: number | null
          question_id?: string | null
          seccion?: string | null
          tool: Database["public"]["Enums"]["tool_name"]
        }
        Update: {
          created_at?: string
          description?: string
          email?: string
          feedback_type?: Database["public"]["Enums"]["feedback_type"]
          id?: string
          organization?: string | null
          pantalla?: string | null
          pregunta?: string | null
          progreso?: number | null
          question_id?: string | null
          seccion?: string | null
          tool?: Database["public"]["Enums"]["tool_name"]
        }
        Relationships: []
      }
      tool_question_vote: {
        Row: {
          created_at: string
          helpful: boolean
          id: string
          pregunta: string | null
          question_id: string | null
          seccion: string | null
          tool: string | null
        }
        Insert: {
          created_at?: string
          helpful: boolean
          id?: string
          pregunta?: string | null
          question_id?: string | null
          seccion?: string | null
          tool?: string | null
        }
        Update: {
          created_at?: string
          helpful?: boolean
          id?: string
          pregunta?: string | null
          question_id?: string | null
          seccion?: string | null
          tool?: string | null
        }
        Relationships: []
      }
      tool_survey: {
        Row: {
          created_at: string
          email: string | null
          id: string
          p1_institucion: string | null
          p10_comentario: string | null
          p11_acompanamiento: string | null
          p11_apellido: string | null
          p11_correo: string | null
          p11_nombre: string | null
          p2_facilidad_uso: number | null
          p3_orientacion: number | null
          p4_participacion: number | null
          p5_adecuacion: number | null
          p6_lenguaje: number | null
          p7_recomendaciones: number | null
          p8_recomendaria: string | null
          p9_detalle: string | null
          p9_falta_tema: string | null
          progreso: number | null
          tool: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          p1_institucion?: string | null
          p10_comentario?: string | null
          p11_acompanamiento?: string | null
          p11_apellido?: string | null
          p11_correo?: string | null
          p11_nombre?: string | null
          p2_facilidad_uso?: number | null
          p3_orientacion?: number | null
          p4_participacion?: number | null
          p5_adecuacion?: number | null
          p6_lenguaje?: number | null
          p7_recomendaciones?: number | null
          p8_recomendaria?: string | null
          p9_detalle?: string | null
          p9_falta_tema?: string | null
          progreso?: number | null
          tool?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          p1_institucion?: string | null
          p10_comentario?: string | null
          p11_acompanamiento?: string | null
          p11_apellido?: string | null
          p11_correo?: string | null
          p11_nombre?: string | null
          p2_facilidad_uso?: number | null
          p3_orientacion?: number | null
          p4_participacion?: number | null
          p5_adecuacion?: number | null
          p6_lenguaje?: number | null
          p7_recomendaciones?: number | null
          p8_recomendaria?: string | null
          p9_detalle?: string | null
          p9_falta_tema?: string | null
          progreso?: number | null
          tool?: string | null
        }
        Relationships: []
      }
      tool_users: {
        Row: {
          created_at: string
          email: string
          id: string
          origin: string | null
          tool_name: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          origin?: string | null
          tool_name: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          origin?: string | null
          tool_name?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      tool_survey_reporte: {
        Row: {
          created_at: string | null
          email: string | null
          id: string | null
          p10_comentario: string | null
          p11_acompanamiento: string | null
          p2_facilidad_uso: number | null
          p3_orientacion: number | null
          p4_participacion: number | null
          p5_adecuacion: number | null
          p6_lenguaje: number | null
          p7_recomendaciones: number | null
          p8_recomendaria: string | null
          p9_detalle: string | null
          p9_falta_tema: string | null
          progreso: number | null
          tool: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string | null
          p10_comentario?: string | null
          p11_acompanamiento?: string | null
          p2_facilidad_uso?: number | null
          p3_orientacion?: number | null
          p4_participacion?: number | null
          p5_adecuacion?: number | null
          p6_lenguaje?: number | null
          p7_recomendaciones?: number | null
          p8_recomendaria?: string | null
          p9_detalle?: string | null
          p9_falta_tema?: string | null
          progreso?: number | null
          tool?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string | null
          p10_comentario?: string | null
          p11_acompanamiento?: string | null
          p2_facilidad_uso?: number | null
          p3_orientacion?: number | null
          p4_participacion?: number | null
          p5_adecuacion?: number | null
          p6_lenguaje?: number | null
          p7_recomendaciones?: number | null
          p8_recomendaria?: string | null
          p9_detalle?: string | null
          p9_falta_tema?: string | null
          progreso?: number | null
          tool?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      can_join_project: { Args: { _project_id: string }; Returns: boolean }
      find_project_by_join_code: {
        Args: { _code: string }
        Returns: {
          id: string
          title: string
        }[]
      }
      gen_join_code: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_consultor: { Args: { _user_id: string }; Returns: boolean }
      is_project_member: {
        Args: { _project_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "ADMIN" | "USER" | "FORMULADOR" | "CONSULTOR" | "DOCENTE"
      comment_status: "PENDING" | "RESOLVED"
      feedback_type:
        | "Comentario general"
        | "Reporte de error"
        | "Sugerencia de mejora"
        | "Pregunta"
        | "Otro"
      notification_type:
        | "COMMENT_ADDED"
        | "COMMENT_RESOLVED"
        | "REVIEW_REQUESTED"
        | "STATUS_CHANGED"
        | "MEMBER_INVITED"
        | "PROJECT_APPROVED"
        | "MEMBER_JOINED"
      project_role: "FORMULADOR" | "CONSULTOR" | "COMENTARISTA"
      project_status:
        | "DRAFT"
        | "IN_REVIEW"
        | "WITH_OBSERVATIONS"
        | "APPROVED"
        | "ARCHIVED"
      tool_name:
        | "evaluacion de impacto"
        | "herramienta de sesgos"
        | "herramienta de transparencia"
        | "herramienta de formulacion"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["ADMIN", "USER", "FORMULADOR", "CONSULTOR", "DOCENTE"],
      comment_status: ["PENDING", "RESOLVED"],
      feedback_type: [
        "Comentario general",
        "Reporte de error",
        "Sugerencia de mejora",
        "Pregunta",
        "Otro",
      ],
      notification_type: [
        "COMMENT_ADDED",
        "COMMENT_RESOLVED",
        "REVIEW_REQUESTED",
        "STATUS_CHANGED",
        "MEMBER_INVITED",
        "PROJECT_APPROVED",
        "MEMBER_JOINED",
      ],
      project_role: ["FORMULADOR", "CONSULTOR", "COMENTARISTA"],
      project_status: [
        "DRAFT",
        "IN_REVIEW",
        "WITH_OBSERVATIONS",
        "APPROVED",
        "ARCHIVED",
      ],
      tool_name: [
        "evaluacion de impacto",
        "herramienta de sesgos",
        "herramienta de transparencia",
        "herramienta de formulacion",
      ],
    },
  },
} as const
