-- Add columns for private chat support
ALTER TABLE rooms
ALTER COLUMN name DROP NOT NULL,
ADD COLUMN IF NOT EXISTS type text DEFAULT 'group',
ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS recipient_id uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS is_private boolean DEFAULT false;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_rooms_type ON rooms(type);
CREATE INDEX IF NOT EXISTS idx_rooms_created_by ON rooms(created_by);
CREATE INDEX IF NOT EXISTS idx_rooms_recipient_id ON rooms(recipient_id);

-- Add RLS policies for private chats
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own private chats"
ON rooms FOR SELECT
USING (
  auth.uid() = created_by OR 
  auth.uid() = recipient_id OR 
  (type = 'group' AND is_private = false)
);

CREATE POLICY "Users can create private chats"
ON rooms FOR INSERT
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own private chats"
ON rooms FOR UPDATE
USING (auth.uid() = created_by)
WITH CHECK (auth.uid() = created_by);

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

CREATE TRIGGER after_room_created
  BEFORE INSERT ON rooms
  FOR EACH ROW
  EXECUTE FUNCTION add_private_chat_participants();
