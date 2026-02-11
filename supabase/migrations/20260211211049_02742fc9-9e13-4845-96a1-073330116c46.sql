
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS has_diabetic boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS has_heart_problem boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS has_allergy boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS weight numeric,
ADD COLUMN IF NOT EXISTS height numeric,
ADD COLUMN IF NOT EXISTS health_notes text;
