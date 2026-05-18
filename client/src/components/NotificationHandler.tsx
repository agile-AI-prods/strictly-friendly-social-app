import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const NotificationHandler = () => {
    const navigate = useNavigate();

    useEffect(() => {
        const handleNotificationClick = (event: CustomEvent) => {
            const { type, senderId, metadata } = event.detail;
            
            if (type === 'message') {
                navigate('/messages', { 
                    state: { selectedUserId: senderId } 
                });
            } else if (type === 'like' && metadata?.activity_id) {
                navigate(`/activity/${metadata.activity_id}`);
            } else if (type === 'unlike' && metadata?.activity_id) {
                navigate(`/activity/${metadata.activity_id}`);
            } else if (type === 'activity' && metadata?.activity_id) {
                navigate(`/activity/${metadata.activity_id}`);
            } else if (type === 'activity_update' && metadata?.activity_id) {
                navigate(`/activity/${metadata.activity_id}`);
            } else if (type === 'activity_deleted' && metadata?.activity_id) {
                // For deleted activities, navigate to activities list since the activity no longer exists
                navigate('/activity');
            }
        };

        // Listen for notification click events
        window.addEventListener('notification:click', handleNotificationClick as EventListener);

        return () => {
            window.removeEventListener('notification:click', handleNotificationClick as EventListener);
        };
    }, [navigate]);

    return null; // This component doesn't render anything
};

export default NotificationHandler; 