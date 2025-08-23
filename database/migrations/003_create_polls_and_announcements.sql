-- Migration: Create polls/surveys and announcements tables
-- This extends the engagement platform with polls, surveys, and announcements functionality

-- Create polls table (combines polls and surveys into one flexible table)
CREATE TABLE IF NOT EXISTS public.polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  question TEXT NOT NULL,
  poll_type TEXT NOT NULL CHECK (poll_type IN ('multiple_choice', 'yes_no', 'rating', 'open_text')),
  options JSONB, -- For multiple choice options: ["Option 1", "Option 2", "Option 3"]
  rating_scale INTEGER DEFAULT 10, -- For rating polls (1-5, 1-10, etc.)
  is_anonymous BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE,
  target_type TEXT DEFAULT 'all' CHECK (target_type IN ('all', 'department', 'specific')),
  target_departments TEXT[], -- Array of department names
  target_employees UUID[], -- Array of employee IDs
  send_via_whatsapp BOOLEAN DEFAULT false,
  created_by UUID NOT NULL REFERENCES public.user_profiles(user_id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create poll responses table
CREATE TABLE IF NOT EXISTS public.poll_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  response_data JSONB NOT NULL, -- Flexible response storage
  response_text TEXT, -- For open text responses
  response_rating INTEGER, -- For rating responses
  response_choice TEXT, -- For multiple choice responses
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(poll_id, employee_id) -- Prevent duplicate responses
);

-- Create announcements table
CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  announcement_type TEXT DEFAULT 'general' CHECK (announcement_type IN ('general', 'urgent', 'celebration', 'policy', 'event')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  target_type TEXT DEFAULT 'all' CHECK (target_type IN ('all', 'department', 'specific')),
  target_departments TEXT[], -- Array of department names
  target_employees UUID[], -- Array of employee IDs
  send_via_whatsapp BOOLEAN DEFAULT false,
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_by UUID NOT NULL REFERENCES public.user_profiles(user_id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create announcement reads table (track who has read announcements)
CREATE TABLE IF NOT EXISTS public.announcement_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id UUID NOT NULL REFERENCES public.announcements(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  read_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(announcement_id, employee_id) -- Prevent duplicate reads
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_polls_organization_id ON public.polls(organization_id);
CREATE INDEX IF NOT EXISTS idx_polls_is_active ON public.polls(is_active);
CREATE INDEX IF NOT EXISTS idx_polls_expires_at ON public.polls(expires_at);
CREATE INDEX IF NOT EXISTS idx_polls_created_by ON public.polls(created_by);

CREATE INDEX IF NOT EXISTS idx_poll_responses_poll_id ON public.poll_responses(poll_id);
CREATE INDEX IF NOT EXISTS idx_poll_responses_employee_id ON public.poll_responses(employee_id);
CREATE INDEX IF NOT EXISTS idx_poll_responses_submitted_at ON public.poll_responses(submitted_at);

CREATE INDEX IF NOT EXISTS idx_announcements_organization_id ON public.announcements(organization_id);
CREATE INDEX IF NOT EXISTS idx_announcements_is_published ON public.announcements(is_published);
CREATE INDEX IF NOT EXISTS idx_announcements_priority ON public.announcements(priority);
CREATE INDEX IF NOT EXISTS idx_announcements_created_by ON public.announcements(created_by);

CREATE INDEX IF NOT EXISTS idx_announcement_reads_announcement_id ON public.announcement_reads(announcement_id);
CREATE INDEX IF NOT EXISTS idx_announcement_reads_employee_id ON public.announcement_reads(employee_id);

-- Enable RLS (Row Level Security)
ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcement_reads ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for polls
DROP POLICY IF EXISTS "HR managers can manage organization polls" ON public.polls;
CREATE POLICY "HR managers can manage organization polls" ON public.polls
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_id = (SELECT auth.uid()) 
      AND role = 'hr_manager' 
      AND organization_id = polls.organization_id
    )
  );

DROP POLICY IF EXISTS "Super admins can manage all polls" ON public.polls;
CREATE POLICY "Super admins can manage all polls" ON public.polls
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_id = (SELECT auth.uid()) AND role = 'super_admin'
    )
  );

-- Create RLS policies for poll responses
DROP POLICY IF EXISTS "Employees can create responses for their organization" ON public.poll_responses;
CREATE POLICY "Employees can create responses for their organization" ON public.poll_responses
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.employees e
      JOIN public.polls p ON p.id = poll_responses.poll_id
      WHERE e.id = poll_responses.employee_id 
      AND e.organization_id = p.organization_id
    )
  );

DROP POLICY IF EXISTS "HR managers can view organization poll responses" ON public.poll_responses;
CREATE POLICY "HR managers can view organization poll responses" ON public.poll_responses
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      JOIN public.polls p ON p.id = poll_responses.poll_id
      WHERE up.user_id = (SELECT auth.uid()) 
      AND up.role = 'hr_manager' 
      AND up.organization_id = p.organization_id
    )
  );

-- Create RLS policies for announcements (similar to polls)
DROP POLICY IF EXISTS "HR managers can manage organization announcements" ON public.announcements;
CREATE POLICY "HR managers can manage organization announcements" ON public.announcements
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_id = (SELECT auth.uid()) 
      AND role = 'hr_manager' 
      AND organization_id = announcements.organization_id
    )
  );

-- Create RLS policies for announcement reads
DROP POLICY IF EXISTS "Employees can mark announcements as read" ON public.announcement_reads;
CREATE POLICY "Employees can mark announcements as read" ON public.announcement_reads
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.employees e
      JOIN public.announcements a ON a.id = announcement_reads.announcement_id
      WHERE e.id = announcement_reads.employee_id 
      AND e.organization_id = a.organization_id
    )
  );

-- Grant permissions
GRANT ALL ON public.polls TO anon, authenticated;
GRANT ALL ON public.poll_responses TO anon, authenticated;
GRANT ALL ON public.announcements TO anon, authenticated;
GRANT ALL ON public.announcement_reads TO anon, authenticated;

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create updated_at triggers
DROP TRIGGER IF EXISTS update_polls_updated_at ON public.polls;
CREATE TRIGGER update_polls_updated_at
    BEFORE UPDATE ON public.polls
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_announcements_updated_at ON public.announcements;
CREATE TRIGGER update_announcements_updated_at
    BEFORE UPDATE ON public.announcements
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
