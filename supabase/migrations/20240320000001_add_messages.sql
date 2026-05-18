-- Create messages table
CREATE TABLE messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    receiver_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    emotion TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    read_at TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'sent',
    CONSTRAINT valid_emotion CHECK (emotion IN ('happy', 'excited', 'curious', 'thoughtful', 'sympathetic')),
    CONSTRAINT valid_status CHECK (status IN ('sent', 'delivered', 'read'))
);

-- Create indexes for better query performance
CREATE INDEX messages_sender_id_idx ON messages(sender_id);
CREATE INDEX messages_receiver_id_idx ON messages(receiver_id);
CREATE INDEX messages_created_at_idx ON messages(created_at);
CREATE INDEX messages_read_at_idx ON messages(read_at);

-- Enable Row Level Security
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Policy for viewing messages (users can only see messages they're part of)
CREATE POLICY "Users can view their own messages"
    ON messages FOR SELECT
    USING (
        auth.uid() = sender_id OR 
        auth.uid() = receiver_id
    );

-- Policy for creating messages
CREATE POLICY "Users can create messages"
    ON messages FOR INSERT
    WITH CHECK (
        auth.uid() = sender_id
    );

-- Policy for updating messages (only receiver can mark as read)
CREATE POLICY "Receivers can update their messages"
    ON messages FOR UPDATE
    USING (
        auth.uid() = receiver_id
    )
    WITH CHECK (
        auth.uid() = receiver_id
    );

-- Policy for deleting messages
CREATE POLICY "Users can delete their own messages"
    ON messages FOR DELETE
    USING (
        auth.uid() = sender_id OR 
        auth.uid() = receiver_id
    );

-- Create broadcast function for real-time messages
CREATE OR REPLACE FUNCTION public.broadcast_messages()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $func$
BEGIN
  -- Send realtime broadcast to both sender and receiver
  PERFORM realtime.broadcast_changes(
    'messages:' || NEW.sender_id,  -- topic for sender
    'message',                     -- event
    'INSERT',                      -- operation
    'messages',                    -- table
    'public',                      -- schema
    NEW,                           -- new record
    NULL                           -- old record
  );

  PERFORM realtime.broadcast_changes(
    'messages:' || NEW.receiver_id,  -- topic for receiver
    'message',                       -- event
    'INSERT',                        -- operation
    'messages',                      -- table
    'public',                        -- schema
    NEW,                             -- new record
    NULL                             -- old record
  );

  RETURN NEW;
END;
$func$;

-- Create trigger for broadcasting messages
CREATE TRIGGER broadcast_messages_trigger
AFTER INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.broadcast_messages();

-- Enable real-time for the messages table
ALTER PUBLICATION supabase_realtime ADD TABLE messages; 