-- Add updated_by column to evacuation_centers table
ALTER TABLE public.evacuation_centers
  ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES public.users(id) ON DELETE SET NULL;

-- Add index for efficient lookups
CREATE INDEX IF NOT EXISTS evacuation_centers_updated_by_idx ON public.evacuation_centers(updated_by);
