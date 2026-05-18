import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '..';
import { ConnectionStatus } from '../../types';
import { Connection } from '../../types';
import { createNotification } from './notificationSlice';
import { fetchConnectedConnections as fetchConnectedConnectionsApi, fetchPendingConnections as fetchPendingConnectionsApi, fetchSentConnections as fetchSentConnectionsApi, fetchRejectedConnections as fetchRejectedConnectionsApi, fetchConnectionStatuses as fetchConnectionStatusesApi, sendConnectionRequest as sendConnectionRequestApi, acceptConnectionRequest as acceptConnectionRequestApi, rejectConnectionRequest as rejectConnectionRequestApi, removeConnection as removeConnectionApi, fetchUserConnectedConnections as fetchUserConnectedConnectionsApi } from '../../api/connectionApi';

interface ConnectionState {
  connections: Connection[];
  pendingConnections: Connection[];
  sentConnections: Connection[];
  rejectedConnections: Connection[];
  connectionStatuses: Record<string, ConnectionStatus | null>;
  status: {
    sendRequest: 'idle' | 'pending' | 'fulfilled' | 'rejected';
    acceptRequest: 'idle' | 'pending' | 'fulfilled' | 'rejected';
    rejectRequest: 'idle' | 'pending' | 'fulfilled' | 'rejected';
    removeConnection: 'idle' | 'pending' | 'fulfilled' | 'rejected';
    fetchStatuses: 'idle' | 'pending' | 'fulfilled' | 'rejected';
  };
  error: string | null;
  userConnectionsById: Record<string, Connection[]>;
}

const initialState: ConnectionState = {
  connections: [],
  pendingConnections: [],
  sentConnections: [],
  rejectedConnections: [],
  connectionStatuses: {},
  status: {
    sendRequest: 'idle',
    acceptRequest: 'idle',
    rejectRequest: 'idle',
    removeConnection: 'idle',
    fetchStatuses: 'idle'
  },
  error: null,
  userConnectionsById: {}
};

// Async thunks
export const sendConnectionRequest = createAsyncThunk(
  'connections/sendRequest',
  async (receiverId: string) => {
    return await sendConnectionRequestApi(receiverId);
  }
);

export const acceptConnectionRequest = createAsyncThunk(
  'connections/acceptRequest',
  async (connectionId: string, { getState, dispatch }) => {
    const connection = await acceptConnectionRequestApi(connectionId);
    
    // Send notification to sender
    if (connection && connection.sender && connection.receiver) {
      dispatch(createNotification({
        type: 'connection',
        from_user_id: connection.receiver.id, // the user who accepted
        to_user_id: connection.sender.id, // the user who sent the request
        content: `${connection.receiver.username || 'A user'} accepted your connection request!`,
        metadata: { connection_id: connection.id },
      }));
    }

    return connection;
  }
);

export const rejectConnectionRequest = createAsyncThunk(
  'connections/rejectRequest',
  async (connectionId: string) => {
    return await rejectConnectionRequestApi(connectionId);
  }
);

export const removeConnection = createAsyncThunk(
  'connections/remove',
  async (connectionId: string) => {
    return await removeConnectionApi(connectionId);
  }
);

export const fetchConnectionStatuses = createAsyncThunk(
  'connections/fetchStatuses',
  async (userIds: string[]) => {
    return await fetchConnectionStatusesApi(userIds);
  }
);

// Fetch connected connections with sender/receiver profiles
export const fetchConnectedConnections = createAsyncThunk(
  'connections/fetchConnected',
  async () => {
    return await fetchConnectedConnectionsApi();
  }
);

// Fetch pending connections (user is receiver, status is pending)
export const fetchPendingConnections = createAsyncThunk(
  'connections/fetchPending',
  async () => {
    return await fetchPendingConnectionsApi();
  }
);

// Fetch sent connections (user is sender, status is pending)
export const fetchSentConnections = createAsyncThunk(
  'connections/fetchSent',
  async () => {
    return await fetchSentConnectionsApi();
  }
);

// Fetch rejected connections (user is sender or receiver, status is rejected)
export const fetchRejectedConnections = createAsyncThunk(
  'connections/fetchRejected',
  async () => {
    return await fetchRejectedConnectionsApi();
  }
);

// Fetch connected connections for any userId (not just current user)
export const fetchUserConnectedConnections = createAsyncThunk(
  'connections/fetchUserConnectedConnections',
  async (userId: string) => {
    return await fetchUserConnectedConnectionsApi(userId);
  }
);

