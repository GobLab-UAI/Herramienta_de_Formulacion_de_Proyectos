
CREATE TABLE public.tool_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  tool_name text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (email, tool_name)
);

ALTER TABLE public.tool_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert tool_users"
  ON public.tool_users FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can select tool_users"
  ON public.tool_users FOR SELECT
  USING (true);
