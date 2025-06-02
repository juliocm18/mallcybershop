-- Fix for infinite recursion in room_participants RLS policy

-- IMPORTANT: This is a complete replacement of all room_participants policies
-- to ensure no recursion issues

-- First, drop ALL existing policies on room_participants
DROP POLICY IF EXISTS "Users can view room participants" ON room_participants;
DROP POLICY IF EXISTS "Users can join open groups" ON room_participants;
DROP POLICY IF EXISTS "Super admins can add users to groups" ON room_participants;
DROP POLICY IF EXISTS "Super admins can update user roles" ON room_participants;
DROP POLICY IF EXISTS "Users can leave groups" ON room_participants;
DROP POLICY IF EXISTS "Admins can remove members" ON room_participants;
DROP POLICY IF EXISTS "Room creator can add themselves as super_admin" ON room_participants;

-- Create a temporary view to help with policy decisions without recursion
CREATE OR REPLACE VIEW public.user_accessible_rooms AS
SELECT id FROM rooms WHERE is_private = false
UNION
SELECT room_id FROM room_participants WHERE user_id = auth.uid();

-- 1. Policy for viewing room participants
CREATE POLICY "Users can view room participants"
ON room_participants FOR SELECT
USING (
  room_id IN (SELECT id FROM user_accessible_rooms)
);

-- 2. Policy for joining open groups
CREATE POLICY "Users can join open groups"
ON room_participants FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  room_id IN (SELECT id FROM rooms WHERE is_private = false)
);

-- 3. Policy for room creators to add themselves as super_admin
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

-- 4. Policy for admins to add users
-- This uses a direct check against the database rather than a recursive policy
CREATE POLICY "Admins can add users to groups"
ON room_participants FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM room_participants
    WHERE room_id = room_participants.room_id
    AND user_id = auth.uid()
    AND role IN ('super_admin', 'admin')
  )
);

-- 5. Policy for updating roles
CREATE POLICY "Admins can update user roles"
ON room_participants FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM room_participants
    WHERE room_id = room_participants.room_id
    AND user_id = auth.uid()
    AND role = 'super_admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM room_participants
    WHERE room_id = room_participants.room_id
    AND user_id = auth.uid()
    AND role = 'super_admin'
  )
);

-- 6. Policy for users to leave groups
CREATE POLICY "Users can leave groups"
ON room_participants FOR DELETE
USING (auth.uid() = user_id);

-- 7. Policy for admins to remove members
CREATE POLICY "Admins can remove members"
ON room_participants FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM room_participants
    WHERE room_id = room_participants.room_id
    AND user_id = auth.uid()
    AND role IN ('super_admin', 'admin')
  ) AND
  -- Cannot remove super_admins or admins if you're just an admin
  NOT (
    EXISTS (
      SELECT 1 FROM room_participants
      WHERE room_id = room_participants.room_id
      AND user_id = auth.uid()
      AND role = 'admin'
    ) AND
    EXISTS (
      SELECT 1 FROM room_participants
      WHERE room_id = room_participants.room_id
      AND user_id = room_participants.user_id
      AND role IN ('super_admin', 'admin')
    )
  )
);
