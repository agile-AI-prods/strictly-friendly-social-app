import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchUnreadMessageCounts } from '../store/slices/messageSlice';
import socketService from '../services/socketService';
import { useNavigate } from 'react-router-dom';

export const MessageSubscriber = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const authUser = useAppSelector(state => state.auth.user);

    useEffect(() => {
        if (!authUser) return;
        // Fetch unread message counts on mount
        dispatch(fetchUnreadMessageCounts(authUser.id));

        // Connect to Socket.io using cookie (no manual token)
        console.log('Connecting to Socket.io with cookie (no manual token)');
        socketService.connect();

        return () => {
            socketService.disconnect();
        };
    }, [authUser, dispatch]);

    return null;
}; 