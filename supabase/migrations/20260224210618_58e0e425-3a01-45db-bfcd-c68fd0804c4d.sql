
-- Fix user_roles: admin can view all, users can view own
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'ADMIN'));

-- Fix organizations: only allow creating if user is authenticated (already scoped, but make more specific)
DROP POLICY "Authenticated users can create organizations" ON public.organizations;
CREATE POLICY "Authenticated users can create organizations" ON public.organizations FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- Fix notifications: only project members can create notifications for that project
DROP POLICY "Authenticated can insert notifications" ON public.notifications;
CREATE POLICY "Members can insert notifications" ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (public.is_project_member(auth.uid(), project_id));
