-- Add timestamp columns to activity_participants table
ALTER TABLE activity_participants
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS joined_at TIMESTAMPTZ;

-- Create a trigger to automatically update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create a trigger to set joined_at when status changes to 'joined'
CREATE OR REPLACE FUNCTION set_joined_at_column()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'joined' AND (OLD.status IS NULL OR OLD.status != 'joined') THEN
        NEW.joined_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add the triggers to the activity_participants table
DROP TRIGGER IF EXISTS update_activity_participants_updated_at ON activity_participants;
CREATE TRIGGER update_activity_participants_updated_at
    BEFORE UPDATE ON activity_participants
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_activity_participants_joined_at ON activity_participants;
CREATE TRIGGER set_activity_participants_joined_at
    BEFORE INSERT OR UPDATE ON activity_participants
    FOR EACH ROW
    EXECUTE FUNCTION set_joined_at_column(); 