import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '..';
import { Message } from '../../types';
import { fetchConnectedUsers as fetchConnectedUsersApi, loadMessages as loadMessagesApi, markAsRead as markAsReadApi, sendMessage as sendMessageApi, deleteMessage as deleteMessageApi, editMessage as editMessageApi, fetchUnreadMessageCounts as fetchUnreadMessageCountsApi } from '../../api/messageApi';

// Extend Message type for local Redux use
export type MessageWithMeta = Message & {
    deleted?: boolean;
    reactions?: string[];
};

interface MessageState {
    messages: { [userId: string]: MessageWithMeta[] };
    hasNewMessages: boolean;
    lastMessageTime: string | null;
    isConnected: boolean;
    typingUsers: { [userId: string]: boolean };
    connectedUsers: Array<{ userId: string; userName: string; lastMessageTime: string; photo_url: string; email?: string; lastMessage: string; unReadCount: number }>;
    hasMoreMessages: boolean;
    loadingUsers: boolean;
    unreadCounts: { [userId: string]: number };
    activeChatUserId: string | null;
    editingMessageId: string | null;
}

const initialState: MessageState = {
    messages: {},
    hasNewMessages: false,
    lastMessageTime: null,
    isConnected: false,
    typingUsers: {},
    connectedUsers: [],
    hasMoreMessages: false,
    loadingUsers: false,
    unreadCounts: {},
    activeChatUserId: null,
    editingMessageId: null,
};

// Async thunks
export const sendMessage = createAsyncThunk(
    'messages/sendMessage',
    async ({ receiverId, content, imageUrl }: { receiverId: string; content: string; imageUrl?: string }) => {
        return await sendMessageApi(receiverId, content, imageUrl);
    }
);

export const markAsRead = createAsyncThunk(
    'messages/markAsRead',
    async (userId: string) => {
        return await markAsReadApi(userId);
    }
);

export const fetchConnectedUsers = createAsyncThunk(
    'messages/fetchConnectedUsers',
    async () => {
        return await fetchConnectedUsersApi();
    }
);

export const loadMessages = createAsyncThunk(
    'messages/loadMessages',
    async ({ userId, page = 1, limit = 50 }: { userId: string; page?: number; limit?: number }) => {
        return await loadMessagesApi(userId, page, limit);
    }
);

export const fetchUnreadMessageCounts = createAsyncThunk(
    'messages/fetchUnreadMessageCounts',
    async (userId: string, { dispatch }) => {
        const counts = await fetchUnreadMessageCountsApi();

        // Dispatch setUnreadCount for each sender
        Object.entries(counts).forEach(([senderId, count]) => {
            dispatch(messageSlice.actions.setUnreadCount({ userId: senderId, count: count as number }));
        });

        return counts;
    }
);

export const editMessage = createAsyncThunk(
    'messages/editMessage',
    async ({ messageId, content }: { messageId: string; content: string }) => {
        return await editMessageApi(messageId, content);
    }
);

export const deleteMessage = createAsyncThunk(
    'messages/deleteMessage',
    async (messageId: string) => {
        return await deleteMessageApi(messageId);
    }
);

