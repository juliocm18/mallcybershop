-- Add message_type and related columns to messages table
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS message_type text DEFAULT 'text',
ADD COLUMN IF NOT EXISTS media_info jsonb,
ADD COLUMN IF NOT EXISTS location_info jsonb;

-- Create index for message_type for better query performance
CREATE INDEX IF NOT EXISTS idx_messages_message_type ON messages(message_type);

-- Update RLS policies to ensure proper access to message types
DROP POLICY IF EXISTS "Users can insert messages with media" ON messages;
CREATE POLICY "Users can insert messages with media"
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

-- Create function to validate message type
CREATE OR REPLACE FUNCTION validate_message_type()
RETURNS TRIGGER AS $$
BEGIN
  -- Validate message_type is one of the allowed types
  IF NEW.message_type NOT IN ('text', 'image', 'pdf', 'video', 'audio', 'location') THEN
    RAISE EXCEPTION 'Invalid message_type: %. Must be one of: text, image, pdf, video, audio, location', NEW.message_type;
  END IF;
  
  -- Validate that media_info is present for media types
  IF NEW.message_type IN ('image', 'pdf', 'video', 'audio') AND NEW.media_info IS NULL THEN
    RAISE EXCEPTION 'media_info is required for message_type: %', NEW.message_type;
  END IF;
  
  -- Validate that location_info is present for location type
  IF NEW.message_type = 'location' AND NEW.location_info IS NULL THEN
    RAISE EXCEPTION 'location_info is required for message_type: location';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to validate message type before insert/update
DROP TRIGGER IF EXISTS validate_message_type_trigger ON messages;
CREATE TRIGGER validate_message_type_trigger
  BEFORE INSERT OR UPDATE ON messages
  FOR EACH ROW
  EXECUTE FUNCTION validate_message_type();

-- Add comment to explain the structure of media_info and location_info
COMMENT ON COLUMN messages.media_info IS 'JSON structure containing media details like: 
{
  "url": "https://example.com/media.jpg",
  "filename": "media.jpg",
  "filesize": 1024000,
  "filetype": "image/jpeg",
  "width": 800,
  "height": 600,
  "duration": 120
}';

COMMENT ON COLUMN messages.location_info IS 'JSON structure containing location details like: 
{
  "latitude": 37.7749,
  "longitude": -122.4194,
  "name": "San Francisco",
  "address": "San Francisco, CA, USA"
}';
