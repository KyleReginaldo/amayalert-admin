CREATE TABLE public.emergency_hotlines (
  id          SERIAL PRIMARY KEY,
  category    VARCHAR(100)               NOT NULL,
  name        VARCHAR(255)               NOT NULL,
  phones      TEXT[]       DEFAULT '{}'  NOT NULL,
  landlines   TEXT[]       DEFAULT '{}'  NOT NULL,
  created_at  TIMESTAMPTZ  DEFAULT NOW() NOT NULL,
  created_by  UUID         REFERENCES public.users(id) ON DELETE SET NULL,
  updated_at  TIMESTAMPTZ,
  updated_by  UUID         REFERENCES public.users(id) ON DELETE SET NULL
);

CREATE INDEX emergency_hotlines_category_idx ON public.emergency_hotlines(category);

-- Enable RLS (admins manage via service role / server-side calls)
ALTER TABLE public.emergency_hotlines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for authenticated admins"
  ON public.emergency_hotlines
  FOR ALL
  USING (true)
  WITH CHECK (true);