const connectionSlice = createSlice({
  name: 'connections',
  initialState,
  reducers: {
    setConnections: (state, action: PayloadAction<Connection[]>) => {
      state.connections = action.payload;
    },
    setPendingConnections: (state, action: PayloadAction<Connection[]>) => {
      state.pendingConnections = action.payload;
    },
    addConnection: (state, action: PayloadAction<Connection>) => {
      state.connections.push(action.payload);
    },
    updateConnection: (state, action: PayloadAction<Connection>) => {
      const index = state.connections.findIndex(c => c.id === action.payload.id);
      if (index !== -1) {
        state.connections[index] = action.payload;
      }
    },
    removeConnectionFromState: (state, action: PayloadAction<string>) => {
      state.connections = state.connections.filter(c => c.id !== action.payload);
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Send Request
      .addCase(sendConnectionRequest.pending, (state) => {
        state.status.sendRequest = 'pending';
        state.error = null;
      })
      .addCase(sendConnectionRequest.fulfilled, (state, action) => {
        state.status.sendRequest = 'fulfilled';
        state.pendingConnections.push(action.payload);
      })
      .addCase(sendConnectionRequest.rejected, (state, action) => {
        state.status.sendRequest = 'rejected';
        state.error = action.error.message || 'Failed to send connection request';
      })
      // Accept Request
      .addCase(acceptConnectionRequest.pending, (state) => {
        state.status.acceptRequest = 'pending';
        state.error = null;
      })
      .addCase(acceptConnectionRequest.fulfilled, (state, action) => {
        state.status.acceptRequest = 'fulfilled';
        state.pendingConnections = state.pendingConnections.filter(c => c.id !== action.payload.id);
        state.connections.push(action.payload);
      })
      .addCase(acceptConnectionRequest.rejected, (state, action) => {
        state.status.acceptRequest = 'rejected';
        state.error = action.error.message || 'Failed to accept connection request';
      })
      // Reject Request
      .addCase(rejectConnectionRequest.pending, (state) => {
        state.status.rejectRequest = 'pending';
        state.error = null;
      })
      .addCase(rejectConnectionRequest.fulfilled, (state, action) => {
        state.status.rejectRequest = 'fulfilled';
        state.pendingConnections = state.pendingConnections.filter(c => c.id !== action.payload.id);
      })
      .addCase(rejectConnectionRequest.rejected, (state, action) => {
        state.status.rejectRequest = 'rejected';
        state.error = action.error.message || 'Failed to reject connection request';
      })
      // Remove Connection
      .addCase(removeConnection.pending, (state) => {
        state.status.removeConnection = 'pending';
        state.error = null;
      })
      .addCase(removeConnection.fulfilled, (state, action) => {
        state.status.removeConnection = 'fulfilled';
        state.connections = state.connections.filter(c => c.id !== action.payload);
      })
      .addCase(removeConnection.rejected, (state, action) => {
        state.status.removeConnection = 'rejected';
        state.error = action.error.message || 'Failed to remove connection';
      })
      .addCase(fetchConnectionStatuses.pending, (state) => {
        state.status.fetchStatuses = 'pending';
        state.error = null;
      })
      .addCase(fetchConnectionStatuses.fulfilled, (state, action) => {
        state.status.fetchStatuses = 'fulfilled';
        state.connectionStatuses = {
          ...state.connectionStatuses,
          ...action.payload
        };
      })
      .addCase(fetchConnectionStatuses.rejected, (state, action) => {
        state.status.fetchStatuses = 'rejected';
        state.error = action.error.message || 'Failed to fetch connection statuses';
      })
      .addCase(fetchConnectedConnections.pending, (state) => {
        state.status.fetchStatuses = 'pending';
        state.error = null;
      })
      .addCase(fetchConnectedConnections.fulfilled, (state, action) => {
        state.status.fetchStatuses = 'fulfilled';
        state.connections = action.payload;
      })
      .addCase(fetchConnectedConnections.rejected, (state, action) => {
        state.status.fetchStatuses = 'rejected';
        state.error = action.error.message || 'Failed to fetch connected connections';
      })
      .addCase(fetchPendingConnections.fulfilled, (state, action) => {
        state.pendingConnections = action.payload;
      })
      .addCase(fetchSentConnections.fulfilled, (state, action) => {
        state.sentConnections = action.payload;
      })
      .addCase(fetchRejectedConnections.fulfilled, (state, action) => {
        state.rejectedConnections = action.payload;
      })
      .addCase(fetchUserConnectedConnections.fulfilled, (state, action) => {
        // action.meta.arg is the userId
        const userId = action.meta.arg;
        state.userConnectionsById[userId] = action.payload || [];
      });
  }
});

export const {
  setConnections,
  setPendingConnections,
  addConnection,
  updateConnection,
  removeConnectionFromState,
  clearError
} = connectionSlice.actions;

// Selectors
export const selectConnections = (state: RootState) => state.connections.connections;
export const selectPendingConnections = (state: RootState) => state.connections.pendingConnections;
export const selectConnectionStatus = (state: RootState) => state.connections.status;
export const selectConnectionError = (state: RootState) => state.connections.error;
export const selectConnectionStatuses = (state: RootState) => state.connections.connectionStatuses;
export const selectUserConnectionStatus = (userId: string) => (state: RootState) =>
  state.connections.connectionStatuses[userId] || null;
export const selectConnectedConnections = (state: RootState) => state.connections.connections;
export const selectSentConnections = (state: RootState) => state.connections.sentConnections;
export const selectRejectedConnections = (state: RootState) => state.connections.rejectedConnections;

export default connectionSlice.reducer; 