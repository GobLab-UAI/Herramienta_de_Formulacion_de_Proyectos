CREATE TABLE public.user_folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL DEFAULT 'Nueva carpeta',
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_folders TO authenticated;
GRANT ALL ON public.user_folders TO service_role;
ALTER TABLE public.user_folders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own folders" ON public.user_folders FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE public.user_folder_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  folder_id uuid NOT NULL REFERENCES public.user_folders(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, project_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_folder_projects TO authenticated;
GRANT ALL ON public.user_folder_projects TO service_role;
ALTER TABLE public.user_folder_projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own folder items" ON public.user_folder_projects FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());