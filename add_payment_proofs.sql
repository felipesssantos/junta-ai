-- Add proof_url column to payments table
ALTER TABLE public.payments
ADD COLUMN IF NOT EXISTS proof_url text;

-- The bucket 'expense-proofs' is already set up and public.
-- We will reuse it for payment proofs.
