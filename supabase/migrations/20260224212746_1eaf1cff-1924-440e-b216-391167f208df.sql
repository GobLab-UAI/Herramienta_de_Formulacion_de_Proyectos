
DROP POLICY "Members can view their projects" ON public.projects;
CREATE POLICY "Members can view their projects" ON public.projects
  FOR SELECT TO authenticated
  USING (
    is_project_member(auth.uid(), id)
    OR auth.uid() = created_by
    OR has_role(auth.uid(), 'ADMIN')
  );

DROP POLICY "Members can update projects" ON public.projects;
CREATE POLICY "Members can update projects" ON public.projects
  FOR UPDATE TO authenticated
  USING (
    is_project_member(auth.uid(), id)
    OR auth.uid() = created_by
    OR has_role(auth.uid(), 'ADMIN')
  );
