-- Fix the message_reactions table to properly reference profiles instead of auth.users

-- First, drop the existing foreign key constraint
ALTER TABLE public.message_reactions
DROP CONSTRAINT IF EXISTS message_reactions_user_id_fkey;

-- Then add the correct foreign key constraint to profiles
ALTER TABLE public.message_reactions
ADD CONSTRAINT message_reactions_user_id_fkey
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Create a join table view to make it easier to query reactions with user info
CREATE OR REPLACE VIEW public.message_reactions_with_users AS
SELECT 
  mr.id,
  mr.message_id,
  mr.user_id,
  mr.emoji,
  mr.created_at,
  p.name as user_name,
  p.avatar_url
FROM 
  public.message_reactions mr
JOIN 
  public.profiles p ON mr.user_id = p.id;

-- Grant access to the view
GRANT SELECT ON public.message_reactions_with_users TO authenticated;
GRANT SELECT ON public.message_reactions_with_users TO anon;
