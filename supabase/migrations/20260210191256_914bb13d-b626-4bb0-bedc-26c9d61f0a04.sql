
-- App settings table (single row, no auth needed - admin only)
CREATE TABLE public.app_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ai_provider TEXT NOT NULL DEFAULT 'lovable' CHECK (ai_provider IN ('lovable', 'openai')),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default row
INSERT INTO public.app_settings (ai_provider) VALUES ('lovable');

-- Enable RLS
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Public read access (anyone can read which provider is active)
CREATE POLICY "Anyone can read app settings"
ON public.app_settings FOR SELECT
USING (true);

-- No public write - admin dashboard will use service role or direct update
