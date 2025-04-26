-- Add columns for private chat support
ALTER TABLE rooms
ALTER COLUMN name DROP NOT NULL,
ADD COLUMN IF NOT EXISTS type text DEFAULT 'group',
ADD COLUMN IF NOT EXISTS created_by uuid,
ADD COLUMN IF NOT EXISTS recipient_id uuid,
ADD COLUMN IF NOT EXISTS is_private boolean DEFAULT false;

-- Add foreign key constraints for profiles
ALTER TABLE rooms
DROP CONSTRAINT IF EXISTS rooms_created_by_fkey,
DROP CONSTRAINT IF EXISTS rooms_recipient_id_fkey,
ADD CONSTRAINT rooms_created_by_fkey FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE CASCADE,
ADD CONSTRAINT rooms_recipient_id_fkey FOREIGN KEY (recipient_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Update messages table for private chat support
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS recipient_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS is_private boolean DEFAULT false;

-- Add foreign key for user profiles in messages
ALTER TABLE messages
DROP CONSTRAINT IF EXISTS messages_user_id_fkey,
ADD CONSTRAINT messages_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_rooms_type ON rooms(type);
CREATE INDEX IF NOT EXISTS idx_rooms_created_by ON rooms(created_by);
CREATE INDEX IF NOT EXISTS idx_rooms_recipient_id ON rooms(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_room_id ON messages(room_id);
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient_id ON messages(recipient_id);

-- Add RLS policies for private chats
-- ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

-- DROP POLICY IF EXISTS "Users can view their own private chats" ON rooms;
-- CREATE POLICY "Users can view their own private chats"
-- ON rooms FOR SELECT
-- USING (
--   auth.uid() IN (
--     SELECT id FROM profiles WHERE id = created_by OR id = recipient_id
--   ) OR 
--   (type = 'group' AND is_private = false)
-- );

-- DROP POLICY IF EXISTS "Users can create private chats" ON rooms;
-- CREATE POLICY "Users can create private chats"
-- ON rooms FOR INSERT
-- WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE id = created_by));

-- DROP POLICY IF EXISTS "Users can update their own private chats" ON rooms;
-- CREATE POLICY "Users can update their own private chats"
-- ON rooms FOR UPDATE
-- USING (auth.uid() IN (SELECT id FROM profiles WHERE id = created_by))
-- WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE id = created_by));

-- Add RLS policies for messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view messages in their rooms" ON messages;
CREATE POLICY "Users can view messages in their rooms"
ON messages FOR SELECT
USING (
  room_id IN (
    SELECT id FROM rooms
    WHERE created_by IN (SELECT id FROM profiles WHERE auth.uid() = id)
    OR recipient_id IN (SELECT id FROM profiles WHERE auth.uid() = id)
    OR (type = 'group' AND is_private = false)
  )
);

DROP POLICY IF EXISTS "Users can insert messages" ON messages;
CREATE POLICY "Users can insert messages"
ON messages FOR INSERT
WITH CHECK (
  auth.uid() IN (SELECT id FROM profiles WHERE id = user_id) AND
  room_id IN (
    SELECT id FROM rooms
    WHERE created_by IN (SELECT id FROM profiles WHERE auth.uid() = id)
    OR recipient_id IN (SELECT id FROM profiles WHERE auth.uid() = id)
    OR (type = 'group' AND is_private = false)
  )
);

-- Add trigger to automatically add participants when a private chat is created
CREATE OR REPLACE FUNCTION add_private_chat_participants()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.type = 'individual' THEN
    -- Set a default name for private chats if not provided
    IF NEW.name IS NULL THEN
      NEW.name := 'Private Chat';
    END IF;
    
    INSERT INTO room_participants (room_id, user_id)
    VALUES 
      (NEW.id, NEW.created_by),
      (NEW.id, NEW.recipient_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS after_room_created ON rooms;
CREATE TRIGGER after_room_created
  BEFORE INSERT ON rooms
  FOR EACH ROW
  EXECUTE FUNCTION add_private_chat_participants();
