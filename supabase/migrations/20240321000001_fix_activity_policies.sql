-- Drop existing policies for activity_participants
DROP POLICY IF EXISTS "Participants can view activity participants" ON activity_participants;
DROP POLICY IF EXISTS "Activity participants are viewable by activity creator and participants" ON activity_participants;

-- Create new simplified policies for activity_participants
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

-- Add foreign key relationship if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_activity_participants_profiles'
    ) THEN
        ALTER TABLE activity_participants
        ADD CONSTRAINT fk_activity_participants_profiles
        FOREIGN KEY (user_id)
        REFERENCES profiles(id)
        ON DELETE CASCADE;
    END IF;
END $$; 