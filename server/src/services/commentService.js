const { getDatabase } = require('../config/database');
const { UUID } = require('mongodb');

// Socket.io instance (will be set from outside)
let io = null;

// Function to set Socket.io instance
const setSocketIO = (socketIO) => {
    io = socketIO;
};

exports.getCommentsByActivityId = async (activityId) => {
    try {
        const db = await getDatabase();
        const commentsCollection = db.collection('activity_comments');
        const profilesCollection = db.collection('profiles');
        
        // Convert string ID to UUID if needed
        let activityIdUUID;
        try {
            activityIdUUID = new UUID(activityId);
        } catch (uuidError) {
            // If not a valid UUID, use string directly (for ObjectId)
            activityIdUUID = activityId;
        }
        
        const comments = await commentsCollection.find({
            activity_id: activityIdUUID
        })
        .sort({ created_at: 1 })
        .toArray();
        
        // Fetch user profiles for each comment
        const commentsWithUsers = await Promise.all(
            comments.map(async (comment) => {
                let userIdUUID;
                try {
                    userIdUUID = new UUID(comment.user_id);
                } catch (uuidError) {
                    userIdUUID = comment.user_id;
                }
                
                const userProfile = await profilesCollection.findOne({ _id: userIdUUID });
                return {
                    ...comment,
                    id: comment._id.toString(),
                    activity_id: comment.activity_id.toString(),
                    user_id: comment.user_id.toString(),
                    user: userProfile ? {
                        ...userProfile,
                        id: userProfile._id.toString()
                    } : null
                };
            })
        );
        
        return commentsWithUsers;
    } catch (error) {
        console.error('Error in getCommentsByActivityId:', error);
        throw error;
    }
};

exports.getCommentById = async (commentId) => {
    try {
        const db = await getDatabase();
        const commentsCollection = db.collection('activity_comments');
        const profilesCollection = db.collection('profiles');
        
        // Convert string ID to UUID if needed
        let commentIdUUID;
        try {
            commentIdUUID = new UUID(commentId);
        } catch (uuidError) {
            // If not a valid UUID, use string directly (for ObjectId)
            commentIdUUID = commentId;
        }
        
        const comment = await commentsCollection.findOne({ _id: commentIdUUID });
        
        if (!comment) {
            throw new Error('Comment not found');
        }
        
        // Fetch user profile
        let userIdUUID;
        try {
            userIdUUID = new UUID(comment.user_id);
        } catch (uuidError) {
            userIdUUID = comment.user_id;
        }
        
        const userProfile = await profilesCollection.findOne({ _id: userIdUUID });
        
        return {
            ...comment,
            id: comment._id.toString(),
            activity_id: comment.activity_id.toString(),
            user_id: comment.user_id.toString(),
            user: userProfile ? {
                ...userProfile,
                id: userProfile._id.toString()
            } : null
        };
    } catch (error) {
        console.error('Error in getCommentById:', error);
        throw error;
    }
};

