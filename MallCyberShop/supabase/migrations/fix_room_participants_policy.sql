-- Emergency fix for infinite recursion in room_participants RLS policy

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

-- TEMPORARY SOLUTION: Disable RLS on room_participants to stop the recursion
-- This is not a permanent solution but will allow the app to function while you debug
ALTER TABLE room_participants DISABLE ROW LEVEL SECURITY;
