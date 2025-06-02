-- Add new columns to rooms table for group functionality
ALTER TABLE rooms
ADD COLUMN IF NOT EXISTS description text,
ADD COLUMN IF NOT EXISTS image_url text,
ADD COLUMN IF NOT EXISTS max_participants integer DEFAULT 500;

-- Create table for group invitations
CREATE TABLE IF NOT EXISTS group_invitations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id uuid REFERENCES rooms(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  invited_by uuid REFERENCES profiles(id) ON DELETE CASCADE,
  status text DEFAULT 'pending',
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(room_id, user_id)
);

-- Add role column to room_participants table
ALTER TABLE room_participants
ADD COLUMN IF NOT EXISTS role text DEFAULT 'member',
ADD COLUMN IF NOT EXISTS joined_at timestamp with time zone DEFAULT now();

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_group_invitations_user_id ON group_invitations(user_id);
CREATE INDEX IF NOT EXISTS idx_group_invitations_room_id ON group_invitations(room_id);
CREATE INDEX IF NOT EXISTS idx_group_invitations_status ON group_invitations(status);
CREATE INDEX IF NOT EXISTS idx_room_participants_role ON room_participants(role);

-- Add RLS policies for group invitations
ALTER TABLE group_invitations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own invitations" ON group_invitations;
CREATE POLICY "Users can view their own invitations"
ON group_invitations FOR SELECT
USING (auth.uid() = user_id OR auth.uid() = invited_by);

DROP POLICY IF EXISTS "Super admins and admins can create invitations" ON group_invitations;
CREATE POLICY "Super admins and admins can create invitations"
ON group_invitations FOR INSERT
WITH CHECK (
  auth.uid() = invited_by AND
  EXISTS (
    SELECT 1 FROM room_participants
    WHERE room_participants.room_id = group_invitations.room_id
    AND room_participants.user_id = auth.uid()
    AND (room_participants.role = 'super_admin' OR room_participants.role = 'admin')
  )
);

DROP POLICY IF EXISTS "Users can update their own invitations" ON group_invitations;
CREATE POLICY "Users can update their own invitations"
ON group_invitations FOR UPDATE
USING (auth.uid() = user_id OR auth.uid() = invited_by)
WITH CHECK (auth.uid() = user_id OR auth.uid() = invited_by);

-- Add RLS policies for room_participants
ALTER TABLE room_participants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view room participants" ON room_participants;
CREATE POLICY "Users can view room participants"
ON room_participants FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM room_participants as rp
    WHERE rp.room_id = room_participants.room_id
    AND rp.user_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM rooms
    WHERE rooms.id = room_participants.room_id
    AND rooms.is_private = false
  )
);

DROP POLICY IF EXISTS "Users can join open groups" ON room_participants;
CREATE POLICY "Users can join open groups"
ON room_participants FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM rooms
    WHERE rooms.id = room_participants.room_id
    AND rooms.is_private = false
  )
);

DROP POLICY IF EXISTS "Super admins can add users to groups" ON room_participants;
CREATE POLICY "Super admins can add users to groups"
ON room_participants FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM room_participants as rp
    WHERE rp.room_id = room_participants.room_id
    AND rp.user_id = auth.uid()
    AND (rp.role = 'super_admin' OR rp.role = 'admin')
  )
);

DROP POLICY IF EXISTS "Super admins can update user roles" ON room_participants;
CREATE POLICY "Super admins can update user roles"
ON room_participants FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM room_participants as rp
    WHERE rp.room_id = room_participants.room_id
    AND rp.user_id = auth.uid()
    AND rp.role = 'super_admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM room_participants as rp
    WHERE rp.room_id = room_participants.room_id
    AND rp.user_id = auth.uid()
    AND rp.role = 'super_admin'
  )
);

DROP POLICY IF EXISTS "Users can leave groups" ON room_participants;
CREATE POLICY "Users can leave groups"
ON room_participants FOR DELETE
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can remove members" ON room_participants;
CREATE POLICY "Admins can remove members"
ON room_participants FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM room_participants as rp
    WHERE rp.room_id = room_participants.room_id
    AND rp.user_id = auth.uid()
    AND (rp.role = 'super_admin' OR rp.role = 'admin')
  ) AND
  NOT EXISTS (
    SELECT 1 FROM room_participants as target
    WHERE target.room_id = room_participants.room_id
    AND target.user_id = room_participants.user_id
    AND (target.role = 'super_admin' OR (target.role = 'admin' AND EXISTS (
      SELECT 1 FROM room_participants as current
      WHERE current.room_id = room_participants.room_id
      AND current.user_id = auth.uid()
      AND current.role = 'admin'
    )))
  )
);

-- Create function to check max participants before joining
CREATE OR REPLACE FUNCTION check_max_participants()
RETURNS TRIGGER AS $$
DECLARE
  current_count INTEGER;
  max_count INTEGER;
BEGIN
  -- Get current participant count
  SELECT COUNT(*) INTO current_count
  FROM room_participants
  WHERE room_id = NEW.room_id;
  
  -- Get max participants allowed
  SELECT max_participants INTO max_count
  FROM rooms
  WHERE id = NEW.room_id;
  
  -- Check if adding a new participant would exceed the limit
  IF current_count >= max_count THEN
    RAISE EXCEPTION 'Maximum number of participants (%) reached for this group', max_count;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to enforce max participants
DROP TRIGGER IF EXISTS check_max_participants_trigger ON room_participants;
CREATE TRIGGER check_max_participants_trigger
  BEFORE INSERT ON room_participants
  FOR EACH ROW
  EXECUTE FUNCTION check_max_participants();

-- Create function to handle invitation acceptance
CREATE OR REPLACE FUNCTION handle_invitation_acceptance()
RETURNS TRIGGER AS $$
BEGIN
  -- If invitation is accepted, add user to room participants
  IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    INSERT INTO room_participants (room_id, user_id, role, joined_at)
    VALUES (NEW.room_id, NEW.user_id, 'member', NOW());
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for invitation acceptance
DROP TRIGGER IF EXISTS invitation_acceptance_trigger ON group_invitations;
CREATE TRIGGER invitation_acceptance_trigger
  AFTER UPDATE ON group_invitations
  FOR EACH ROW
  WHEN (NEW.status = 'accepted' AND OLD.status = 'pending')
  EXECUTE FUNCTION handle_invitation_acceptance();
