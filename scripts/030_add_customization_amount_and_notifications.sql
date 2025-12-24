-- ============================================
-- ADD CUSTOMIZATION AMOUNT AND NOTIFICATIONS
-- ============================================

-- Step 1: Add customization_amount to products table
ALTER TABLE IF EXISTS public.products
ADD COLUMN IF NOT EXISTS customization_amount DECIMAL(10, 2);

COMMENT ON COLUMN public.products.customization_amount IS 'Amount user needs to pay to customize this product to template design';

-- Step 2: Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  related_id UUID,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS notifications_read_idx ON public.notifications(read);

-- Step 3: Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Step 4: RLS Policies
CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Step 5: Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.notifications TO authenticated;

-- Done!
SELECT 'Customization amount and notifications table created successfully!' as result;





