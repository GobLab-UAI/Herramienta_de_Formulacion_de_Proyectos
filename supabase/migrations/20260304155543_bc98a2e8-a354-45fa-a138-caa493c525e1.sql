
-- Trigger: when a consultor inserts a comment on a project that is IN_REVIEW, set status to WITH_OBSERVATIONS
CREATE OR REPLACE FUNCTION public.set_with_observations_on_comment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only change status if the commenter is a consultor and project is IN_REVIEW
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = NEW.author_id AND role = 'CONSULTOR') THEN
    UPDATE public.projects
    SET status = 'WITH_OBSERVATIONS'
    WHERE id = NEW.project_id AND status = 'IN_REVIEW';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_comment_sets_observations
AFTER INSERT ON public.comments
FOR EACH ROW
EXECUTE FUNCTION public.set_with_observations_on_comment();