exports.createComment = async (userId, activityId, content) => {
    try {
        const db = await getDatabase();
        const commentsCollection = db.collection('activity_comments');
        const activitiesCollection = db.collection('activities');
        const profilesCollection = db.collection('profiles');
        const settingsCollection = db.collection('settings');
        
        // Convert string IDs to UUID objects if needed
        let userIdUUID, activityIdUUID;
        try {
            userIdUUID = new UUID(userId);
            activityIdUUID = new UUID(activityId);
        } catch (uuidError) {
            // If not valid UUIDs, use strings directly (for ObjectId)
            userIdUUID = userId;
            activityIdUUID = activityId;
        }
        
        // Generate new UUID for the comment
        const commentId = new UUID();
        
        const newComment = {
            _id: commentId,
            activity_id: activityIdUUID,
            user_id: userIdUUID,
            content,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        
        const result = await commentsCollection.insertOne(newComment);
        const createdComment = { ...newComment, _id: result.insertedId };
        
        // Fetch user profile for the created comment
        const userProfile = await profilesCollection.findOne({ _id: userIdUUID });
        
        const commentWithUser = {
            ...createdComment,
            id: createdComment._id.toString(),
            activity_id: createdComment.activity_id.toString(),
            user_id: createdComment.user_id.toString(),
            user: userProfile ? {
                ...userProfile,
                id: userProfile._id.toString()
            } : null
        };
        
        // Create notification for comment
        try {
            // Get activity details
            const activityData = await activitiesCollection.findOne({ _id: activityIdUUID });
            
            if (activityData) {
                // Get commenter's name
                const userData = await profilesCollection.findOne({ _id: userIdUUID });
                
                if (userData) {
                    // Check if activity creator has comment notifications enabled
                    // Get the activity creator's email to check their settings
                    const creatorProfile = await profilesCollection.findOne({ 
                        _id: activityData.creator_id 
                    });
                    
                    if (creatorProfile) {
                        const settingsData = await settingsCollection.findOne({ 
                            email: creatorProfile.email 
                        });
                        
                        // Default to true if no settings found or if enabled
                        const notificationsEnabled = !settingsData || settingsData.comment_notifications !== 'false';
                        
                        if (notificationsEnabled && activityData.creator_id.toString() !== userId) {
                            // Create notification using 'activity' type
                            const notificationsCollection = db.collection('notifications');
                            
                            // Convert string IDs to UUID objects if needed
                            let creatorIdUUID;
                            try {
                                creatorIdUUID = new UUID(activityData.creator_id);
                            } catch (uuidError) {
                                creatorIdUUID = activityData.creator_id;
                            }
                            
                            const notification = {
                                type: 'activity',
                                from_user_id: userIdUUID,
                                to_user_id: creatorIdUUID,
                                content: `${userData.name} commented on your activity "${activityData.title}"`,
                                metadata: {
                                    comment_id: createdComment._id.toString(),
                                    activity_id: activityId,
                                    activity_title: activityData.title,
                                    is_comment: true
                                },
                                read: false,
                                created_at: new Date().toISOString(),
                                updated_at: new Date().toISOString()
                            };
                            
                            const notificationResult = await notificationsCollection.insertOne(notification);
                            const createdNotification = { ...notification, _id: notificationResult.insertedId };
                            
                            // Send real-time notification via Socket.io
                            if (io) {
                                const clientNotification = {
                                    ...createdNotification,
                                    id: createdNotification._id.toString(),
                                    from_user_id: createdNotification.from_user_id.toString(),
                                    to_user_id: createdNotification.to_user_id.toString()
                                };
                                
                                io.to(activityData.creator_id.toString()).emit('notification:new', clientNotification);
                            }
                        }
                    }
                }
            }
        } catch (notificationError) {
            console.error('Error creating comment notification:', notificationError);
            // Don't throw error to avoid breaking comment creation
        }
        
        return commentWithUser;
    } catch (error) {
        console.error('Error in createComment:', error);
        throw error;
    }
};

exports.updateComment = async (commentId, userId, content) => {
    try {
        const db = await getDatabase();
        const commentsCollection = db.collection('activity_comments');
        
        // Convert string IDs to UUID objects if needed
        let commentIdUUID, userIdUUID;
        try {
            commentIdUUID = new UUID(commentId);
            userIdUUID = new UUID(userId);
        } catch (uuidError) {
            // If not valid UUIDs, use strings directly (for ObjectId)
            commentIdUUID = commentId;
            userIdUUID = userId;
        }
        
        // First check if the comment belongs to the current user
        const existingComment = await commentsCollection.findOne({
            _id: commentIdUUID,
            user_id: userIdUUID
        });
        
        if (!existingComment) {
            throw new Error('Comment not found or unauthorized');
        }
        
        // Update the comment
        const result = await commentsCollection.updateOne(
            { _id: commentIdUUID },
            { 
                $set: { 
                    content,
                    updated_at: new Date().toISOString()
                } 
            }
        );
        
        if (result.matchedCount === 0) {
            throw new Error('Comment not found');
        }
        
        // Get updated comment
        const updatedComment = await commentsCollection.findOne({ _id: commentIdUUID });
        
        return {
            ...updatedComment,
            id: updatedComment._id.toString(),
            activity_id: updatedComment.activity_id.toString(),
            user_id: updatedComment.user_id.toString()
        };
    } catch (error) {
        console.error('Error in updateComment:', error);
        throw error;
    }
};

exports.deleteComment = async (commentId, userId) => {
    try {
        const db = await getDatabase();
        const commentsCollection = db.collection('activity_comments');
        
        // Convert string IDs to UUID objects if needed
        let commentIdUUID, userIdUUID;
        try {
            commentIdUUID = new UUID(commentId);
            userIdUUID = new UUID(userId);
        } catch (uuidError) {
            // If not valid UUIDs, use strings directly (for ObjectId)
            commentIdUUID = commentId;
            userIdUUID = userId;
        }
        
        // First check if the comment belongs to the current user
        const existingComment = await commentsCollection.findOne({
            _id: commentIdUUID,
            user_id: userIdUUID
        });
        
        if (!existingComment) {
            throw new Error('Comment not found or unauthorized');
        }
        
        // Delete the comment
        const result = await commentsCollection.deleteOne({ _id: commentIdUUID });
        
        if (result.deletedCount === 0) {
            throw new Error('Failed to delete comment');
        }
        
        return { message: 'Comment deleted successfully' };
    } catch (error) {
        console.error('Error in deleteComment:', error);
        throw error;
    }
};

exports.setSocketIO = setSocketIO; 