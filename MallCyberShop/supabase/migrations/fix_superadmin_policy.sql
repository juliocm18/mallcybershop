-- Fix for infinite recursion when adding creator as superadmin

-- First, drop the problematic policies
DROP POLICY IF EXISTS "Super admins can add users to groups" ON room_participants;
DROP POLICY IF EXISTS "Super admins can update user roles" ON room_participants;

-- Create a new policy for adding users that avoids recursion
CREATE POLICY "Super admins can add users to groups"
ON room_participants FOR INSERT
WITH CHECK (
  -- Allow the creator of a room to add the first superadmin (themselves)
  EXISTS (
    SELECT 1 FROM rooms
    WHERE rooms.id = room_participants.room_id
    AND rooms.created_by = auth.uid()
  )
  OR
  -- Or allow existing superadmins to add users
  EXISTS (
    SELECT 1 FROM room_participants rp
    WHERE rp.room_id = room_participants.room_id
    AND rp.user_id = auth.uid()
    AND rp.role = 'super_admin'
  )
);

-- Create a new policy for updating user roles
CREATE POLICY "Super admins can update user roles"
ON room_participants FOR UPDATE
USING (
  -- Allow only super_admins to update roles
  EXISTS (
    SELECT 1 FROM room_participants rp
    WHERE rp.room_id = room_participants.room_id
    AND rp.user_id = auth.uid()
    AND rp.role = 'super_admin'
  )
)
WITH CHECK (
  -- Same condition for the check clause
  EXISTS (
    SELECT 1 FROM room_participants rp
    WHERE rp.room_id = room_participants.room_id
    AND rp.user_id = auth.uid()
    AND rp.role = 'super_admin'
  )
);

-- Add a special policy to allow the room creator to add themselves as the first super_admin
CREATE POLICY "Room creator can add themselves as super_admin"
ON room_participants FOR INSERT
WITH CHECK (
  user_id = auth.uid() AND
  role = 'super_admin' AND
  EXISTS (
    SELECT 1 FROM rooms
    WHERE rooms.id = room_participants.room_id
    AND rooms.created_by = auth.uid()
  )
);
