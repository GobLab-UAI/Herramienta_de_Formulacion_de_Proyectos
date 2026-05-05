CREATE OR REPLACE FUNCTION public.can_join_project(_project_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.projects p
    WHERE p.id = _project_id
      AND p.deleted_at IS NULL
  )
$$;

DROP POLICY IF EXISTS "Users can join projects" ON public.project_members;

CREATE POLICY "Users can join projects" ON public.project_members
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND public.can_join_project(project_id)
  );

GRANT EXECUTE ON FUNCTION public.can_join_project(uuid) TO authenticated;