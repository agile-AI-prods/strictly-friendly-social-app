import { useState } from 'react';
import { Button } from './Button';
import { ConnectionStatus } from '../types';
import { UserPlus, UserCheck, UserX, Loader2 } from 'lucide-react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { selectUserConnectionStatus, sendConnectionRequest, acceptConnectionRequest, rejectConnectionRequest, removeConnection } from '../store/slices/connectionSlice';
import { useAppDispatch } from '../store/hooks';
import { fetchFilteredProfiles } from '../store/slices/userSlice';
import SocketService from '../services/socketService';
import socketService from '../services/socketService';
import { useTheme } from '../context/ThemeContext';
interface ConnectionButtonProps {
  connectionId: string;
  senderId: string;
  receiverId: string;
  onStatusChange?: (status: ConnectionStatus | null) => void;
  className?: string;
  onConnect?: () => void;
  hasLabel?: boolean;
  status?: ConnectionStatus;
}

export const ConnectionButton = ({ connectionId, senderId, receiverId, onStatusChange, className, onConnect, hasLabel, status }: ConnectionButtonProps) => {
  const dispatch = useAppDispatch();
  const { currentColor } = useTheme();
  // const status = useSelector(selectUserConnectionStatus(senderId));
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const filterParams = useSelector((state: RootState) => state.users.filterParams);
  const [actionLoading, setActionLoading] = useState(false);

  const buildFilterParams = () => {
    if (!currentUser || !filterParams) return undefined;
    const { currentUserLocation, ...rest } = filterParams;
    let location = undefined;
    if (currentUserLocation &&
      typeof currentUserLocation.latitude === 'number' &&
      typeof currentUserLocation.longitude === 'number' &&
      typeof (currentUserLocation as any).city === 'string') {
      location = {
        latitude: currentUserLocation.latitude,
        longitude: currentUserLocation.longitude,
        city: (currentUserLocation as any).city as string
      };
    }
    return {
      currentUserId: currentUser.id,
      ...rest,
      ...(location ? { currentUserLocation: location } : {})
    };
  };

  const handleConnect = async () => {
    try {
      setActionLoading(true);
      const response = await dispatch(sendConnectionRequest(receiverId)).unwrap();
      console.log(response);
      SocketService.sendConnectionRequest(response);
      if (currentUser) {
        console.log('currentUser', currentUser);
        socketService.createNotification({
          to_user_id: receiverId,
          from_user_id: currentUser.id,
          type: 'connection',
          content: currentUser.name + ' wants to connect with you',
        });
      }
      onStatusChange?.('pending');
      // Refetch filtered users so the just-connected user disappears
      const params = buildFilterParams();
      if (params) {
        dispatch(fetchFilteredProfiles(params));
      }
      onConnect?.();
    } catch (error) {
      console.error('Error sending connection request:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAccept = async () => {
    try {
      setActionLoading(true);
      await dispatch(acceptConnectionRequest(connectionId)).unwrap();
      onStatusChange?.('accepted');
      const params = buildFilterParams();
      if (params) {
        dispatch(fetchFilteredProfiles(params));
      }
      onConnect?.();
    } catch (error) {
      console.error('Error accepting connection request:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    try {
      setActionLoading(true);
      await dispatch(rejectConnectionRequest(connectionId)).unwrap();
      onStatusChange?.('rejected');
      const params = buildFilterParams();
      if (params) {
        dispatch(fetchFilteredProfiles(params));
      }
      onConnect?.();
    } catch (error) {
      console.error('Error rejecting connection request:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemove = async () => {
    try {
      setActionLoading(true);
      await dispatch(removeConnection(senderId)).unwrap();
      onStatusChange?.(null);
      const params = buildFilterParams();
      if (params) {
        dispatch(fetchFilteredProfiles(params));
      }
      onConnect?.();
    } catch (error) {
      console.error('Error removing connection:', error);
    } finally {
      setActionLoading(false);
    }
  };

  if (!status) {
    return (
      <Button
        onClick={handleConnect}
        variant="primary"
        className={className || "w-full"}
        disabled={actionLoading}
      >
        {actionLoading ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <UserPlus className="h-4 w-4 mr-2" />
        )}
        {hasLabel ? "Connect" : ""}
      </Button>
    );
  }

  switch (status) {
    case 'pending':
      if (senderId === currentUser?.id) {
        // I sent the request
        return (
          <Button disabled variant="secondary" className={className || "w-full"}>
            <UserPlus className="h-4 w-4 mr-2" />
            {hasLabel ? "Request Sent" : ''}
          </Button>
        );
      } else if (receiverId === currentUser?.id) {
        // I received the request
        return (
          <div className="flex gap-2">
            <button
              onClick={handleAccept}
              className={`flex-1 bg-${currentColor.primary} text-white px-4 py-2 rounded-md hover:bg-${currentColor.hover}`}
              disabled={actionLoading}
            >
              {actionLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Accept
            </button>
            <button
              onClick={handleReject}
              className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300"
              disabled={actionLoading}
            >
              {actionLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Decline
            </button>
          </div>
        );
      }
      return null;
    case 'accepted':
      return (
        <Button
          onClick={handleRemove}
          variant="secondary"
          className={className || "w-full"}
          disabled={actionLoading}
        >
          {actionLoading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <UserCheck className="h-4 w-4 mr-2" />
          )}
          {hasLabel ? "Connected" : ""}
        </Button>
      );
    case 'rejected':
      return (
        <Button
          onClick={handleConnect}
          variant="secondary"
          className={className || "w-full"}
          disabled={actionLoading}
        >
          {actionLoading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <UserPlus className="h-4 w-4 mr-2" />
          )}
          {hasLabel ? "Connect Again" : ""}
        </Button>
      );
    default:
      return null;
  }
}; 