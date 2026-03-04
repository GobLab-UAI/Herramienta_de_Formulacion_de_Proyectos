-- Add a PERMISSIVE policy allowing anon users to select email by username for login
CREATE POLICY "Anon can lookup email by username"
ON public.profiles
FOR SELECT
TO anon
USING (true);
