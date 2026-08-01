-- Restore UUID generation for inserts on databases created from an older schema.
ALTER TABLE public.students
  ALTER COLUMN id SET DEFAULT gen_random_uuid();

ALTER TABLE public.term_scores
  ALTER COLUMN id SET DEFAULT gen_random_uuid();