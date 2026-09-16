-- Helper: is the current user a docente?
CREATE OR REPLACE FUNCTION public.is_docente(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'DOCENTE'
  )
$$;

REVOKE EXECUTE ON FUNCTION public.is_docente(uuid) FROM anon;

-- PROJECTS -------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated can view projects" ON public.projects;
CREATE POLICY "Authenticated can view projects"
ON public.projects FOR SELECT TO authenticated
USING (
  CASE WHEN public.is_docente(auth.uid())
    THEN public.is_project_member(auth.uid(), id)
    ELSE (
      created_by = auth.uid()
      OR public.is_project_member(auth.uid(), id)
      OR public.has_role(auth.uid(), 'CONSULTOR')
      OR public.has_role(auth.uid(), 'ADMIN')
    )
  END
);

DROP POLICY IF EXISTS "Authenticated can insert projects" ON public.projects;
CREATE POLICY "Authenticated can insert projects"
ON public.projects FOR INSERT TO authenticated
WITH CHECK (created_by = auth.uid() AND NOT public.is_docente(auth.uid()));

DROP POLICY IF EXISTS "Authenticated can update projects" ON public.projects;
CREATE POLICY "Authenticated can update projects"
ON public.projects FOR UPDATE TO authenticated
USING (
  NOT public.is_docente(auth.uid())
  AND (
    created_by = auth.uid()
    OR public.is_project_member(auth.uid(), id)
    OR public.has_role(auth.uid(), 'CONSULTOR')
    OR public.has_role(auth.uid(), 'ADMIN')
  )
);

-- FORM RESPONSES -------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated can insert responses" ON public.form_responses;
CREATE POLICY "Authenticated can insert responses"
ON public.form_responses FOR INSERT TO authenticated
WITH CHECK (updated_by = auth.uid() AND NOT public.is_docente(auth.uid()));

DROP POLICY IF EXISTS "Authenticated can update responses" ON public.form_responses;
CREATE POLICY "Authenticated can update responses"
ON public.form_responses FOR UPDATE TO authenticated
USING (NOT public.is_docente(auth.uid()));

-- FIELD HISTORY --------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated can insert history" ON public.field_history;
CREATE POLICY "Authenticated can insert history"
ON public.field_history FOR INSERT TO authenticated
WITH CHECK (changed_by = auth.uid() AND NOT public.is_docente(auth.uid()));

-- COMMENTS: docentes may comment, but not silently edit others' comments
DROP POLICY IF EXISTS "Authenticated can update comments" ON public.comments;
CREATE POLICY "Authenticated can update comments"
ON public.comments FOR UPDATE TO authenticated
USING (NOT public.is_docente(auth.uid()) OR author_id = auth.uid());

-- USER ROLES: only the Superadmin can assign roles ----------------------
DROP POLICY IF EXISTS "Superadmin can view all roles" ON public.user_roles;
CREATE POLICY "Superadmin can view all roles"
ON public.user_roles FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'ADMIN'));

DROP POLICY IF EXISTS "Only superadmin can assign roles" ON public.user_roles;
CREATE POLICY "Only superadmin can assign roles"
ON public.user_roles FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'ADMIN'));

DROP POLICY IF EXISTS "Only superadmin can change roles" ON public.user_roles;
CREATE POLICY "Only superadmin can change roles"
ON public.user_roles FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'ADMIN'))
WITH CHECK (public.has_role(auth.uid(), 'ADMIN'));