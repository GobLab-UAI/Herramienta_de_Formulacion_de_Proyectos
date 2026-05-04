
ALTER TABLE public.projects ALTER COLUMN join_code SET DEFAULT public.gen_join_code();
