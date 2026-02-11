
-- Create analysis_history table
CREATE TABLE public.analysis_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  image_url TEXT NOT NULL,
  ingredients JSONB NOT NULL DEFAULT '[]'::jsonb,
  summary_bn TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.analysis_history ENABLE ROW LEVEL SECURITY;

-- Public read/insert (no auth required)
CREATE POLICY "Anyone can view analysis history"
ON public.analysis_history FOR SELECT USING (true);

CREATE POLICY "Anyone can insert analysis history"
ON public.analysis_history FOR INSERT WITH CHECK (true);
