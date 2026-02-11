
-- Table for premium credit packages
CREATE TABLE public.credit_packages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  credits integer NOT NULL,
  price_bdt numeric NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.credit_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active packages" ON public.credit_packages
  FOR SELECT USING (is_active = true);

-- Insert default packages
INSERT INTO public.credit_packages (name, credits, price_bdt) VALUES
  ('স্টার্টার', 50, 100),
  ('প্রো', 150, 250),
  ('আনলিমিটেড', 500, 500);

-- Add purchased_credits to profiles
ALTER TABLE public.profiles ADD COLUMN purchased_credits integer NOT NULL DEFAULT 0;

-- Payment requests table
CREATE TABLE public.payment_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  package_id uuid NOT NULL REFERENCES public.credit_packages(id),
  payment_method text NOT NULL DEFAULT 'bkash',
  transaction_id text NOT NULL,
  phone_number text NOT NULL,
  amount numeric NOT NULL,
  credits integer NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  admin_note text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.payment_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payment requests" ON public.payment_requests
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create payment requests" ON public.payment_requests
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admin can view all payment requests" ON public.payment_requests
  FOR SELECT USING (true);

CREATE POLICY "Admin can update payment requests" ON public.payment_requests
  FOR UPDATE USING (true);

CREATE TRIGGER update_payment_requests_updated_at
  BEFORE UPDATE ON public.payment_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
