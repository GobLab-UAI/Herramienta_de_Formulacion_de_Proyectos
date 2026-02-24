
-- Drop restrictive policies and recreate as permissive
DROP POLICY "Authenticated can create projects" ON public.projects;
DROP POLICY "Members can view their projects" ON public.projects;
DROP POLICY "Members can update projects" ON public.projects;

CREATE POLICY "Authenticated can create projects" ON public.projects
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Members can view their projects" ON public.projects
  FOR SELECT TO authenticated
  USING (is_project_member(auth.uid(), id) OR has_role(auth.uid(), 'ADMIN'));

CREATE POLICY "Members can update projects" ON public.projects
  FOR UPDATE TO authenticated
  USING (is_project_member(auth.uid(), id) OR has_role(auth.uid(), 'ADMIN'));
