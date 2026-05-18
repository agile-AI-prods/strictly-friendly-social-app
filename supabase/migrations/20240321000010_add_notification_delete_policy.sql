-- Add delete policy for notifications
CREATE POLICY "Users can delete their own notifications"
ON notifications
FOR DELETE
USING (
    auth.uid() = to_user_id
);

-- Enable RLS on notifications table if not already enabled
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY; 