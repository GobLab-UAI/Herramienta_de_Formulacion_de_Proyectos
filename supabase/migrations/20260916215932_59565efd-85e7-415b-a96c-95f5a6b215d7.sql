CREATE OR REPLACE FUNCTION public.can_view_project(_user_id uuid, _project_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE WHEN public.is_docente(_user_id)
    THEN public.is_project_member(_user_id, _project_id)
    ELSE EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = _project_id
        AND (
          p.created_by = _user_id
          OR public.is_project_member(_user_id, _project_id)
          OR public.has_role(_user_id, 'CONSULTOR')
          OR public.has_role(_user_id, 'ADMIN')
        )
    )
  END
$$;

REVOKE EXECUTE ON FUNCTION public.can_view_project(uuid, uuid) FROM anon;

DROP POLICY IF EXISTS "Authenticated can view responses" ON public.form_responses;
CREATE POLICY "Authenticated can view responses"
ON public.form_responses FOR SELECT TO authenticated
USING (public.can_view_project(auth.uid(), project_id));

DROP POLICY IF EXISTS "Authenticated can view comments" ON public.comments;
CREATE POLICY "Authenticated can view comments"
ON public.comments FOR SELECT TO authenticated
USING (public.can_view_project(auth.uid(), project_id));

DROP POLICY IF EXISTS "Authenticated can insert comments" ON public.comments;
CREATE POLICY "Authenticated can insert comments"
ON public.comments FOR INSERT TO authenticated
WITH CHECK (author_id = auth.uid() AND public.can_view_project(auth.uid(), project_id));

DROP POLICY IF EXISTS "Authenticated can view history" ON public.field_history;
CREATE POLICY "Authenticated can view history"
ON public.field_history FOR SELECT TO authenticated
USING (public.can_view_project(auth.uid(), project_id));