
-- Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, avatar_url, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', ''),
    NEW.email
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- Add user_id to analysis_history (nullable for anonymous)
ALTER TABLE public.analysis_history ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id to chat_history (nullable for anonymous)
ALTER TABLE public.chat_history ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update RLS policies for analysis_history
DROP POLICY IF EXISTS "Anyone can insert analysis history" ON public.analysis_history;
DROP POLICY IF EXISTS "Anyone can view analysis history" ON public.analysis_history;

CREATE POLICY "Anyone can insert analysis history"
ON public.analysis_history FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users see own or public analysis"
ON public.analysis_history FOR SELECT
USING (
  user_id IS NULL OR user_id = auth.uid()
);

-- Update RLS policies for chat_history
DROP POLICY IF EXISTS "Anyone can insert chat history" ON public.chat_history;
DROP POLICY IF EXISTS "Anyone can view chat history" ON public.chat_history;
DROP POLICY IF EXISTS "Anyone can update chat history" ON public.chat_history;

CREATE POLICY "Anyone can insert chat history"
ON public.chat_history FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users see own or public chats"
ON public.chat_history FOR SELECT
USING (
  user_id IS NULL OR user_id = auth.uid()
);

CREATE POLICY "Users can update own or public chats"
ON public.chat_history FOR UPDATE
USING (
  user_id IS NULL OR user_id = auth.uid()
);

-- Update timestamps trigger for profiles
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
