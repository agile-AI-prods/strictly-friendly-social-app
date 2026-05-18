import { io, Socket } from 'socket.io-client';
import { store } from '../store';
import { addMessage, updateMessageStatus, removeMessage, setTyping, incrementUnreadCount, updateLastMessage, resetUnreadCount } from '../store/slices/messageSlice';
import { logout } from '../store/slices/authSlice';
import { Connection } from '../types';


class SocketService {
    socket: Socket | null = null;
    connect() {
        if (this.socket) return;
        console.log('Connecting to Socket.io...');
        
        this.socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
            withCredentials: true,
        });

        this.socket.on('connect', () => {
            console.log('✅ Socket.io connected successfully');
        });

        this.socket.on('connect_error', (error) => {
            console.error('❌ Socket.io connection error:', error);
        });

        this.socket.on('disconnect', (reason) => {
            console.log('🔌 Socket.io disconnected:', reason);
        });

        this.socket.on('message:receive', (message) => {
            console.log('📨 message:receive received:', message);
            if (Notification.permission === 'granted') {
                new Notification('New Message', {
                    body: message.content,
                    icon: '/assets/icons/noun-message-notification-4304839.png',
                    tag: message.id, // Prevent duplicate notifications
                    data: { userId: message.sender_id } // Use sender_id for navigation
                }).onclick = function (event) {
                    window.focus();
                    // Dispatch custom event that can be handled by a React component
                    window.dispatchEvent(new CustomEvent('notification:click', {
                        detail: {
                            type: 'message',
                            senderId: message.sender_id
                        }
                    }));
                    // @ts-ignore
                    (event.target as Notification).close(); // Close the notification
                };
            }
            store.dispatch(addMessage({ message, userId: message.sender_id }));
            store.dispatch(incrementUnreadCount({ userId: message.sender_id }));
            store.dispatch(updateLastMessage({
                userId: message.sender_id,
                message: {
                    ...message,
                    content: message.content || 'Image',
                    created_at: message.created_at
                }
            }));
        });
        this.socket.on('message:sent', (message) => {
            console.log('✅ message:sent received:', message);
            store.dispatch(addMessage({ message, userId: message.receiver_id }));
        });

        this.socket.on('message:sent-update', (data) => {
            console.log('Message sent update:', data);
            const { message, receiverId } = data;
            // Update the sender's own connected users list
            store.dispatch(updateLastMessage({
                userId: receiverId,
                message: {
                    ...message,
                    content: message.content || 'Image',
                    created_at: message.created_at
                }
            }));
            // Reset unread count for the receiver since we sent them a message
            store.dispatch(resetUnreadCount({ userId: receiverId }));
        });
        this.socket.on('message:update', (message) => {
            store.dispatch(updateMessageStatus(message));
        });

        this.socket.on('message:delete', (messageId) => {
            store.dispatch(removeMessage(messageId));
        });

        this.socket.on('message:edit', (updatedMessage) => {
            store.dispatch(updateMessageStatus(updatedMessage));
        });

        this.socket.on('message:new', (data) => {
            console.log('New message received:', data);
            const { message, senderId } = data;
            // Add the message to the conversation
            store.dispatch(addMessage({ message, userId: senderId }));
            // Update unread count and last message for the sender
            console.log('Incrementing unread count for:', senderId);
            store.dispatch(incrementUnreadCount({ userId: senderId }));
            store.dispatch(updateLastMessage({
                userId: senderId,
                message: {
                    ...message,
                    content: message.content || 'Image',
                    created_at: message.created_at
                }
            }));
        });

        this.socket.on('message:marked-as-read', (data) => {
            console.log('Message marked as read:', data);
            const { from } = data;
        });

        // Notification events
        this.socket.on('notification:new', (notification) => {
            console.log('New notification received:', notification);
            
            // Get current user ID from Redux store
            const currentUser = store.getState().auth.user;
            if (!currentUser) {
                console.log('No current user found, skipping notification');
                return;
            }
            
            // Skip if notification is from the current user to themselves
            if (notification.from_user_id === currentUser.id && notification.to_user_id === currentUser.id) {
                console.log('Skipping self-notification');
                return;
            }
            
            // Skip if notification is not for the current user
            if (notification.to_user_id !== currentUser.id) {
                console.log('Notification not for current user, skipping');
                return;
            }
            
            // Show browser notification only for message notifications
            if (Notification.permission === 'granted' && notification.type === 'message') {
                new Notification('New Message', {
                    body: notification.content,
                    icon: '/assets/icons/noun-message-notification-4304839.png',
                    tag: notification.id,
                    data: { 
                        type: notification.type,
                        metadata: notification.metadata,
                        from_user_id: notification.from_user_id
                    }
                }).onclick = function (event) {
                    window.focus();
                    // Dispatch custom event for React component handling
                    window.dispatchEvent(new CustomEvent('notification:click', {
                        detail: {
                            type: notification.type,
                            senderId: notification.from_user_id,
                            metadata: notification.metadata
                        }
                    }));
                    // @ts-ignore
                    (event.target as Notification).close();
                };
            }
            
            // Update Redux store with new notification
            store.dispatch({ type: 'notifications/addNotification', payload: notification });
        });

        this.socket.on('notification:marked-as-read', (data) => {
            console.log('Notification marked as read:', data);
            const { notificationId } = data;
            store.dispatch({ type: 'notifications/markAsRead', payload: notificationId });
        });

        this.socket.on('notification:deleted', (data) => {
            console.log('Notification deleted:', data);
            const { notificationId } = data;
            store.dispatch({ type: 'notifications/removeNotification', payload: notificationId });
        });

        // Presence event listeners
        this.socket.on('presence:sync', (data) => {
            console.log('Presence sync received:', data);
            const { onlineUsers, userStatuses } = data;
            store.dispatch({ type: 'presence/setOnlineUsers', payload: onlineUsers });
            store.dispatch({ type: 'presence/setUserStatuses', payload: userStatuses });
        });

        this.socket.on('presence:user-online', (data) => {
            console.log('User online:', data);
            const { userId, status } = data;
            store.dispatch({ type: 'presence/addOnlineUser', payload: userId });
            store.dispatch({ type: 'presence/setUserStatus', payload: { userId, status } });
        });

        this.socket.on('presence:user-offline', (data) => {
            console.log('User offline:', data);
            const { userId } = data;
            store.dispatch({ type: 'presence/removeOnlineUser', payload: userId });
        });

        this.socket.on('presence:user-status-change', (data) => {
            console.log('User status change:', data);
            const { userId, status } = data;
            store.dispatch({ type: 'presence/setUserStatus', payload: { userId, status } });
        });



        // Comment event listeners
        this.socket.on('comment:new', (comment) => {
            console.log('New comment received:', comment);
            store.dispatch({ type: 'comments/addComment', payload: { activityId: comment.activity_id, comment } });
        });

        this.socket.on('comment:updated', (comment) => {
            console.log('Comment updated:', comment);
            store.dispatch({ type: 'comments/updateComment', payload: { activityId: comment.activity_id, comment } });
        });

        this.socket.on('comment:deleted', (data) => {
            console.log('Comment deleted:', data);
            const { commentId, activityId } = data;
            store.dispatch({ type: 'comments/removeComment', payload: { activityId, commentId } });
        });

        this.socket.on('typing:start', ({ userId }) => {
            store.dispatch(setTyping({ userId, isTyping: true }));
        });

        this.socket.on('typing:stop', ({ userId }) => {
            store.dispatch(setTyping({ userId, isTyping: false }));
        });

        // Handle authentication errors
        this.socket.on('connect_error', (error) => {
            console.log('Socket.io connection error:', error);
            if (error.message === 'Authentication error') {
                console.log('Socket.io authentication failed, logging out user');
                store.dispatch(logout());
                window.location.href = '/login';
            }
        });

        // Call event listeners
        this.socket.on('call:offer', (data) => {
            console.log('Call offer received:', data);
            // This will be handled by the Chat component
            window.dispatchEvent(new CustomEvent('call:offer', { detail: data }));
        });

        this.socket.on('call:answer', (data) => {
            console.log('Call answer received:', data);
            window.dispatchEvent(new CustomEvent('call:answer', { detail: data }));
        });

        this.socket.on('call:ice-candidate', (data) => {
            console.log('Call ICE candidate received:', data);
            window.dispatchEvent(new CustomEvent('call:ice-candidate', { detail: data }));
        });

        this.socket.on('call:end', (data) => {
            console.log('Call end received:', data);
            window.dispatchEvent(new CustomEvent('call:end', { detail: data }));
        });

        this.socket.on('call:decline', (data) => {
            console.log('Call decline received:', data);
            window.dispatchEvent(new CustomEvent('call:decline', { detail: data }));
        });

        // Message read status listener
        this.socket.on('message:marked-as-read', (data) => {
            console.log('Message marked as read:', data);
            window.dispatchEvent(new CustomEvent('message:marked-as-read', { detail: data }));
        });

        // Connection request listener
        this.socket.on('connection:request', (data) => {
            console.log('Connection request received:', data);
            window.dispatchEvent(new CustomEvent('connection:request', { detail: data }));
        });
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    sendMessage(message: any) {
        console.log('📤 Sending message via Socket.io:', message);
        if (!this.socket) {
            console.error('❌ Socket not connected, cannot send message');
            return;
        }
        if (!this.socket.connected) {
            console.error('❌ Socket not connected, cannot send message');
            return;
        }
        this.socket.emit('message:send', message);
        console.log('✅ Message sent via Socket.io');
    }

    async startTyping(receiverId: string) {
        try {
            // Update typing status in MongoDB via API
            const { setTypingStatus } = await import('../api/typingStatusApi');
            await setTypingStatus(receiverId, true);
            
            // Emit via Socket.io for real-time updates
            this.socket?.emit('typing:start', { receiverId });
        } catch (error) {
            console.error('Error starting typing status:', error);
            // Fallback to Socket.io only if API fails
            this.socket?.emit('typing:start', { receiverId });
        }
    }

    async stopTyping(receiverId: string) {
        try {
            // Clear typing status in MongoDB via API
            const { clearTypingStatus } = await import('../api/typingStatusApi');
            await clearTypingStatus(receiverId);
            
            // Emit via Socket.io for real-time updates
            this.socket?.emit('typing:stop', { receiverId });
        } catch (error) {
            console.error('Error stopping typing status:', error);
            // Fallback to Socket.io only if API fails
            this.socket?.emit('typing:stop', { receiverId });
        }
    }

    deleteMessage(messageId: string) {
        this.socket?.emit('message:delete', { messageId });
    }

    editMessage(messageId: string, content: string) {
        this.socket?.emit('message:edit', { messageId, content });
    }

    // Call signaling methods
    sendCallOffer(receiverId: string, offer: RTCSessionDescriptionInit, isVideoCall: boolean) {
        this.socket?.emit('call:offer', { receiverId, offer, isVideoCall });
    }

    sendCallAnswer(receiverId: string, answer: RTCSessionDescriptionInit) {
        this.socket?.emit('call:answer', { receiverId, answer });
    }

    sendIceCandidate(receiverId: string, candidate: RTCIceCandidateInit) {
        this.socket?.emit('call:ice-candidate', { receiverId, candidate });
    }

    sendCallEnd(receiverId: string) {
        this.socket?.emit('call:end', { receiverId });
    }

    sendCallDecline(receiverId: string) {
        this.socket?.emit('call:decline', { receiverId });
    }

    // Message read status
    sendMessageReadStatus(senderId: string) {
        this.socket?.emit('message:mark-as-read', { senderId });
    }

    // Presence methods
    updatePresenceStatus(status: 'online' | 'idle') {
        this.socket?.emit('presence:update-status', { status });
    }

    updatePresenceActivity() {
        this.socket?.emit('presence:update-activity');
    }

    // Notification methods
    createNotification(notificationData: any) {
        this.socket?.emit('notification:create', notificationData);
    }

    markNotificationAsRead(notificationId: string) {
        this.socket?.emit('notification:mark-as-read', { notificationId });
    }

    deleteNotification(notificationId: string) {
        this.socket?.emit('notification:delete', { notificationId });
    }

    // Comment methods
    subscribeToComments(activityId: string) {
        this.socket?.emit('comment:subscribe', { activityId });
    }

    unsubscribeFromComments(activityId: string) {
        this.socket?.emit('comment:unsubscribe', { activityId });
    }

    createComment(activityId: string, content: string) {
        this.socket?.emit('comment:create', { activityId, content });
    }

    updateComment(commentId: string, content: string) {
        this.socket?.emit('comment:update', { commentId, content });
    }

    deleteComment(commentId: string) {
        this.socket?.emit('comment:delete', { commentId });
    }
    sendConnectionRequest(connection: Connection) {
        this.socket?.emit('connection:request', { connection });
    }
}

export default new SocketService(); 