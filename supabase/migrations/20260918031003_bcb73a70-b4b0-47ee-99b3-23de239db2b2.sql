CREATE OR REPLACE FUNCTION public.set_with_observations_on_comment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = NEW.author_id AND role IN ('CONSULTOR', 'DOCENTE', 'ADMIN')
  ) OR EXISTS (
    SELECT 1 FROM public.project_members
    WHERE project_id = NEW.project_id AND user_id = NEW.author_id AND role = 'COMENTARISTA'
  ) THEN
    UPDATE public.projects
    SET status = 'WITH_OBSERVATIONS'
    WHERE id = NEW.project_id
      AND status IN ('IN_REVIEW', 'APPROVED');
  END IF;
  RETURN NEW;
END;
$function$;