-- Create a stored procedure to safely fetch all groups without triggering infinite recursion

-- Drop the function if it already exists
DROP FUNCTION IF EXISTS public.get_all_groups();

-- Create the function
CREATE OR REPLACE FUNCTION public.get_all_groups()
RETURNS TABLE (
  id uuid,
  name text,
  description text,
  image_url text,
  created_at timestamptz,
  created_by uuid,
  is_private boolean,
  type text,
  member_count bigint
) 
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    r.name,
    r.description,
    r.image_url,
    r.created_at,
    r.created_by,
    r.is_private,
    r.type,
    COUNT(rp.id)::bigint as member_count
  FROM 
    rooms r
  LEFT JOIN 
    room_participants rp ON r.id = rp.room_id
  WHERE 
    r.type = 'group' AND
    (r.is_private = false OR EXISTS (
      SELECT 1 FROM room_participants
      WHERE room_id = r.id AND user_id = auth.uid()
    ))
  GROUP BY
    r.id
  ORDER BY
    r.created_at DESC;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_all_groups() TO authenticated;

-- Grant execute permission to anon users
GRANT EXECUTE ON FUNCTION public.get_all_groups() TO anon;
