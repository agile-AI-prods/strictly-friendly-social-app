-- Add creator as participant for existing activities that don't have them
INSERT INTO activity_participants (activity_id, user_id, status, joined_at, created_at, updated_at)
SELECT 
    a.id as activity_id,
    a.creator_id as user_id,
    'accepted' as status,
    a.created_at as joined_at,
    a.created_at as created_at,
    a.created_at as updated_at
FROM activities a
WHERE NOT EXISTS (
    SELECT 1 
    FROM activity_participants ap 
    WHERE ap.activity_id = a.id 
    AND ap.user_id = a.creator_id
)
ON CONFLICT (activity_id, user_id) DO NOTHING; 