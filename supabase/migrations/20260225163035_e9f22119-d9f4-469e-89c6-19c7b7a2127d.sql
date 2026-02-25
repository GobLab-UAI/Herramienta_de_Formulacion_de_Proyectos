
-- Remove foreign key constraint on comments.author_id that references auth.users
ALTER TABLE public.comments DROP CONSTRAINT IF EXISTS comments_author_id_fkey;

-- Also remove FK on resolved_by if it exists
ALTER TABLE public.comments DROP CONSTRAINT IF EXISTS comments_resolved_by_fkey;

-- Remove FK on form_responses.updated_by if it exists
ALTER TABLE public.form_responses DROP CONSTRAINT IF EXISTS form_responses_updated_by_fkey;

-- Remove FK on field_history.changed_by if it exists
ALTER TABLE public.field_history DROP CONSTRAINT IF EXISTS field_history_changed_by_fkey;

-- Remove FK on projects.created_by if it exists
ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_created_by_fkey;

-- Remove FK on notifications.user_id if it exists
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_user_id_fkey;
