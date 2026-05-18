-- Create activity_comments table
CREATE TABLE activity_comments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add foreign key relationship between activity_comments and profiles
ALTER TABLE activity_comments
ADD CONSTRAINT fk_activity_comments_profiles
FOREIGN KEY (user_id)
REFERENCES profiles(id)
ON DELETE CASCADE;

-- Enable Row Level Security
ALTER TABLE activity_comments ENABLE ROW LEVEL SECURITY;

-- Create policies for activity_comments
CREATE POLICY "View activity comments for public activities"
    ON activity_comments FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM activities
            WHERE activities.id = activity_comments.activity_id
            AND activities.privacy = 'public'
        )
    );

CREATE POLICY "View activity comments for connection activities"
    ON activity_comments FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM activities
            WHERE activities.id = activity_comments.activity_id
            AND activities.privacy = 'connections'
            AND EXISTS (
                SELECT 1 FROM connections
                WHERE (sender_id = auth.uid() OR receiver_id = auth.uid())
                AND status = 'accepted'
                AND (sender_id = activities.creator_id OR receiver_id = activities.creator_id)
            )
        )
    );

CREATE POLICY "View activity comments for private activities"
    ON activity_comments FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM activities
            WHERE activities.id = activity_comments.activity_id
            AND activities.privacy = 'private'
            AND (activities.creator_id = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM activity_participants
                    WHERE activity_id = activities.id
                    AND user_id = auth.uid()
                ))
        )
    );

CREATE POLICY "Users can create comments on activities they can view"
    ON activity_comments FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM activities
            WHERE activities.id = activity_comments.activity_id
            AND (
                activities.privacy = 'public' OR
                (activities.privacy = 'connections' AND
                    EXISTS (
                        SELECT 1 FROM connections
                        WHERE (sender_id = auth.uid() OR receiver_id = auth.uid())
                        AND status = 'accepted'
                        AND (sender_id = activities.creator_id OR receiver_id = activities.creator_id)
                    )
                ) OR
                (activities.privacy = 'private' AND
                    (activities.creator_id = auth.uid() OR
                        EXISTS (
                            SELECT 1 FROM activity_participants
                            WHERE activity_id = activities.id
                            AND user_id = auth.uid()
                        ))
                )
            )
        )
        AND auth.uid() = user_id
    );

CREATE POLICY "Users can update their own comments"
    ON activity_comments FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
    ON activity_comments FOR DELETE
    USING (auth.uid() = user_id);

-- Create trigger for activity_comments table
CREATE TRIGGER update_activity_comments_updated_at
    BEFORE UPDATE ON activity_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable real-time for activity_comments
ALTER PUBLICATION supabase_realtime ADD TABLE activity_comments; 