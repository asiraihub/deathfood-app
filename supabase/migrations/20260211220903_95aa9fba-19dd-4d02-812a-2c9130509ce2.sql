
-- Fix overly permissive admin policies on payment_requests
-- Drop and recreate with proper check (we'll use service role in edge function for admin ops)
DROP POLICY "Admin can view all payment requests" ON public.payment_requests;
DROP POLICY "Admin can update payment requests" ON public.payment_requests;
