import { useEffect, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import socketService from '../services/socketService';

export const PresenceSubscriber = () => {
  const dispatch = useAppDispatch();
  const authUser = useAppSelector(state => state.auth.user);
  const idleTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const currentStatusRef = useRef<'online' | 'idle'>('online');
  const [retryCount, setRetryCount] = useState(0);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Track user activity
  const updateActivity = () => {
    const now = Date.now();
    lastActivityRef.current = now;

    // Clear existing idle timeout
    if (idleTimeoutRef.current) {
      clearTimeout(idleTimeoutRef.current);
    }

    // Update activity on server
    socketService.updatePresenceActivity();

    // Only update presence if status was idle and now becoming online
    if (currentStatusRef.current === 'idle') {
      currentStatusRef.current = 'online';
      socketService.updatePresenceStatus('online');
    }

    // Set new idle timeout (1 minute for testing)
    idleTimeoutRef.current = setTimeout(() => {
      if (currentStatusRef.current === 'online') {
        currentStatusRef.current = 'idle';
        socketService.updatePresenceStatus('idle');
      }
    }, 1 * 60 * 1000); // 1 minute for testing
  };

  // Activity event listeners
  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];

    events.forEach(event => {
      document.addEventListener(event, updateActivity, true);
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, updateActivity, true);
      });
    };
  }, []);

  useEffect(() => {
    if (!authUser) return;

    // Initialize presence when user is authenticated
    // The socket connection and presence sync will be handled by socketService
    console.log('PresenceSubscriber initialized for user:', authUser.id);

    return () => {
      if (idleTimeoutRef.current) {
        clearTimeout(idleTimeoutRef.current);
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [authUser]);

  return null;
}; 