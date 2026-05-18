import { useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { socketService } from '../services/socketService';

export function useProfileRealtime(onChange: (payload: any) => void) {
  const dispatch = useRef<any>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const setupSocket = () => {
      // Clean up any existing retry timeout
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }

      try {
        // Connect to Socket.io for real-time updates
        if (!socketService.socket) {
          socketService.connect();
        }

        // Listen for profile changes
        const handleProfileChange = (payload: any) => {
          console.log('Profile change received:', payload);
          onChange(payload);
        };

        // Listen for user updates
        const handleUserUpdate = (payload: any) => {
          console.log('User update received:', payload);
          onChange(payload);
        };

        // Add event listeners
        socketService.socket?.on('profile:updated', handleProfileChange);
        socketService.socket?.on('user:updated', handleUserUpdate);

        // Handle connection errors and retry
        const handleConnectError = (error: any) => {
          console.warn('Socket.io connection error:', error);
          
          // Retry after 5 seconds
          if (retryTimeoutRef.current) {
            clearTimeout(retryTimeoutRef.current);
          }
          
          retryTimeoutRef.current = setTimeout(() => {
            setupSocket();
          }, 5000);
        };

        const handleDisconnect = () => {
          console.warn('Socket.io disconnected. Retrying in 5 seconds...');
          
          // Retry after 5 seconds
          if (retryTimeoutRef.current) {
            clearTimeout(retryTimeoutRef.current);
          }
          
          retryTimeoutRef.current = setTimeout(() => {
            setupSocket();
          }, 5000);
        };

        socketService.socket?.on('connect_error', handleConnectError);
        socketService.socket?.on('disconnect', handleDisconnect);

        console.log('Realtime profile subscription set up successfully');
      } catch (error) {
        console.error('Error setting up realtime profile subscription:', error);
        // Retry after 5 seconds
        if (retryTimeoutRef.current) {
          clearTimeout(retryTimeoutRef.current);
        }
        
        retryTimeoutRef.current = setTimeout(() => {
          setupSocket();
        }, 5000);
      }
    };

    setupSocket();

    return () => {
      // Clean up event listeners
      if (socketService.socket) {
        socketService.socket.off('profile:updated');
        socketService.socket.off('user:updated');
        socketService.socket.off('connect_error');
        socketService.socket.off('disconnect');
      }

      // Clean up retry timeout
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [onChange]);
} 