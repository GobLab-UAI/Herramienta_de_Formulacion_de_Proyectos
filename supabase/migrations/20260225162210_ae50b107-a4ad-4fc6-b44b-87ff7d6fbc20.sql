
-- Drop all existing restrictive policies and replace with permissive ones for public access

-- comments
DROP POLICY IF EXISTS "Members can insert comments" ON public.comments;
DROP POLICY IF EXISTS "Members can update comments" ON public.comments;
DROP POLICY IF EXISTS "Members can view comments" ON public.comments;

CREATE POLICY "Public can view comments" ON public.comments FOR SELECT USING (true);
CREATE POLICY "Public can insert comments" ON public.comments FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can update comments" ON public.comments FOR UPDATE USING (true);

-- field_history
DROP POLICY IF EXISTS "Members can insert history" ON public.field_history;
DROP POLICY IF EXISTS "Members can view history" ON public.field_history;

CREATE POLICY "Public can view history" ON public.field_history FOR SELECT USING (true);
CREATE POLICY "Public can insert history" ON public.field_history FOR INSERT WITH CHECK (true);

-- form_responses
DROP POLICY IF EXISTS "Members can insert responses" ON public.form_responses;
DROP POLICY IF EXISTS "Members can update responses" ON public.form_responses;
DROP POLICY IF EXISTS "Members can view responses" ON public.form_responses;

CREATE POLICY "Public can view responses" ON public.form_responses FOR SELECT USING (true);
CREATE POLICY "Public can insert responses" ON public.form_responses FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can update responses" ON public.form_responses FOR UPDATE USING (true);

-- notifications
DROP POLICY IF EXISTS "Members can insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;

CREATE POLICY "Public can view notifications" ON public.notifications FOR SELECT USING (true);
CREATE POLICY "Public can insert notifications" ON public.notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can update notifications" ON public.notifications FOR UPDATE USING (true);

-- organizations
DROP POLICY IF EXISTS "Authenticated users can create organizations" ON public.organizations;
DROP POLICY IF EXISTS "Authenticated users can view organizations" ON public.organizations;

CREATE POLICY "Public can view organizations" ON public.organizations FOR SELECT USING (true);
CREATE POLICY "Public can insert organizations" ON public.organizations FOR INSERT WITH CHECK (true);

-- profiles
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

CREATE POLICY "Public can view profiles" ON public.profiles FOR SELECT USING (true);

-- project_members
DROP POLICY IF EXISTS "Members can delete project members" ON public.project_members;
DROP POLICY IF EXISTS "Members can insert project members" ON public.project_members;
DROP POLICY IF EXISTS "Members can update project members" ON public.project_members;
DROP POLICY IF EXISTS "Members can view project members" ON public.project_members;

CREATE POLICY "Public can view project members" ON public.project_members FOR SELECT USING (true);
CREATE POLICY "Public can insert project members" ON public.project_members FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can update project members" ON public.project_members FOR UPDATE USING (true);
CREATE POLICY "Public can delete project members" ON public.project_members FOR DELETE USING (true);

-- projects
DROP POLICY IF EXISTS "Authenticated can create projects" ON public.projects;
DROP POLICY IF EXISTS "Members can update projects" ON public.projects;
DROP POLICY IF EXISTS "Members can view their projects" ON public.projects;

CREATE POLICY "Public can view projects" ON public.projects FOR SELECT USING (true);
CREATE POLICY "Public can insert projects" ON public.projects FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can update projects" ON public.projects FOR UPDATE USING (true);

-- user_roles
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;

CREATE POLICY "Public can view roles" ON public.user_roles FOR SELECT USING (true);
