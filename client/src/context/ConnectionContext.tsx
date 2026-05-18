import  { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Connection, ConnectionState } from '../types';
import { useAuth } from './AuthContext';
import { connectionsAPI } from '../services/api';

interface ConnectionContextType {
  connections: Connection[];
  requests: Connection[];
  sendConnectionRequest: (senderId: string, receiverId: string) => Promise<void>;
  acceptConnection: (connectionId: string) => Promise<void>;
  rejectConnection: (connectionId: string) => Promise<void>;
  removeConnection: (connectionId: string) => Promise<void>;
  getConnectionStatus: (userId: string) => 'none' | 'pending' | 'accepted' | 'incoming';
  isLoading: boolean;
}

const ConnectionContext = createContext<ConnectionContextType | undefined>(undefined);

export const ConnectionProvider = ({ children }: { children: ReactNode }) => {
  const { auth } = useAuth();
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    connections: []
  });
  const [isLoading, setIsLoading] = useState(true);

  // Load connections from server
  useEffect(() => {
    const loadConnections = async () => {
      if (!auth.isAuthenticated) {
        setConnectionState({ connections: [] });
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const connections = await connectionsAPI.getConnections();
        setConnectionState({ connections });
      } catch (error) {
        console.error('Failed to load connections:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadConnections();
  }, [auth.isAuthenticated]);

  const sendConnectionRequest = async (senderId: string, receiverId: string) => {
    setIsLoading(true);
    try {
      const newConnection = await connectionsAPI.createConnection({
        senderId,
        receiverId,
        status: 'pending'
      });

      if (newConnection) {
        setConnectionState(prev => ({
          connections: [...prev.connections, newConnection]
        }));
      } else {
        throw new Error('Failed to create connection');
      }
    } catch (error) {
      console.error('Error sending connection request:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const acceptConnection = async (connectionId: string) => {
    setIsLoading(true);
    try {
      const updatedConnection = await connectionsAPI.updateConnection(connectionId, 'accepted');
      
      if (updatedConnection) {
        setConnectionState(prev => ({
          connections: prev.connections.map(conn => 
            conn.id === connectionId ? updatedConnection : conn
          )
        }));
      } else {
        throw new Error('Failed to accept connection');
      }
    } catch (error) {
      console.error('Error accepting connection:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const rejectConnection = async (connectionId: string) => {
    setIsLoading(true);
    try {
      const updatedConnection = await connectionsAPI.updateConnection(connectionId, 'rejected');
      
      if (updatedConnection) {
        setConnectionState(prev => ({
          connections: prev.connections.map(conn => 
            conn.id === connectionId ? updatedConnection : conn
          )
        }));
      } else {
        throw new Error('Failed to reject connection');
      }
    } catch (error) {
      console.error('Error rejecting connection:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const removeConnection = async (connectionId: string) => {
    setIsLoading(true);
    try {
      const success = await connectionsAPI.deleteConnection(connectionId);
      
      if (success) {
        setConnectionState(prev => ({
          connections: prev.connections.filter(conn => conn.id !== connectionId)
        }));
      } else {
        throw new Error('Failed to remove connection');
      }
    } catch (error) {
      console.error('Error removing connection:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const getConnectionStatus = (userId: string): 'none' | 'pending' | 'accepted' | 'incoming' => {
    if (!auth.user) return 'none';

    const connection = connectionState.connections.find(conn => 
      (conn.senderId === auth.user!.id && conn.receiverId === userId) || 
      (conn.senderId === userId && conn.receiverId === auth.user!.id)
    );

    if (!connection) return 'none';
    
    if (connection.status === 'accepted') return 'accepted';
    if (connection.senderId === auth.user!.id) return 'pending';
    return 'incoming';
  };

  // Compute requests - connections that are pending and the current user is the receiver
  const requests = auth.user 
    ? connectionState.connections.filter(conn => 
        conn.receiverId === auth.user!.id && 
        conn.status === 'pending'
      )
    : [];

  return (
    <ConnectionContext.Provider value={{
      connections: connectionState.connections,
      requests,
      sendConnectionRequest,
      acceptConnection,
      rejectConnection,
      removeConnection,
      getConnectionStatus,
      isLoading
    }}>
      {children}
    </ConnectionContext.Provider>
  );
};

export const useConnections = () => {
  const context = useContext(ConnectionContext);
  if (context === undefined) {
    throw new Error('useConnections must be used within a ConnectionProvider');
  }
  return context;
};
 