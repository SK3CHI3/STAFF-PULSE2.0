-- Migration: Create payments and subscriptions tables with functions
-- This sets up the payment processing and subscription management system

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  plan_name TEXT NOT NULL CHECK (plan_name IN ('startup', 'business', 'enterprise')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired')),
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create payments table
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'KES',
  payment_ref TEXT NOT NULL UNIQUE,
  provider TEXT NOT NULL DEFAULT 'intasend',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('completed', 'pending', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_organization_id ON public.subscriptions(organization_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_payments_organization_id ON public.payments(organization_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_ref ON public.payments(payment_ref);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);

-- Enable RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for subscriptions
DROP POLICY IF EXISTS "Users can view organization subscriptions" ON public.subscriptions;
CREATE POLICY "Users can view organization subscriptions" ON public.subscriptions
  FOR SELECT TO authenticated
  USING (
    organization_id = (
      SELECT organization_id FROM public.user_profiles 
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Super admins can view all subscriptions" ON public.subscriptions;
CREATE POLICY "Super admins can view all subscriptions" ON public.subscriptions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_id = auth.uid() AND role = 'super_admin'
    )
  );

-- Create RLS policies for payments
DROP POLICY IF EXISTS "Users can view organization payments" ON public.payments;
CREATE POLICY "Users can view organization payments" ON public.payments
  FOR SELECT TO authenticated
  USING (
    organization_id = (
      SELECT organization_id FROM public.user_profiles 
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Super admins can view all payments" ON public.payments;
CREATE POLICY "Super admins can view all payments" ON public.payments
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_id = auth.uid() AND role = 'super_admin'
    )
  );

-- Create get_current_plan function
CREATE OR REPLACE FUNCTION public.get_current_plan(org_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_subscription RECORD;
  result JSON;
BEGIN
  -- Get the most recent active subscription for the organization
  SELECT plan_name, status, started_at, expires_at
  INTO current_subscription
  FROM public.subscriptions
  WHERE organization_id = org_id
    AND status = 'active'
    AND (expires_at IS NULL OR expires_at > NOW())
  ORDER BY started_at DESC
  LIMIT 1;

  -- If no active subscription found, return default business plan
  IF current_subscription IS NULL THEN
    result := json_build_object(
      'plan_name', 'business',
      'status', 'active',
      'started_at', NOW(),
      'expires_at', NULL
    );
  ELSE
    result := json_build_object(
      'plan_name', current_subscription.plan_name,
      'status', current_subscription.status,
      'started_at', current_subscription.started_at,
      'expires_at', current_subscription.expires_at
    );
  END IF;

  RETURN result;
END;
$$;

-- Create activate_plan function
CREATE OR REPLACE FUNCTION public.activate_plan(
  org_id UUID,
  plan_name TEXT,
  payment_ref TEXT,
  amount DECIMAL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_subscription_id UUID;
  payment_id UUID;
  result JSON;
BEGIN
  -- Validate plan name
  IF plan_name NOT IN ('startup', 'business', 'enterprise') THEN
    RAISE EXCEPTION 'Invalid plan name: %', plan_name;
  END IF;

  -- Check if payment reference already exists
  SELECT id INTO payment_id
  FROM public.payments
  WHERE payment_ref = activate_plan.payment_ref;

  IF payment_id IS NOT NULL THEN
    RAISE EXCEPTION 'Payment reference already exists: %', payment_ref;
  END IF;

  -- Start transaction
  BEGIN
    -- Deactivate any existing active subscriptions
    UPDATE public.subscriptions
    SET status = 'cancelled',
        updated_at = NOW()
    WHERE organization_id = org_id
      AND status = 'active';

    -- Create new subscription
    INSERT INTO public.subscriptions (
      organization_id,
      plan_name,
      status,
      started_at,
      expires_at
    ) VALUES (
      org_id,
      activate_plan.plan_name,
      'active',
      NOW(),
      NULL -- No expiration for now, can be set for trial periods
    ) RETURNING id INTO new_subscription_id;

    -- Record the payment
    INSERT INTO public.payments (
      organization_id,
      subscription_id,
      amount,
      currency,
      payment_ref,
      provider,
      status
    ) VALUES (
      org_id,
      new_subscription_id,
      activate_plan.amount,
      'KES',
      activate_plan.payment_ref,
      'intasend',
      'completed'
    ) RETURNING id INTO payment_id;

    -- Return success result
    result := json_build_object(
      'success', true,
      'subscription_id', new_subscription_id,
      'payment_id', payment_id,
      'plan_name', activate_plan.plan_name,
      'message', 'Plan activated successfully'
    );

    RETURN result;

  EXCEPTION WHEN OTHERS THEN
    -- Rollback will happen automatically
    RAISE EXCEPTION 'Failed to activate plan: %', SQLERRM;
  END;
END;
$$;

-- Grant permissions
GRANT ALL ON public.subscriptions TO anon, authenticated;
GRANT ALL ON public.payments TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_plan(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.activate_plan(UUID, TEXT, TEXT, DECIMAL) TO anon, authenticated;

-- Create updated_at trigger for subscriptions
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
