
-- Drop FK to auth.users (per project convention)
ALTER TABLE public.project_members DROP CONSTRAINT IF EXISTS project_members_user_id_fkey;

-- 1. Add columns
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS join_code text UNIQUE;
ALTER TABLE public.project_members ADD COLUMN IF NOT EXISTS custom_role text;

-- 2. Add MEMBER_JOINED notification type
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'MEMBER_JOINED';

-- 3. gen_join_code
CREATE OR REPLACE FUNCTION public.gen_join_code()
RETURNS text LANGUAGE plpgsql AS $$
DECLARE
  letters text := 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  digits text := '0123456789';
  code text; attempts int := 0;
BEGIN
  LOOP
    code :=
      substr(letters, 1 + floor(random() * length(letters))::int, 1) ||
      substr(letters, 1 + floor(random() * length(letters))::int, 1) ||
      substr(letters, 1 + floor(random() * length(letters))::int, 1) ||
      substr(digits, 1 + floor(random() * length(digits))::int, 1) ||
      substr(digits, 1 + floor(random() * length(digits))::int, 1) ||
      substr(digits, 1 + floor(random() * length(digits))::int, 1);
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.projects WHERE join_code = code);
    attempts := attempts + 1;
    IF attempts > 50 THEN RAISE EXCEPTION 'Could not generate unique join code'; END IF;
  END LOOP;
  RETURN code;
END$$;

-- 4. Triggers
CREATE OR REPLACE FUNCTION public.handle_new_project()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.join_code IS NULL THEN NEW.join_code := public.gen_join_code(); END IF;
  RETURN NEW;
END$$;

DROP TRIGGER IF EXISTS trg_projects_before_insert ON public.projects;
CREATE TRIGGER trg_projects_before_insert
  BEFORE INSERT ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_project();

CREATE OR REPLACE FUNCTION public.handle_new_project_after()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.project_members (project_id, user_id, role, custom_role, is_owner, joined_at)
  VALUES (NEW.id, NEW.created_by, 'FORMULADOR', 'Creador del proyecto', true, now())
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END$$;

DROP TRIGGER IF EXISTS trg_projects_after_insert ON public.projects;
CREATE TRIGGER trg_projects_after_insert
  AFTER INSERT ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_project_after();

-- 5. Backfill
UPDATE public.projects SET join_code = public.gen_join_code() WHERE join_code IS NULL;

INSERT INTO public.project_members (project_id, user_id, role, custom_role, is_owner, joined_at)
SELECT p.id, p.created_by, 'FORMULADOR', 'Creador del proyecto', true, now()
FROM public.projects p
WHERE NOT EXISTS (
  SELECT 1 FROM public.project_members m WHERE m.project_id = p.id AND m.user_id = p.created_by
)
ON CONFLICT DO NOTHING;

ALTER TABLE public.projects ALTER COLUMN join_code SET NOT NULL;

-- 6. Notify owner on join
CREATE OR REPLACE FUNCTION public.notify_member_joined()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE owner_id uuid;
BEGIN
  IF NEW.is_owner THEN RETURN NEW; END IF;
  SELECT created_by INTO owner_id FROM public.projects WHERE id = NEW.project_id;
  IF owner_id IS NOT NULL AND owner_id <> NEW.user_id THEN
    INSERT INTO public.notifications (user_id, project_id, type, payload)
    VALUES (owner_id, NEW.project_id, 'MEMBER_JOINED',
      jsonb_build_object('user_id', NEW.user_id, 'custom_role', NEW.custom_role));
  END IF;
  RETURN NEW;
END$$;

DROP TRIGGER IF EXISTS trg_member_joined ON public.project_members;
CREATE TRIGGER trg_member_joined
  AFTER INSERT ON public.project_members
  FOR EACH ROW EXECUTE FUNCTION public.notify_member_joined();

-- 7. RLS rewrites
DROP POLICY IF EXISTS "Authenticated can view projects" ON public.projects;
CREATE POLICY "Authenticated can view projects" ON public.projects
  FOR SELECT TO authenticated
  USING (
    created_by = auth.uid()
    OR public.is_project_member(auth.uid(), id)
    OR public.has_role(auth.uid(), 'CONSULTOR')
    OR public.has_role(auth.uid(), 'ADMIN')
  );

DROP POLICY IF EXISTS "Authenticated can update projects" ON public.projects;
CREATE POLICY "Authenticated can update projects" ON public.projects
  FOR UPDATE TO authenticated
  USING (
    created_by = auth.uid()
    OR public.is_project_member(auth.uid(), id)
    OR public.has_role(auth.uid(), 'CONSULTOR')
  );

DROP POLICY IF EXISTS "Authenticated can view project members" ON public.project_members;
DROP POLICY IF EXISTS "Authenticated can insert project members" ON public.project_members;
DROP POLICY IF EXISTS "Authenticated can update project members" ON public.project_members;
DROP POLICY IF EXISTS "Authenticated can delete project members" ON public.project_members;

CREATE POLICY "Members can view project members" ON public.project_members
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can join projects" ON public.project_members
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND EXISTS (SELECT 1 FROM public.projects WHERE id = project_id));

CREATE POLICY "Users can update own membership or owner can manage" ON public.project_members
  FOR UPDATE TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.created_by = auth.uid())
  );

CREATE POLICY "Owner can remove members" ON public.project_members
  FOR DELETE TO authenticated
  USING (
    (user_id = auth.uid() AND is_owner = false)
    OR EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.created_by = auth.uid())
  );

CREATE INDEX IF NOT EXISTS idx_projects_join_code ON public.projects(join_code);
CREATE INDEX IF NOT EXISTS idx_project_members_user ON public.project_members(user_id);