const messageSlice = createSlice({
    name: 'messages',
    initialState,
    reducers: {
        setActiveChatUserId: (state, action: PayloadAction<string | null>) => {
            state.activeChatUserId = action.payload;
        },
        addUserToConnectedUsers: (state, action: PayloadAction<{ userId: string; userName: string; photo_url?: string }>) => {
            const { userId, userName, photo_url } = action.payload;
            let user = state.connectedUsers.find(u => u.userId === userId);
            
            if (!user) {
                // Add user to the beginning of the list to show them at the top
                user = {
                    userId,
                    userName,
                    photo_url: photo_url || '',
                    lastMessageTime: new Date().toISOString(),
                    lastMessage: '',
                    unReadCount: 0
                };
                state.connectedUsers.unshift(user); // Add to beginning of array
            }
        },
        addMessage: (state, action: PayloadAction<{ message: MessageWithMeta, userId: string }>) => {
            console.log('Adding message to state:', action.payload);
            const message = action.payload.message;
            const userId = action.payload.userId;

            if (!state.messages[userId]) {
                state.messages[userId] = [];
            }

            state.messages[userId].push(message);
            state.hasNewMessages = true;
            state.lastMessageTime = message.created_at;
        },
        updateMessageStatus: (state, action: PayloadAction<MessageWithMeta>) => {
            console.log('Updating message status:', action.payload);
            const message = action.payload;
            const userId = message.receiver_id;

            if (state.messages[userId]) {
                const index = state.messages[userId].findIndex(m => m.id === message.id);
                if (index !== -1) {
                    state.messages[userId][index] = message;
                }
            }
        },
        setTyping: (state, action: PayloadAction<{ userId: string; isTyping: boolean }>) => {
            const { userId, isTyping } = action.payload;
            state.typingUsers[userId] = isTyping;
        },
        updateLastMessage: (state, action: PayloadAction<{ userId: string, message: MessageWithMeta }>) => {
            const { userId, message } = action.payload;
            let user = state.connectedUsers.find(u => u.userId === userId);
            
            if (!user) {
                // User not in connectedUsers, add them with default values
                console.log('User not found in connectedUsers for updateLastMessage, adding them');
                user = {
                    userId,
                    userName: userId, // Will be updated when fetchConnectedUsers is called
                    lastMessageTime: message.created_at,
                    photo_url: '',
                    lastMessage: message.content,
                    unReadCount: 0
                };
                state.connectedUsers.push(user);
            } else {
                user.lastMessage = message.content;
                user.lastMessageTime = message.created_at;
            }
        },
        updateUnreadCount: (state, action: PayloadAction<{ userId: string, count: number }>) => {
            const { userId, count } = action.payload;
            const user = state.connectedUsers.find(u => u.userId === userId);
            if (user) {
                user.unReadCount = count;
            }
            state.unreadCounts[userId] = count;
        },
        incrementUnreadCount: (state, action: PayloadAction<{ userId: string }>) => {
            const { userId } = action.payload;
            console.log('incrementUnreadCount called for:', userId);
            let user = state.connectedUsers.find(u => u.userId === userId);
            console.log('Found user in connectedUsers:', user);
            
            if (!user) {
                // User not in connectedUsers, add them with default values
                console.log('User not found in connectedUsers, adding them');
                user = {
                    userId,
                    userName: userId, // Will be updated when fetchConnectedUsers is called
                    lastMessageTime: new Date().toISOString(),
                    photo_url: '',
                    lastMessage: '',
                    unReadCount: 0
                };
                state.connectedUsers.push(user);
            }
            
            console.log('Previous unread count:', user.unReadCount);
            user.unReadCount += 1;
            console.log('New unread count:', user.unReadCount);
            state.unreadCounts[userId] = (state.unreadCounts[userId] || 0) + 1;
            console.log('unreadCounts updated:', state.unreadCounts[userId]);
        },
        setUnreadCount: (state, action: PayloadAction<{ userId: string, count: number }>) => {
            state.unreadCounts[action.payload.userId] = action.payload.count;
        },
        resetUnreadCount: (state, action: PayloadAction<{ userId: string }>) => {
            state.unreadCounts[action.payload.userId] = 0;
            const user = state.connectedUsers.find(u => u.userId === action.payload.userId);
            if (user) {
                user.unReadCount = 0;
            }
        },
        clearNewMessages: (state) => {
            state.hasNewMessages = false;
        },
        setEditingMessageId: (state, action: PayloadAction<string | null>) => {
            state.editingMessageId = action.payload;
        },
        addReaction: (state, action: PayloadAction<{ userId: string, reaction: string }>) => {
            const { userId, reaction } = action.payload;
            const message = state.messages[userId].find(m => m.id === state.editingMessageId);
            if (message) {
                message.reactions = [...(message.reactions || []), reaction];
            }
        },
        removeReaction: (state, action: PayloadAction<{ userId: string, reaction: string }>) => {
            const { userId, reaction } = action.payload;
            const message = state.messages[userId].find(m => m.id === state.editingMessageId);
            if (message) {
                message.reactions = message.reactions?.filter(r => r !== reaction) || [];
            }
        },
        removeMessage: (state, action: PayloadAction<string>) => {
            const deletedMessageId = action.payload;
            // Remove the message from all conversation arrays
            Object.keys(state.messages).forEach(userId => {
                state.messages[userId] = state.messages[userId].filter(m => m.id !== deletedMessageId);
            });
        },
        updateMessageReadStatus: (state, action: PayloadAction<{ userId: string, messageIds: string[], status: 'read' | 'delivered' }>) => {
            const { userId, messageIds, status } = action.payload;
            if (state.messages[userId]) {
                state.messages[userId].forEach(message => {
                    if (messageIds.includes(message.id)) {
                        if (status === 'read') {
                            message.read_at = new Date().toISOString();
                            message.status = 'read';
                        }
                    }
                });
            }
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(sendMessage.fulfilled, (state, action) => {
                const message = action.payload;
                const userId = message.receiver_id;

                if (!state.messages[userId]) {
                    state.messages[userId] = [];
                }

                state.messages[userId].push(message);
                state.lastMessageTime = message.created_at;
            })
            .addCase(markAsRead.fulfilled, (state, action) => {
                const messages = action.payload;
                messages.forEach((message: Message) => {
                    const userId = message.sender_id;
                    if (state.messages[userId]) {
                        const index = state.messages[userId].findIndex(m => m.id === message.id);
                        if (index !== -1) {
                            state.messages[userId][index] = message;
                        }
                    }
                });
            })
            .addCase(fetchConnectedUsers.pending, (state, action) => {
                state.loadingUsers = true;
            })
            .addCase(fetchConnectedUsers.fulfilled, (state, action) => {
                // Merge new data with existing real-time updates
                const newConnectedUsers = action.payload;
                const existingUsers = state.connectedUsers;
                
                // Create a map of existing users for quick lookup
                const existingUsersMap = new Map();
                existingUsers.forEach(user => {
                    existingUsersMap.set(user.userId, user);
                });
                
                // Merge new users with existing real-time updates
                state.connectedUsers = newConnectedUsers.map(newUser => {
                    const existingUser = existingUsersMap.get(newUser.userId);
                    if (existingUser) {
                        // Preserve real-time updates (unread count, last message, etc.)
                        return {
                            ...newUser,
                            unReadCount: existingUser.unReadCount,
                            lastMessage: existingUser.lastMessage,
                            lastMessageTime: existingUser.lastMessageTime
                        };
                    }
                    return newUser;
                });
                state.loadingUsers = false;
            })
            .addCase(loadMessages.fulfilled, (state, action) => {
                const { userId, messages, hasMore, page } = action.payload;

                if (page === 1) {
                    // First page - replace messages
                    state.messages[userId] = messages;
                } else {
                    // Subsequent pages - prepend messages (since we're loading older messages)
                    if (!state.messages[userId]) {
                        state.messages[userId] = [];
                    }
                    state.messages[userId] = [...messages, ...state.messages[userId]];
                }

                state.hasMoreMessages = hasMore;
            })
            .addCase(editMessage.fulfilled, (state, action) => {
                const updatedMessage = action.payload;
                console.log('updated Message', updatedMessage)
                // Find and update the message in all conversation arrays
                Object.keys(state.messages).forEach(userId => {
                    const messageIndex = state.messages[userId].findIndex(m => m.id === updatedMessage.id);
                    if (messageIndex !== -1) {
                        state.messages[userId][messageIndex] = updatedMessage;
                    }
                });
            })
            .addCase(deleteMessage.fulfilled, (state, action) => {
                const deletedMessageId = action.payload;
                // Remove the message from all conversation arrays
                Object.keys(state.messages).forEach(userId => {
                    state.messages[userId] = state.messages[userId].filter(m => m.id !== deletedMessageId);
                });
            });
    }
});

// Selectors
export const selectMessages = (state: RootState) => state.messages.messages;
export const selectHasNewMessages = (state: RootState) => state.messages.hasNewMessages;
export const selectLastMessageTime = (state: RootState) => state.messages.lastMessageTime;
export const selectIsConnected = (state: RootState) => state.messages.isConnected;
export const selectIsTyping = (state: RootState) => state.messages.typingUsers;
export const selectActiveChatUserId = (state: RootState) => state.messages.activeChatUserId;

export const { addMessage, updateMessageStatus, setTyping, updateLastMessage, updateUnreadCount, incrementUnreadCount, setUnreadCount, resetUnreadCount, clearNewMessages, setActiveChatUserId, setEditingMessageId, addReaction, removeReaction, removeMessage, updateMessageReadStatus, addUserToConnectedUsers } = messageSlice.actions;

export default messageSlice.reducer; 