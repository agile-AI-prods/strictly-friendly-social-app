-- Create friends table
CREATE TABLE IF NOT EXISTS friends (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    friend_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, friend_id)
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_friends_user_id ON friends(user_id);
CREATE INDEX IF NOT EXISTS idx_friends_friend_id ON friends(friend_id);
CREATE INDEX IF NOT EXISTS idx_friends_user_friend ON friends(user_id, friend_id);

-- Add RLS (Row Level Security) policies
ALTER TABLE friends ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to see their own friends
CREATE POLICY "Users can view their own friends" ON friends
    FOR SELECT USING (auth.uid() = user_id);

-- Policy to allow users to add friends
CREATE POLICY "Users can add friends" ON friends
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy to allow users to remove their own friends
CREATE POLICY "Users can remove their own friends" ON friends
    FOR DELETE USING (auth.uid() = user_id); 