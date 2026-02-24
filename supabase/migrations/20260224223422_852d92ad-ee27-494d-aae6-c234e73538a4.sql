
-- Function to check if a user is a global consultor
CREATE OR REPLACE FUNCTION public.is_consultor(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.project_members 
    WHERE user_id = _user_id AND role = 'CONSULTOR'
  )
$$;

-- Projects: consultors can view all projects
DROP POLICY IF EXISTS "Members can view their projects" ON public.projects;
CREATE POLICY "Members can view their projects" ON public.projects
FOR SELECT USING (
  is_project_member(auth.uid(), id) 
  OR auth.uid() = created_by 
  OR has_role(auth.uid(), 'ADMIN')
  OR is_consultor(auth.uid())
);

-- Form responses: consultors can view all
DROP POLICY IF EXISTS "Members can view responses" ON public.form_responses;
CREATE POLICY "Members can view responses" ON public.form_responses
FOR SELECT USING (
  is_project_member(auth.uid(), project_id)
  OR is_consultor(auth.uid())
);

-- Comments: consultors can view, insert, update on all projects
DROP POLICY IF EXISTS "Members can view comments" ON public.comments;
CREATE POLICY "Members can view comments" ON public.comments
FOR SELECT USING (
  is_project_member(auth.uid(), project_id)
  OR is_consultor(auth.uid())
);

DROP POLICY IF EXISTS "Members can insert comments" ON public.comments;
CREATE POLICY "Members can insert comments" ON public.comments
FOR INSERT WITH CHECK (
  is_project_member(auth.uid(), project_id)
  OR is_consultor(auth.uid())
);

DROP POLICY IF EXISTS "Members can update comments" ON public.comments;
CREATE POLICY "Members can update comments" ON public.comments
FOR UPDATE USING (
  is_project_member(auth.uid(), project_id)
  OR is_consultor(auth.uid())
);

-- Project members: consultors can view all
DROP POLICY IF EXISTS "Members can view project members" ON public.project_members;
CREATE POLICY "Members can view project members" ON public.project_members
FOR SELECT USING (
  is_project_member(auth.uid(), project_id) 
  OR has_role(auth.uid(), 'ADMIN')
  OR is_consultor(auth.uid())
);
