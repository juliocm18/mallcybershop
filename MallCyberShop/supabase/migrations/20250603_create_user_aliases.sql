-- Create user aliases table
CREATE TABLE IF NOT EXISTS public.user_aliases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  alias TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, target_user_id)
);

-- Add RLS policies
ALTER TABLE public.user_aliases ENABLE ROW LEVEL SECURITY;

-- Allow users to see only their own aliases
CREATE POLICY "Users can view their own aliases" 
  ON public.user_aliases FOR SELECT 
  USING (auth.uid() = user_id);

-- Allow authenticated users to add their own aliases
CREATE POLICY "Users can add their own aliases" 
  ON public.user_aliases FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own aliases
CREATE POLICY "Users can update their own aliases" 
  ON public.user_aliases FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own aliases
CREATE POLICY "Users can delete their own aliases" 
  ON public.user_aliases FOR DELETE 
  TO authenticated 
  USING (auth.uid() = user_id);

-- Create indexes for faster queries
CREATE INDEX user_aliases_user_id_idx ON public.user_aliases(user_id);
CREATE INDEX user_aliases_target_user_id_idx ON public.user_aliases(target_user_id);

-- Create function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_aliases_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update the updated_at timestamp
CREATE TRIGGER update_user_aliases_updated_at
BEFORE UPDATE ON public.user_aliases
FOR EACH ROW
EXECUTE FUNCTION update_user_aliases_updated_at();
