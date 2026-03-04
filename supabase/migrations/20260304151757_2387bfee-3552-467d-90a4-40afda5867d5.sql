
-- Add username and entidad columns to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS entidad text;

-- Handle existing rows
UPDATE public.profiles SET username = id::text WHERE username IS NULL;
ALTER TABLE public.profiles ALTER COLUMN username SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_unique ON public.profiles(username);

-- Profiles RLS updates
DROP POLICY IF EXISTS "Public can view profiles" ON public.profiles;
CREATE POLICY "Authenticated can view profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Projects RLS
DROP POLICY IF EXISTS "Public can view projects" ON public.projects;
CREATE POLICY "Authenticated can view projects" ON public.projects FOR SELECT TO authenticated
  USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'CONSULTOR') OR public.has_role(auth.uid(), 'ADMIN'));

DROP POLICY IF EXISTS "Public can insert projects" ON public.projects;
CREATE POLICY "Authenticated can insert projects" ON public.projects FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "Public can update projects" ON public.projects;
CREATE POLICY "Authenticated can update projects" ON public.projects FOR UPDATE TO authenticated USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'CONSULTOR'));

-- Comments RLS
DROP POLICY IF EXISTS "Public can view comments" ON public.comments;
CREATE POLICY "Authenticated can view comments" ON public.comments FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Public can insert comments" ON public.comments;
CREATE POLICY "Authenticated can insert comments" ON public.comments FOR INSERT TO authenticated WITH CHECK (author_id = auth.uid());
DROP POLICY IF EXISTS "Public can update comments" ON public.comments;
CREATE POLICY "Authenticated can update comments" ON public.comments FOR UPDATE TO authenticated USING (true);

-- Form responses RLS
DROP POLICY IF EXISTS "Public can view responses" ON public.form_responses;
CREATE POLICY "Authenticated can view responses" ON public.form_responses FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Public can insert responses" ON public.form_responses;
CREATE POLICY "Authenticated can insert responses" ON public.form_responses FOR INSERT TO authenticated WITH CHECK (updated_by = auth.uid());
DROP POLICY IF EXISTS "Public can update responses" ON public.form_responses;
CREATE POLICY "Authenticated can update responses" ON public.form_responses FOR UPDATE TO authenticated USING (true);

-- Field history RLS
DROP POLICY IF EXISTS "Public can view history" ON public.field_history;
CREATE POLICY "Authenticated can view history" ON public.field_history FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Public can insert history" ON public.field_history;
CREATE POLICY "Authenticated can insert history" ON public.field_history FOR INSERT TO authenticated WITH CHECK (changed_by = auth.uid());

-- Organizations RLS
DROP POLICY IF EXISTS "Public can view organizations" ON public.organizations;
CREATE POLICY "Authenticated can view organizations" ON public.organizations FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Public can insert organizations" ON public.organizations;
CREATE POLICY "Authenticated can insert organizations" ON public.organizations FOR INSERT TO authenticated WITH CHECK (true);

-- Notifications RLS
DROP POLICY IF EXISTS "Public can view notifications" ON public.notifications;
CREATE POLICY "Authenticated can view notifications" ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Public can insert notifications" ON public.notifications;
CREATE POLICY "Authenticated can insert notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Public can update notifications" ON public.notifications;
CREATE POLICY "Authenticated can update notifications" ON public.notifications FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- Project members RLS
DROP POLICY IF EXISTS "Public can view project members" ON public.project_members;
CREATE POLICY "Authenticated can view project members" ON public.project_members FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Public can insert project members" ON public.project_members;
CREATE POLICY "Authenticated can insert project members" ON public.project_members FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Public can update project members" ON public.project_members;
CREATE POLICY "Authenticated can update project members" ON public.project_members FOR UPDATE TO authenticated USING (true);
DROP POLICY IF EXISTS "Public can delete project members" ON public.project_members;
CREATE POLICY "Authenticated can delete project members" ON public.project_members FOR DELETE TO authenticated USING (true);

-- User roles RLS
DROP POLICY IF EXISTS "Public can view roles" ON public.user_roles;
CREATE POLICY "Authenticated can view roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());

-- Update handle_new_user trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, username, entidad, cargo)
  VALUES (
    NEW.id, NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'username', NEW.id::text),
    NEW.raw_user_meta_data->>'entidad',
    NEW.raw_user_meta_data->>'cargo'
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'FORMULADOR');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
