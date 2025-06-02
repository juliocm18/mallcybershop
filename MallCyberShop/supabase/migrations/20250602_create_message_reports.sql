-- Create the message_reports table for tracking reported messages
CREATE TABLE IF NOT EXISTS public.message_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolution_notes TEXT
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS message_reports_message_id_idx ON public.message_reports(message_id);
CREATE INDEX IF NOT EXISTS message_reports_reporter_id_idx ON public.message_reports(reporter_id);
CREATE INDEX IF NOT EXISTS message_reports_status_idx ON public.message_reports(status);

-- Enable Row Level Security
ALTER TABLE public.message_reports ENABLE ROW LEVEL SECURITY;

-- Create policies for message_reports table

-- Policy for inserting reports (any authenticated user can report a message)
CREATE POLICY "Users can report messages" 
  ON public.message_reports 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

-- Policy for viewing reports (users can only see their own reports)
CREATE POLICY "Users can view their own reports" 
  ON public.message_reports 
  FOR SELECT 
  TO authenticated 
  USING (reporter_id = auth.uid());

-- Policy for admins to view all reports
CREATE POLICY "Admins can view all reports" 
  ON public.message_reports 
  FOR SELECT 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.room_participants 
      WHERE user_id = auth.uid() 
      AND role IN ('super_admin', 'admin')
    )
  );

-- Policy for admins to update reports (e.g., to resolve them)
CREATE POLICY "Admins can update reports" 
  ON public.message_reports 
  FOR UPDATE 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.room_participants 
      WHERE user_id = auth.uid() 
      AND role IN ('super_admin', 'admin')
    )
  );
