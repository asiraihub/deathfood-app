
-- Create chat_history table to store conversations
CREATE TABLE public.chat_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  analysis_id UUID REFERENCES public.analysis_history(id) ON DELETE CASCADE,
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.chat_history ENABLE ROW LEVEL SECURITY;

-- Public read/insert/update since no auth
CREATE POLICY "Anyone can view chat history" ON public.chat_history FOR SELECT USING (true);
CREATE POLICY "Anyone can insert chat history" ON public.chat_history FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update chat history" ON public.chat_history FOR UPDATE USING (true);
