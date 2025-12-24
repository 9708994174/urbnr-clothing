-- ============================================
-- ORDERS, SHIPPING, RETURNS/EXCHANGES TABLES
-- ============================================

-- Step 1: Update orders table with additional fields
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_status TEXT DEFAULT 'pending' CHECK (order_status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned', 'exchanged'));
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_status TEXT DEFAULT 'pending' CHECK (shipping_status IN ('pending', 'preparing', 'shipped', 'in_transit', 'out_for_delivery', 'delivered', 'failed'));
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tracking_number TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_info JSONB;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS email_sent BOOLEAN DEFAULT false;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_notification_sent BOOLEAN DEFAULT false;

-- Step 2: Create order_tracking table for tracking order status changes
CREATE TABLE IF NOT EXISTS public.order_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  message TEXT,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS order_tracking_order_id_idx ON public.order_tracking(order_id);

-- Step 3: Create returns table
CREATE TABLE IF NOT EXISTS public.order_returns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'processing', 'completed', 'cancelled')),
  refund_status TEXT DEFAULT 'pending' CHECK (refund_status IN ('pending', 'processing', 'completed', 'failed')),
  refund_amount DECIMAL(10, 2),
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approved_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  admin_notes TEXT
);

CREATE INDEX IF NOT EXISTS order_returns_order_id_idx ON public.order_returns(order_id);
CREATE INDEX IF NOT EXISTS order_returns_user_id_idx ON public.order_returns(user_id);

-- Step 4: Create exchanges table
CREATE TABLE IF NOT EXISTS public.order_exchanges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  description TEXT,
  requested_product_id UUID REFERENCES public.catalog_products(id),
  requested_size TEXT,
  requested_color TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'processing', 'completed', 'cancelled')),
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approved_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  admin_notes TEXT
);

CREATE INDEX IF NOT EXISTS order_exchanges_order_id_idx ON public.order_exchanges(order_id);
CREATE INDEX IF NOT EXISTS order_exchanges_user_id_idx ON public.order_exchanges(user_id);

-- Step 5: Create shipping_addresses table for user shipping details
CREATE TABLE IF NOT EXISTS public.shipping_addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  city TEXT NOT NULL,
  state TEXT,
  zip_code TEXT,
  country TEXT DEFAULT 'India',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS shipping_addresses_user_id_idx ON public.shipping_addresses(user_id);

-- Step 6: Enable RLS
ALTER TABLE public.order_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_exchanges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipping_addresses ENABLE ROW LEVEL SECURITY;

-- Step 7: RLS Policies for order_tracking
CREATE POLICY "Users can view tracking for their orders" ON public.order_tracking
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_tracking.order_id AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all tracking" ON public.order_tracking
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Step 8: RLS Policies for order_returns
CREATE POLICY "Users can view their own returns" ON public.order_returns
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own returns" ON public.order_returns
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all returns" ON public.order_returns
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update returns" ON public.order_returns
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Step 9: RLS Policies for order_exchanges
CREATE POLICY "Users can view their own exchanges" ON public.order_exchanges
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own exchanges" ON public.order_exchanges
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all exchanges" ON public.order_exchanges
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update exchanges" ON public.order_exchanges
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Step 10: RLS Policies for shipping_addresses
CREATE POLICY "Users can view their own addresses" ON public.shipping_addresses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own addresses" ON public.shipping_addresses
  FOR ALL USING (auth.uid() = user_id);

-- Step 11: Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.order_tracking TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.order_returns TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.order_exchanges TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shipping_addresses TO authenticated;

-- Done!
SELECT 'Orders, shipping, returns, and exchanges tables created successfully!' as result;





