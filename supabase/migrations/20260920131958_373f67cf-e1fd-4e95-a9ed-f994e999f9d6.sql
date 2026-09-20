CREATE OR REPLACE FUNCTION public.approve_project(_project_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _uid uuid := auth.uid();
  _pending int;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'No autenticado';
  END IF;

  IF NOT (
    public.has_role(_uid, 'CONSULTOR')
    OR public.has_role(_uid, 'ADMIN')
    OR (public.is_docente(_uid) AND public.is_project_member(_uid, _project_id))
  ) THEN
    RAISE EXCEPTION 'No tienes permiso para aprobar este proyecto';
  END IF;

  SELECT count(*) INTO _pending
  FROM public.comments
  WHERE project_id = _project_id
    AND deleted_at IS NULL
    AND parent_id IS NULL
    AND status = 'PENDING';

  IF _pending > 0 THEN
    RAISE EXCEPTION 'Hay comentarios pendientes por resolver';
  END IF;

  UPDATE public.projects
  SET status = 'APPROVED'
  WHERE id = _project_id AND deleted_at IS NULL;
END;
$function$;