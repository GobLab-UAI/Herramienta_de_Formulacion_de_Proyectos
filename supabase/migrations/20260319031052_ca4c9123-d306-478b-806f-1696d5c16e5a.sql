
-- Enum for feedback type
CREATE TYPE public.feedback_type AS ENUM (
  'Comentario general',
  'Reporte de error',
  'Sugerencia de mejora',
  'Pregunta',
  'Otro'
);

-- Enum for tool name
CREATE TYPE public.tool_name AS ENUM (
  'evaluacion de impacto',
  'herramienta de sesgos',
  'herramienta de transparencia',
  'herramienta de formulacion'
);

-- Feedback table
CREATE TABLE public.tool_feedback (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  tool tool_name NOT NULL,
  organization text,
  feedback_type feedback_type NOT NULL,
  description text NOT NULL,
  email text NOT NULL
);

-- Enable RLS
ALTER TABLE public.tool_feedback ENABLE ROW LEVEL SECURITY;

-- Public insert and select (like tool_users)
CREATE POLICY "Anyone can insert feedback" ON public.tool_feedback FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Anyone can select feedback" ON public.tool_feedback FOR SELECT TO public USING (true);
