-- Create enum for connection status
CREATE TYPE connection_status AS ENUM ('pending', 'accepted', 'rejected');

-- Create connections table
CREATE TABLE connections (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    receiver_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    status connection_status DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    UNIQUE(sender_id, receiver_id)
);

-- Create index for faster queries
CREATE INDEX connections_sender_id_idx ON connections(sender_id);
CREATE INDEX connections_receiver_id_idx ON connections(receiver_id);
CREATE INDEX connections_status_idx ON connections(status);

-- Add RLS policies
ALTER TABLE connections ENABLE ROW LEVEL SECURITY;

-- Policy for viewing connections (users can only see their own connections)
CREATE POLICY "Users can view their own connections"
    ON connections FOR SELECT
    USING (
        auth.uid() = sender_id OR 
        auth.uid() = receiver_id
    );

-- Policy for creating connections
CREATE POLICY "Users can create connections"
    ON connections FOR INSERT
    WITH CHECK (
        auth.uid() = sender_id
    );

-- Policy for updating connections (only receiver can update status)
CREATE POLICY "Receivers can update connection status"
    ON connections FOR UPDATE
    USING (
        auth.uid() = receiver_id
    )
    WITH CHECK (
        auth.uid() = receiver_id
    );

-- Policy for deleting connections
CREATE POLICY "Users can delete their own connections"
    ON connections FOR DELETE
    USING (
        auth.uid() = sender_id OR 
        auth.uid() = receiver_id
    );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_connections_updated_at
    BEFORE UPDATE ON connections
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 