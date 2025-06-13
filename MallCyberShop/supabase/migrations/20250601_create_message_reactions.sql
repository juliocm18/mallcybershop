-- Create message reactions table
CREATE TABLE IF NOT EXISTS public.message_reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(message_id, user_id, emoji)
);

-- Add RLS policies
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;

-- Allow users to see all reactions
CREATE POLICY "Reactions are viewable by everyone" 
  ON public.message_reactions FOR SELECT 
  USING (true);

-- Allow authenticated users to add reactions
CREATE POLICY "Users can add their own reactions" 
  ON public.message_reactions FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own reactions
CREATE POLICY "Users can delete their own reactions" 
  ON public.message_reactions FOR DELETE 
  TO authenticated 
  USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX message_reactions_message_id_idx ON public.message_reactions(message_id);
CREATE INDEX message_reactions_user_id_idx ON public.message_reactions(user_id);
