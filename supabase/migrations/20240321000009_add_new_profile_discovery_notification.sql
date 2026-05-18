-- Function to handle notifications for new profiles
CREATE OR REPLACE FUNCTION handle_new_profile_discovery_notification()
RETURNS TRIGGER AS $$
DECLARE
    v_user_name TEXT;
    v_latitude NUMERIC;
    v_longitude NUMERIC;
BEGIN
    -- Get user's name and location
    v_user_name := NEW.name;
    v_latitude := (NEW.location->>'latitude')::NUMERIC;
    v_longitude := (NEW.location->>'longitude')::NUMERIC;

    -- Only proceed if location is set
    IF v_latitude IS NOT NULL AND v_longitude IS NOT NULL THEN
        -- Notify users who have this new user in their discovery range
        INSERT INTO notifications (
            type,
            from_user_id,
            to_user_id,
            content,
            metadata
        )
        SELECT
            'discovery',
            NEW.id,
            p.id,
            v_user_name || ' joined and is nearby',
            jsonb_build_object('user_id', NEW.id)
        FROM profiles p
        WHERE p.id != NEW.id
        AND p.location IS NOT NULL
        AND EXISTS (
            SELECT 1
            FROM discovery_settings ds
            WHERE ds.user_id = p.id
            AND ds.is_active = true
            AND ds.range >= (
                SELECT distance
                FROM calculate_distance(
                    (p.location->>'latitude')::NUMERIC,
                    (p.location->>'longitude')::NUMERIC,
                    v_latitude,
                    v_longitude
                )
            )
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new profile creation
CREATE TRIGGER on_new_profile
    AFTER INSERT ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_profile_discovery_notification();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION handle_new_profile_discovery_notification() TO authenticated;
GRANT EXECUTE ON FUNCTION handle_new_profile_discovery_notification() TO service_role;

-- Add error handling to existing discovery notification function
CREATE OR REPLACE FUNCTION handle_discovery_notification()
RETURNS TRIGGER AS $$
DECLARE
    v_user_name TEXT;
    v_old_latitude NUMERIC;
    v_old_longitude NUMERIC;
    v_new_latitude NUMERIC;
    v_new_longitude NUMERIC;
BEGIN
    -- Get user name
    SELECT name INTO v_user_name
    FROM profiles
    WHERE id = NEW.id;

    -- Get old and new coordinates
    v_old_latitude := (OLD.location->>'latitude')::NUMERIC;
    v_old_longitude := (OLD.location->>'longitude')::NUMERIC;
    v_new_latitude := (NEW.location->>'latitude')::NUMERIC;
    v_new_longitude := (NEW.location->>'longitude')::NUMERIC;

    -- Only proceed if both old and new coordinates are valid
    IF v_old_latitude IS NOT NULL AND v_old_longitude IS NOT NULL 
       AND v_new_latitude IS NOT NULL AND v_new_longitude IS NOT NULL THEN
        
        -- Notify users who have this user in their discovery range
        INSERT INTO notifications (
            type,
            from_user_id,
            to_user_id,
            content,
            metadata
        )
        SELECT
            'discovery',
            NEW.id,
            p.id,
            v_user_name || ' updated their location',
            jsonb_build_object('user_id', NEW.id)
        FROM profiles p
        WHERE p.id != NEW.id
        AND p.location IS NOT NULL
        AND EXISTS (
            SELECT 1
            FROM discovery_settings ds
            WHERE ds.user_id = p.id
            AND ds.is_active = true
            AND ds.range >= (
                SELECT distance
                FROM calculate_distance(
                    (p.location->>'latitude')::NUMERIC,
                    (p.location->>'longitude')::NUMERIC,
                    v_new_latitude,
                    v_new_longitude
                )
            )
        );
    END IF;

    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error but don't prevent the profile update
        RAISE WARNING 'Error creating discovery notification: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 