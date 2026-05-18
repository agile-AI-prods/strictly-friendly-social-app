-- Add status column to messages table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'messages' 
        AND column_name = 'status'
    ) THEN
        ALTER TABLE messages
        ADD COLUMN status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read'));
    END IF;
END $$;

-- Create index for status column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_indexes 
        WHERE tablename = 'messages' 
        AND indexname = 'messages_status_idx'
    ) THEN
        CREATE INDEX messages_status_idx ON messages(status);
    END IF;
END $$;

-- Update existing messages to have appropriate status
UPDATE messages 
SET status = CASE 
    WHEN read_at IS NOT NULL THEN 'read'
    ELSE 'sent'
END
WHERE status IS NULL; 