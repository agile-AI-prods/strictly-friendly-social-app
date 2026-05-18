-- Create typing_status table
CREATE TABLE typing_status (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    conversation_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    is_typing BOOLEAN DEFAULT false,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    UNIQUE(user_id, conversation_id)
);

-- Create indexes
CREATE INDEX typing_status_user_id_idx ON typing_status(user_id);
CREATE INDEX typing_status_conversation_id_idx ON typing_status(conversation_id);

-- Enable RLS
ALTER TABLE typing_status ENABLE ROW LEVEL SECURITY;

-- Policy for viewing typing status
CREATE POLICY "Users can view typing status of their conversations"
    ON typing_status FOR SELECT
    USING (
        auth.uid() = user_id OR 
        auth.uid() = conversation_id
    );

-- Policy for updating typing status
CREATE POLICY "Users can update their own typing status"
    ON typing_status FOR UPDATE
    USING (
        auth.uid() = user_id
    )
    WITH CHECK (
        auth.uid() = user_id
    );

-- Policy for inserting typing status
CREATE POLICY "Users can insert their typing status"
    ON typing_status FOR INSERT
    WITH CHECK (
        auth.uid() = user_id
    );

-- Enable real-time for typing status
ALTER PUBLICATION supabase_realtime ADD TABLE typing_status; 