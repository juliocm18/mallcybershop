-- Fix for infinite recursion when fetching groups

-- First, let's create a policy for rooms that allows users to view all rooms
-- This is needed since we're showing all groups in the GroupsScreen

-- Check if RLS is enabled on rooms table, if not, enable it
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies that might be causing recursion
DROP POLICY IF EXISTS "Users can view rooms they are in" ON rooms;
DROP POLICY IF EXISTS "Users can view public rooms" ON rooms;

-- Create a policy for viewing public rooms
CREATE POLICY "Users can view public rooms"
ON rooms FOR SELECT
USING (is_private = false);

-- Create a policy for viewing rooms the user is a participant in
CREATE POLICY "Users can view rooms they are in"
ON rooms FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM room_participants
    WHERE room_participants.room_id = rooms.id
    AND room_participants.user_id = auth.uid()
  )
);

-- Create a policy for creating rooms
DROP POLICY IF EXISTS "Authenticated users can create rooms" ON rooms;
CREATE POLICY "Authenticated users can create rooms"
ON rooms FOR INSERT
WITH CHECK (auth.uid() = created_by);

-- Create a policy for updating rooms
DROP POLICY IF EXISTS "Room creators and admins can update rooms" ON rooms;
CREATE POLICY "Room creators and admins can update rooms"
ON rooms FOR UPDATE
USING (
  auth.uid() = created_by OR
  EXISTS (
    SELECT 1 FROM room_participants
    WHERE room_participants.room_id = rooms.id
    AND room_participants.user_id = auth.uid()
    AND (room_participants.role = 'super_admin' OR room_participants.role = 'admin')
  )
)
WITH CHECK (
  auth.uid() = created_by OR
  EXISTS (
    SELECT 1 FROM room_participants
    WHERE room_participants.room_id = rooms.id
    AND room_participants.user_id = auth.uid()
    AND (room_participants.role = 'super_admin' OR room_participants.role = 'admin')
  )
);

-- Create a policy for deleting rooms
DROP POLICY IF EXISTS "Room creators and super admins can delete rooms" ON rooms;
CREATE POLICY "Room creators and super admins can delete rooms"
ON rooms FOR DELETE
USING (
  auth.uid() = created_by OR
  EXISTS (
    SELECT 1 FROM room_participants
    WHERE room_participants.room_id = rooms.id
    AND room_participants.user_id = auth.uid()
    AND room_participants.role = 'super_admin'
  )
);
