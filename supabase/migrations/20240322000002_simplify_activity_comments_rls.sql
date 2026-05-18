-- Drop the complex INSERT policy and create a simpler one
DROP POLICY IF EXISTS "Users can create comments on activities they can view" ON activity_comments;

-- Create a much simpler INSERT policy
CREATE POLICY "Allow authenticated users to comment on viewable activities"
    ON activity_comments FOR INSERT
    WITH CHECK (
        -- User must be authenticated and setting their own user_id
        auth.uid() IS NOT NULL 
        AND auth.uid() = user_id
        AND (
            -- Allow commenting on public activities
            EXISTS (
                SELECT 1 FROM activities 
                WHERE id = activity_comments.activity_id 
                AND privacy = 'public'
            )
            OR
            -- Allow commenting on connection activities if user is connected to creator
            EXISTS (
                SELECT 1 FROM activities a
                JOIN connections c ON (
                    (c.sender_id = a.creator_id AND c.receiver_id = auth.uid()) OR
                    (c.receiver_id = a.creator_id AND c.sender_id = auth.uid())
                )
                WHERE a.id = activity_comments.activity_id 
                AND a.privacy = 'connections'
                AND c.status = 'accepted'
            )
            OR
            -- Allow commenting on private activities if user is creator or participant
            EXISTS (
                SELECT 1 FROM activities a
                LEFT JOIN activity_participants ap ON a.id = ap.activity_id AND ap.user_id = auth.uid()
                WHERE a.id = activity_comments.activity_id 
                AND a.privacy = 'private'
                AND (a.creator_id = auth.uid() OR ap.id IS NOT NULL)
            )
        )
    ); 