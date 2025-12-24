-- Add order_type to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS order_type TEXT DEFAULT 'product' CHECK (order_type IN ('product', 'customization'));

-- Add order_number if it doesn't exist
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS order_number TEXT;





