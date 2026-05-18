-- Drop the existing restrictive INSERT policy
DROP POLICY IF EXISTS "Users can create comments on activities they can view" ON activity_comments;

-- Create a simpler, more permissive INSERT policy
CREATE POLICY "Users can create comments on activities they can view"
    ON activity_comments FOR INSERT
    WITH CHECK (
        -- User must be authenticated
        auth.uid() IS NOT NULL
        AND auth.uid() = user_id
        AND (
            -- Public activities: anyone can comment
            EXISTS (
                SELECT 1 FROM activities
                WHERE activities.id = activity_comments.activity_id
                AND activities.privacy = 'public'
            )
            OR
            -- Connection activities: connected users can comment
            EXISTS (
                SELECT 1 FROM activities
                WHERE activities.id = activity_comments.activity_id
                AND activities.privacy = 'connections'
                AND (
                    -- User is connected to the activity creator
                    EXISTS (
                        SELECT 1 FROM connections
                        WHERE (sender_id = auth.uid() OR receiver_id = auth.uid())
                        AND status = 'accepted'
                        AND (sender_id = activities.creator_id OR receiver_id = activities.creator_id)
                    )
                    OR
                    -- User is the activity creator
                    activities.creator_id = auth.uid()
                )
            )
            OR
            -- Private activities: creator and participants can comment
            EXISTS (
                SELECT 1 FROM activities
                WHERE activities.id = activity_comments.activity_id
                AND activities.privacy = 'private'
                AND (
                    activities.creator_id = auth.uid()
                    OR
                    EXISTS (
                        SELECT 1 FROM activity_participants
                        WHERE activity_id = activities.id
                        AND user_id = auth.uid()
                    )
                )
            )
        )
    ); 