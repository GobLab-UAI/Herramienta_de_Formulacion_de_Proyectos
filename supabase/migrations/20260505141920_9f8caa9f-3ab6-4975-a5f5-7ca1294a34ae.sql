CREATE OR REPLACE FUNCTION public.find_project_by_join_code(_code text)
RETURNS TABLE(id uuid, title text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.title FROM public.projects p
  WHERE p.join_code = upper(_code) AND p.deleted_at IS NULL
  LIMIT 1
$$;

GRANT EXECUTE ON FUNCTION public.find_project_by_join_code(text) TO authenticated;