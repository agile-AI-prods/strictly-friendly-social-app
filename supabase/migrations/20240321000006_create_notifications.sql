-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    type TEXT NOT NULL CHECK (type IN ('message', 'connection', 'activity', 'discovery')),
    from_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    to_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    read BOOLEAN DEFAULT false,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS notifications_to_user_id_idx ON notifications(to_user_id);
CREATE INDEX IF NOT EXISTS notifications_created_at_idx ON notifications(created_at);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own notifications"
    ON notifications FOR SELECT
    USING (to_user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
    ON notifications FOR UPDATE
    USING (to_user_id = auth.uid());

CREATE POLICY "System can insert notifications"
    ON notifications FOR INSERT
    WITH CHECK (true);

-- Create function to handle notification updates
CREATE OR REPLACE FUNCTION handle_notification_update()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for notification updates
CREATE TRIGGER on_notification_update
    BEFORE UPDATE ON notifications
    FOR EACH ROW
    EXECUTE FUNCTION handle_notification_update(); 