-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_new_message ON messages;

-- Recreate the trigger function with proper error handling
CREATE OR REPLACE FUNCTION handle_new_message_notification()
RETURNS TRIGGER AS $$
DECLARE
    v_sender_name TEXT;
BEGIN
    -- Get sender's name
    SELECT name INTO v_sender_name
    FROM profiles
    WHERE id = NEW.sender_id;

    -- Create notification for the message recipient
    INSERT INTO notifications (
        type,
        from_user_id,
        to_user_id,
        content,
        metadata
    ) VALUES (
        'message',
        NEW.sender_id,
        NEW.receiver_id,
        v_sender_name || ' sent you a new message',
        jsonb_build_object('message_id', NEW.id)
    );

    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error but don't prevent the message from being inserted
        RAISE WARNING 'Error creating notification: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_new_message
    AFTER INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_message_notification();

-- Ensure the trigger function has the necessary permissions
GRANT EXECUTE ON FUNCTION handle_new_message_notification() TO authenticated;
GRANT EXECUTE ON FUNCTION handle_new_message_notification() TO service_role; 