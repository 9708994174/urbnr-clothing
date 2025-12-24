-- ============================================
-- ADD PAYMENT METHOD TO ORDERS TABLE
-- ============================================

-- Add payment_method column to orders table
ALTER TABLE IF EXISTS public.orders
ADD COLUMN IF NOT EXISTS payment_method TEXT CHECK (payment_method IN ('card', 'upi', 'cod'));

COMMENT ON COLUMN public.orders.payment_method IS 'Payment method used: card, upi, or cod';

-- Done!
SELECT 'Payment method column added to orders table!' as result;





