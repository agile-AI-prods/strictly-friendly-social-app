-- Create activities table
CREATE TABLE activities (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    type TEXT NOT NULL,
    date DATE NOT NULL,
    time TIME NOT NULL,
    location TEXT NOT NULL,
    description TEXT,
    creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    max_participants INTEGER NOT NULL DEFAULT 1,
    privacy TEXT NOT NULL CHECK (privacy IN ('public', 'connections', 'private')),
    status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'ongoing', 'completed', 'cancelled')),
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create activity_participants table
CREATE TABLE activity_participants (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'invited' CHECK (status IN ('invited', 'accepted', 'declined')),
    joined_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(activity_id, user_id)
);

-- Add foreign key relationship between activity_participants and profiles
ALTER TABLE activity_participants
ADD CONSTRAINT fk_activity_participants_profiles
FOREIGN KEY (user_id)
REFERENCES profiles(id)
ON DELETE CASCADE;

-- Enable Row Level Security
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_participants ENABLE ROW LEVEL SECURITY;

-- Create policies for activities
CREATE POLICY "Public activities are viewable by everyone"
    ON activities FOR SELECT
    USING (privacy = 'public');

CREATE POLICY "Connection activities are viewable by connected users"
    ON activities FOR SELECT
    USING (
        privacy = 'connections' AND
        EXISTS (
            SELECT 1 FROM connections
            WHERE (sender_id = auth.uid() OR receiver_id = auth.uid())
            AND status = 'accepted'
            AND (sender_id = creator_id OR receiver_id = creator_id)
        )
    );

CREATE POLICY "Private activities are viewable by creator and participants"
    ON activities FOR SELECT
    USING (
        privacy = 'private' AND
        (creator_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM activity_participants
            WHERE activity_id = activities.id
            AND user_id = auth.uid()
        ))
    );

CREATE POLICY "Users can create activities"
    ON activities FOR INSERT
    WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Users can update their own activities"
    ON activities FOR UPDATE
    USING (auth.uid() = creator_id);

CREATE POLICY "Users can delete their own activities"
    ON activities FOR DELETE
    USING (auth.uid() = creator_id);

-- Create policies for activity_participants
CREATE POLICY "View activity participants"
    ON activity_participants FOR SELECT
    USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM activities
            WHERE activities.id = activity_participants.activity_id
            AND (
                activities.creator_id = auth.uid() OR
                activities.privacy = 'public'
            )
        )
    );

CREATE POLICY "Activity creators can invite participants"
    ON activity_participants FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM activities
            WHERE activities.id = activity_participants.activity_id
            AND activities.creator_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own participant status"
    ON activity_participants FOR UPDATE
    USING (user_id = auth.uid());

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for activities table
CREATE TRIGGER update_activities_updated_at
    BEFORE UPDATE ON activities
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable real-time for activities and participants
ALTER PUBLICATION supabase_realtime ADD TABLE activities;
ALTER PUBLICATION supabase_realtime ADD TABLE activity_participants; 