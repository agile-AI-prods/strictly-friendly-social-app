-- First, disable RLS temporarily to clean up policies
ALTER TABLE activity_participants DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies for activity_participants
DROP POLICY IF EXISTS "Participants can view activity participants" ON activity_participants;
DROP POLICY IF EXISTS "Activity participants are viewable by activity creator and participants" ON activity_participants;
DROP POLICY IF EXISTS "View activity participants" ON activity_participants;
DROP POLICY IF EXISTS "Activity creators can invite participants" ON activity_participants;
DROP POLICY IF EXISTS "Users can update their own participant status" ON activity_participants;

-- Re-enable RLS
ALTER TABLE activity_participants ENABLE ROW LEVEL SECURITY;

-- Create new, simpler policies
CREATE POLICY "activity_participants_select_policy"
    ON activity_participants FOR SELECT
    USING (true);  -- Allow all SELECT operations initially

CREATE POLICY "activity_participants_insert_policy"
    ON activity_participants FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM activities
            WHERE activities.id = activity_participants.activity_id
            AND (
                activities.creator_id = auth.uid() OR
                user_id = auth.uid()
            )
        )
    );

CREATE POLICY "activity_participants_update_policy"
    ON activity_participants FOR UPDATE
    USING (user_id = auth.uid());

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