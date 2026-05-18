-- Function to create a notification
CREATE OR REPLACE FUNCTION create_notification(
    p_type TEXT,
    p_from_user_id UUID,
    p_to_user_id UUID,
    p_content TEXT,
    p_metadata JSONB DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_notification_id UUID;
BEGIN
    INSERT INTO notifications (
        type,
        from_user_id,
        to_user_id,
        content,
        metadata
    ) VALUES (
        p_type,
        p_from_user_id,
        p_to_user_id,
        p_content,
        p_metadata
    ) RETURNING id INTO v_notification_id;
    
    RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger for new messages
CREATE OR REPLACE FUNCTION handle_new_message_notification()
RETURNS TRIGGER AS $$
BEGIN
    -- Create notification for the message recipient
    PERFORM create_notification(
        'message',
        NEW.sender_id,
        NEW.receiver_id,
        'sent you a new message',
        jsonb_build_object('message_id', NEW.id)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_new_message
    AFTER INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_message_notification();

-- Trigger for connection status changes
CREATE OR REPLACE FUNCTION handle_connection_notification()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'accepted' AND OLD.status != 'accepted' THEN
        -- Notify the sender that their connection request was accepted
        PERFORM create_notification(
            'connection',
            NEW.receiver_id,
            NEW.sender_id,
            'accepted your connection request',
            jsonb_build_object('connection_id', NEW.id)
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_connection_update
    AFTER UPDATE ON connections
    FOR EACH ROW
    EXECUTE FUNCTION handle_connection_notification();

-- Trigger for activity participant status changes
CREATE OR REPLACE FUNCTION handle_activity_participant_notification()
RETURNS TRIGGER AS $$
DECLARE
    v_activity_title TEXT;
BEGIN
    -- Get activity title
    SELECT title INTO v_activity_title
    FROM activities
    WHERE id = NEW.activity_id;

    IF NEW.status = 'accepted' AND OLD.status != 'accepted' THEN
        -- Notify the activity creator when someone accepts their invitation
        PERFORM create_notification(
            'activity',
            NEW.user_id,
            (SELECT creator_id FROM activities WHERE id = NEW.activity_id),
            'accepted your invitation to join ' || v_activity_title,
            jsonb_build_object('activity_id', NEW.activity_id)
        );
    ELSIF NEW.status = 'joining' AND OLD.status != 'joining' THEN
        -- Notify the activity creator when someone requests to join
        PERFORM create_notification(
            'activity',
            NEW.user_id,
            (SELECT creator_id FROM activities WHERE id = NEW.activity_id),
            'wants to join ' || v_activity_title,
            jsonb_build_object('activity_id', NEW.activity_id)
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_activity_participant_update
    AFTER UPDATE ON activity_participants
    FOR EACH ROW
    EXECUTE FUNCTION handle_activity_participant_notification();

-- Trigger for new activity participants
CREATE OR REPLACE FUNCTION handle_new_activity_participant()
RETURNS TRIGGER AS $$
DECLARE
    v_activity_title TEXT;
BEGIN
    -- Get activity title
    SELECT title INTO v_activity_title
    FROM activities
    WHERE id = NEW.activity_id;

    IF NEW.status = 'invited' THEN
        -- Notify the invited user
        PERFORM create_notification(
            'activity',
            (SELECT creator_id FROM activities WHERE id = NEW.activity_id),
            NEW.user_id,
            'invited you to join ' || v_activity_title,
            jsonb_build_object('activity_id', NEW.activity_id)
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_new_activity_participant
    AFTER INSERT ON activity_participants
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_activity_participant();

-- Trigger for discovery profile updates
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
        v_user_name || ' updated their profile',
        jsonb_build_object('user_id', NEW.id)
    FROM profiles p
    WHERE p.id != NEW.id
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

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_profile_location_update
    AFTER UPDATE OF location ON profiles
    FOR EACH ROW
    WHEN (
        (OLD.location->>'latitude')::NUMERIC IS DISTINCT FROM (NEW.location->>'latitude')::NUMERIC OR
        (OLD.location->>'longitude')::NUMERIC IS DISTINCT FROM (NEW.location->>'longitude')::NUMERIC
    )
    EXECUTE FUNCTION handle_discovery_notification(); 