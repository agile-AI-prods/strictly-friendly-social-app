-- Drop the existing update policy
DROP POLICY IF EXISTS "activity_participants_update_policy" ON activity_participants;

-- Create new update policy that allows both users to update their own status
-- and activity creators to update any participant's status
CREATE POLICY "activity_participants_update_policy"
    ON activity_participants FOR UPDATE
    USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM activities
            WHERE activities.id = activity_participants.activity_id
            AND activities.creator_id = auth.uid()
        )
    ); 