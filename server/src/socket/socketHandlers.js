const jwt = require('jsonwebtoken');
const cookie = require('cookie');
const { getDatabase } = require('../config/database');
const { UUID } = require('mongodb');

const connectedUsers = new Map(); // userId -> socketId
const userStatuses = new Map(); // userId -> 'online' | 'idle'

module.exports = (io) => {
    io.use((socket, next) => {
        // Parse JWT from cookie
        const cookies = cookie.parse(socket.handshake.headers.cookie || '');
        const token = cookies.sf_jwt; // Use your actual cookie name
        if (!token) return next(new Error('Authentication error'));
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
            socket.userId = decoded.sub || decoded.id;
            next();
        } catch (err) {
            console.log('\n\nSocket.io connection attempt, error:', err); // Debug log
            next(new Error('Authentication error'));
        }
    });

    io.on('connection', (socket) => {
        if (!socket.userId) return socket.disconnect();
        
        // Add user to connected users and set status
        connectedUsers.set(socket.userId, socket.id);
        userStatuses.set(socket.userId, 'online');
        
        // Join user to their personal room for targeted notifications
        socket.join(socket.userId);

        // Broadcast user online status to all other users
        socket.broadcast.emit('presence:user-online', {
            userId: socket.userId,
            status: 'online'
        });

        // Send current online users to the newly connected user
        const onlineUsers = Array.from(connectedUsers.keys());
        const currentUserStatuses = Object.fromEntries(userStatuses);
        socket.emit('presence:sync', {
            onlineUsers,
            userStatuses: currentUserStatuses
        });

        // --- Message send ---
        socket.on('message:send', async (data) => {
            const { receiverId, content, imageUrl } = data;
            console.log('=== Socket message:send received ===');
            console.log('Data:', data);
            console.log('Socket userId:', socket.userId);
            console.log('Receiver ID:', receiverId);
            
            if (!receiverId || (!content && !imageUrl)) {
                console.log('Invalid message data, returning');
                return;
            }
            
            try {
                // Convert string IDs to UUID objects
                let senderIdUUID, receiverIdUUID;
                try {
                    senderIdUUID = new UUID(socket.userId);
                    receiverIdUUID = new UUID(receiverId);
                } catch (uuidError) {
                    console.error('UUID conversion failed:', uuidError.message);
                    socket.emit('message:error', { error: 'Invalid user ID format' });
                    return;
                }
                
                console.log('UUIDs converted successfully:', { senderIdUUID, receiverIdUUID });
                
                // Save to MongoDB
                const db = await getDatabase();
                const messagesCollection = db.collection('messages');
                
                const newMessage = {
                    sender_id: senderIdUUID,
                    receiver_id: receiverIdUUID,
                    content: content || '',
                    imageUrl: imageUrl || null,
                    status: 'sent',
                    created_at: new Date().toISOString()
                };
                
                console.log('Saving message to MongoDB:', newMessage);
                
                const result = await messagesCollection.insertOne(newMessage);
                const message = { ...newMessage, _id: result.insertedId };
                
                console.log('Message saved successfully:', message._id);
                
                // Transform message for client (convert UUIDs to strings)
                const clientMessage = {
                    id: message._id.toString(),
                    sender_id: message.sender_id.toString(),
                    receiver_id: message.receiver_id.toString(),
                    content: message.content,
                    created_at: message.created_at,
                    status: message.status,
                    imageUrl: message.imageUrl
                };
                
                console.log('Sending client message:', clientMessage);
                
                // Emit to sender for confirmation
                socket.emit('message:sent', clientMessage);
                
                // Emit to receiver
                const receiverSocketId = connectedUsers.get(receiverId);
                if (receiverSocketId) {
                    console.log('Receiver online, sending message to:', receiverSocketId);
                    io.to(receiverSocketId).emit('message:receive', clientMessage);
                } else {
                    console.log('Receiver not online');
                }
            } catch (error) {
                console.error('Error saving message to MongoDB:', error);
                socket.emit('message:error', { error: 'Failed to save message' });
            }
        });

        // --- Message delete ---
        socket.on('message:delete', async (data) => {
            const { messageId } = data;
            if (!messageId) return;
            
            console.log('Deleting message', messageId);
            try {
                console.log('user', socket.userId);
                
                const db = await getDatabase();
                const messagesCollection = db.collection('messages');
                
                // First check if the message belongs to the current user
                let message = null;
                try {
                    const uuidFromString = new UUID(messageId);
                    message = await messagesCollection.findOne({ 
                        _id: uuidFromString,
                        sender_id: socket.userId // Only allow deleting own messages
                    });
                } catch (uuidError) {
                    console.log('UUID conversion failed:', uuidError.message);
                    socket.emit('message:delete:error', { error: 'Invalid message ID' });
                    return;
                }
                
                console.log('message', message);
                if (!message) {
                    console.error('Message not found or unauthorized');
                    socket.emit('message:delete:error', { error: 'Message not found or unauthorized' });
                    return;
                }
                
                // Now delete the message
                const result = await messagesCollection.deleteOne({ _id: message._id });
                
                if (result.deletedCount === 0) {
                    socket.emit('message:delete:error', { error: 'Failed to delete message' });
                    return;
                }
                
                // Emit delete confirmation to sender
                socket.emit('message:deleted', { messageId });
                
                // Emit delete notification to receiver if they're online
                const receiverSocketId = connectedUsers.get(message.receiver_id);
                if (receiverSocketId) {
                    io.to(receiverSocketId).emit('message:deleted', { messageId });
                }
                
            } catch (error) {
                console.error('Error deleting message:', error);
                socket.emit('message:delete:error', { error: 'Failed to delete message' });
            }
        });

        // --- Message edit ---
        socket.on('message:edit', async (data) => {
            const { messageId, content } = data;
            if (!messageId || !content) return;
            console.log('Editing message', messageId, content);
            try {
                const db = await getDatabase();
                const messagesCollection = db.collection('messages');
                
                // Convert string IDs to UUID objects if needed
                let messageIdUUID, userIdUUID;
                try {
                    messageIdUUID = new UUID(messageId);
                    userIdUUID = new UUID(socket.userId);
                } catch (uuidError) {
                    // If not valid UUIDs, use strings directly (for ObjectId)
                    messageIdUUID = messageId;
                    userIdUUID = socket.userId;
                }
                
                // First check if the message belongs to the current user
                const message = await messagesCollection.findOne({
                    _id: messageIdUUID,
                    sender_id: userIdUUID
                });
                
                if (!message) {
                    console.error('Message not found or unauthorized');
                    socket.emit('message:edit:error', { error: 'Message not found or unauthorized' });
                    return;
                }
                
                // Now update the message
                const result = await messagesCollection.updateOne(
                    { _id: messageIdUUID },
                    { $set: { content, updated_at: new Date().toISOString() } }
                );
                
                if (result.matchedCount === 0) {
                    console.error('Failed to update message');
                    socket.emit('message:edit:error', { error: 'Failed to update message' });
                    return;
                }
                
                // Get updated message
                const updatedMessage = await messagesCollection.findOne({ _id: messageIdUUID });
                
                // Transform for client (convert UUIDs to strings)
                const clientMessage = {
                    ...updatedMessage,
                    id: updatedMessage._id.toString(),
                    sender_id: updatedMessage.sender_id.toString(),
                    receiver_id: updatedMessage.receiver_id.toString()
                };
                
                // Emit edit event to both sender and receiver
                socket.emit('message:edit', clientMessage);
                const receiverSocketId = connectedUsers.get(message.receiver_id.toString());
                if (receiverSocketId) {
                    io.to(receiverSocketId).emit('message:edit', clientMessage);
                }
            } catch (error) {
                console.error('Error in message:edit handler:', error);
                socket.emit('message:edit:error', { error: error.message });
            }
        });

        // --- Call signaling ---
        socket.on('call:offer', async (data) => {
            const { receiverId, offer, isVideoCall } = data;
            if (!receiverId || !offer) return;
            console.log('Call offer received:', { from: socket.userId, to: receiverId, isVideoCall });
            
            try {
                // Create call record in MongoDB
                const callService = require('../services/callService');
                const callData = {
                    caller_id: socket.userId,
                    receiver_id: receiverId,
                    call_type: isVideoCall ? 'video' : 'voice',
                    status: 'initiating'
                };
                
                const call = await callService.createCall(callData);
                console.log('Call record created:', call.id);
                
                // Store call ID in socket for later updates
                socket.currentCallId = call.id;
            } catch (error) {
                console.error('Error creating call record:', error);
            }
            
            // Emit to receiver
            const receiverSocketId = connectedUsers.get(receiverId);
            if (receiverSocketId) {
                io.to(receiverSocketId).emit('call:offer', {
                    from: socket.userId,
                    offer,
                    isVideoCall
                });
            }
        });

        socket.on('call:answer', async (data) => {
            const { receiverId, answer } = data;
            if (!receiverId || !answer) return;
            console.log('Call answer received:', { from: socket.userId, to: receiverId });
            
            try {
                // Update call status to 'active' and set answered_at
                const callService = require('../services/callService');
                if (socket.currentCallId) {
                    await callService.updateCallStatus(socket.currentCallId, {
                        status: 'active',
                        answered_at: new Date().toISOString()
                    });
                    console.log('Call status updated to active:', socket.currentCallId);
                }
            } catch (error) {
                console.error('Error updating call status:', error);
            }
            
            // Emit to receiver
            const receiverSocketId = connectedUsers.get(receiverId);
            if (receiverSocketId) {
                io.to(receiverSocketId).emit('call:answer', {
                    from: socket.userId,
                    answer
                });
            }
        });

        socket.on('call:ice-candidate', async (data) => {
            const { receiverId, candidate } = data;
            if (!receiverId || !candidate) return;
            console.log('ICE candidate received:', { from: socket.userId, to: receiverId });
            
            // Emit to receiver
            const receiverSocketId = connectedUsers.get(receiverId);
            if (receiverSocketId) {
                io.to(receiverSocketId).emit('call:ice-candidate', {
                    from: socket.userId,
                    candidate
                });
            }
        });

        socket.on('call:end', async (data) => {
            const { receiverId } = data;
            if (!receiverId) return;
            console.log('Call end received:', { from: socket.userId, to: receiverId });
            
            try {
                // End call record in MongoDB
                const callService = require('../services/callService');
                if (socket.currentCallId) {
                    await callService.endCall(socket.currentCallId, 'ended');
                    console.log('Call ended in database:', socket.currentCallId);
                    socket.currentCallId = null;
                }
            } catch (error) {
                console.error('Error ending call record:', error);
            }
            
            // Emit to receiver
            const receiverSocketId = connectedUsers.get(receiverId);
            if (receiverSocketId) {
                io.to(receiverSocketId).emit('call:end', {
                    from: socket.userId
                });
            }
        });

        socket.on('call:decline', async (data) => {
            const { receiverId } = data;
            if (!receiverId) return;
            console.log('Call decline received:', { from: socket.userId, to: receiverId });
            
            try {
                // Update call status to 'declined'
                const callService = require('../services/callService');
                if (socket.currentCallId) {
                    await callService.updateCallStatus(socket.currentCallId, {
                        status: 'declined'
                    });
                    console.log('Call declined in database:', socket.currentCallId);
                    socket.currentCallId = null;
                }
            } catch (error) {
                console.error('Error updating call status to declined:', error);
            }
            
            // Emit to receiver
            const receiverSocketId = connectedUsers.get(receiverId);
            if (receiverSocketId) {
                io.to(receiverSocketId).emit('call:decline', {
                    from: socket.userId
                });
            }
        });

        // --- Message read status ---
        socket.on('message:mark-as-read', async (data) => {
            const { senderId } = data;
            if (!senderId) return;
            console.log('Message marked as read:', { from: socket.userId, to: senderId });
            
            // Emit to sender to update their message status
            const senderSocketId = connectedUsers.get(senderId);
            if (senderSocketId) {
                io.to(senderSocketId).emit('message:marked-as-read', {
                    from: socket.userId
                });
            }
        });

        // --- Typing status ---
        socket.on('typing:start', async ({ receiverId }) => {
            try {
                console.log('Typing start:', { userId: socket.userId, receiverId });
                
                // Save typing status to MongoDB
                const typingStatusService = require('../services/typingStatusService');
                await typingStatusService.setTypingStatus(socket.userId, receiverId, true);
                
                // Emit to receiver
                const receiverSocketId = connectedUsers.get(receiverId);
                if (receiverSocketId) {
                    io.to(receiverSocketId).emit('typing:start', { userId: socket.userId });
                }
            } catch (error) {
                console.error('Error setting typing status:', error);
            }
        });
        
        socket.on('typing:stop', async ({ receiverId }) => {
            try {
                console.log('Typing stop:', { userId: socket.userId, receiverId });
                
                // Clear typing status from MongoDB
                const typingStatusService = require('../services/typingStatusService');
                await typingStatusService.clearTypingStatus(socket.userId, receiverId);
                
                // Emit to receiver
                const receiverSocketId = connectedUsers.get(receiverId);
                if (receiverSocketId) {
                    io.to(receiverSocketId).emit('typing:stop', { userId: socket.userId });
                }
            } catch (error) {
                console.error('Error clearing typing status:', error);
            }
        });

        // --- Presence status updates ---
        socket.on('presence:update-status', ({ status }) => {
            const userStatus = userStatuses.get(socket.userId);
            if (userStatus) {
                userStatuses.set(socket.userId, status);
                
                // Broadcast status change to all other users
                socket.broadcast.emit('presence:user-status-change', {
                    userId: socket.userId,
                    status
                });
            }
        });

        socket.on('presence:update-activity', () => {
            // Just update activity timestamp internally, no need to broadcast
            // This is used for idle detection only
        });

        // --- Comment events ---
        socket.on('comment:subscribe', ({ activityId }) => {
            if (!activityId) return;
            console.log('Comment subscription:', { userId: socket.userId, activityId });
            socket.join(`activity:${activityId}`);
        });

        socket.on('comment:unsubscribe', ({ activityId }) => {
            if (!activityId) return;
            console.log('Comment unsubscription:', { userId: socket.userId, activityId });
            socket.leave(`activity:${activityId}`);
        });

        // Comment CRUD events
        socket.on('comment:create', async (commentData) => {
            try {
                const { activityId, content } = commentData;
                if (!activityId || !content) return;

                // Use commentService to create comment (includes notification logic)
                const commentService = require('../services/commentService');
                const data = await commentService.createComment(socket.userId, activityId, content);

                // Emit to all users subscribed to this activity
                io.to(`activity:${activityId}`).emit('comment:new', data);
            } catch (error) {
                console.error('Error creating comment:', error);
            }
        });

        socket.on('comment:update', async (commentData) => {
            try {
                const { commentId, content } = commentData;
                if (!commentId || !content) return;

                // Use commentService to update comment
                const commentService = require('../services/commentService');
                const data = await commentService.updateComment(commentId, socket.userId, content);

                // Emit to all users subscribed to this activity
                io.to(`activity:${data.activity_id}`).emit('comment:updated', data);
            } catch (error) {
                console.error('Error updating comment:', error);
            }
        });

        socket.on('comment:delete', async (commentData) => {
            try {
                const { commentId } = commentData;
                if (!commentId) return;

                // Use commentService to delete comment
                const commentService = require('../services/commentService');
                await commentService.deleteComment(commentId, socket.userId);

                // Emit to all users subscribed to this activity
                // Note: We need to get the activity_id from the comment before deletion
                // For now, we'll emit with just the commentId
                io.to(socket.id).emit('comment:deleted', { commentId });
            } catch (error) {
                console.error('Error deleting comment:', error);
            }
        });

        // --- Disconnect ---
        socket.on('disconnect', () => {
            connectedUsers.delete(socket.userId);
            userStatuses.delete(socket.userId);
            socket.broadcast.emit('presence:user-offline', { userId: socket.userId });
        });

        // --- Notification events ---
        socket.on('notification:create', async (notificationData) => {
            try {
                console.log('Creating notification via socket:', notificationData);
                
                // Create notification in MongoDB
                const db = await getDatabase();
                const notificationsCollection = db.collection('notifications');
                
                // Convert string IDs to UUID objects if needed
                let fromUserIdUUID, toUserIdUUID;
                try {
                    fromUserIdUUID = new UUID(notificationData.from_user_id);
                    toUserIdUUID = new UUID(notificationData.to_user_id);
                } catch (uuidError) {
                    // If not valid UUIDs, use strings directly (for ObjectId)
                    fromUserIdUUID = notificationData.from_user_id;
                    toUserIdUUID = notificationData.to_user_id;
                }
                
                const notification = {
                    ...notificationData,
                    from_user_id: fromUserIdUUID,
                    to_user_id: toUserIdUUID,
                    read: false,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                };
                
                const result = await notificationsCollection.insertOne(notification);
                const createdNotification = { ...notification, _id: result.insertedId };
                
                // Transform for client (convert UUIDs to strings)
                const clientNotification = {
                    ...createdNotification,
                    id: createdNotification._id.toString(),
                    from_user_id: createdNotification.from_user_id.toString(),
                    to_user_id: createdNotification.to_user_id.toString()
                };
                
                console.log('Notification created successfully:', clientNotification._id);

                // Emit to the recipient
                const recipientSocketId = connectedUsers.get(notificationData.to_user_id);
                if (recipientSocketId) {
                    console.log('Emitting notification to recipient:', recipientSocketId);
                    io.to(recipientSocketId).emit('notification:new', clientNotification);
                } else {
                    console.log('Recipient not online, notification saved to database');
                }
            } catch (error) {
                console.error('Error creating notification via socket:', error);
            }
        });

        socket.on('notification:mark-as-read', async ({ notificationId }) => {
            try {
                console.log('Marking notification as read:', notificationId);
                
                // Update notification in MongoDB
                const db = await getDatabase();
                const notificationsCollection = db.collection('notifications');
                
                // Convert string IDs to UUID objects if needed
                let notificationIdUUID, userIdUUID;
                try {
                    notificationIdUUID = new UUID(notificationId);
                    userIdUUID = new UUID(socket.userId);
                } catch (uuidError) {
                    // If not valid UUIDs, use strings directly (for ObjectId)
                    notificationIdUUID = notificationId;
                    userIdUUID = socket.userId;
                }
                
                const result = await notificationsCollection.updateOne(
                    { _id: notificationIdUUID, to_user_id: userIdUUID },
                    { $set: { read: true, updated_at: new Date().toISOString() } }
                );
                
                if (result.matchedCount === 0) {
                    console.log('Notification not found or unauthorized');
                    return;
                }
                
                console.log('Notification marked as read successfully');

                // Emit to the notification owner
                io.to(socket.id).emit('notification:marked-as-read', { notificationId });
            } catch (error) {
                console.error('Error marking notification as read via socket:', error);
            }
        });

        socket.on('notification:delete', async ({ notificationId }) => {
            try {
                console.log('Deleting notification:', notificationId);
                
                // Delete notification from MongoDB
                const db = await getDatabase();
                const notificationsCollection = db.collection('notifications');
                
                // Convert string IDs to UUID objects if needed
                let notificationIdUUID, userIdUUID;
                try {
                    notificationIdUUID = new UUID(notificationId);
                    userIdUUID = new UUID(socket.userId);
                } catch (uuidError) {
                    // If not valid UUIDs, use strings directly (for ObjectId)
                    userIdUUID = socket.userId;
                }
                
                const result = await notificationsCollection.deleteOne({
                    _id: notificationIdUUID,
                    to_user_id: userIdUUID
                });
                
                if (result.deletedCount === 0) {
                    console.log('Notification not found or unauthorized');
                    return;
                }
                
                console.log('Notification deleted successfully');

                // Emit to the notification owner
                io.to(socket.id).emit('notification:deleted', { notificationId });
            } catch (error) {
                console.error('Error deleting notification via socket:', error);
            }
        });

        // --- Connection request ---
        socket.on('connection:request', ({ connection }) => {
            console.log('Connection request received:', connection);
            
            // Emit to the sender
            const receiverSocketId = connectedUsers.get(connection.receiver_id);
            if (receiverSocketId) {
                io.to(receiverSocketId).emit('connection:request', { connection });
            }
        });
    });
}; 