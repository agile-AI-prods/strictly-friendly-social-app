import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../../store';
import { fetchNotifications, markNotificationAsRead, markAllNotificationsAsRead, subscribeToNotifications, deleteNotification, type Notification } from '../../../store/slices/notificationSlice';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Bell, Check, Trash2, Heart, HeartOff, MessageCircle, UserPlus, Calendar } from 'lucide-react';
import { Button, Empty, Spin, Tabs, Popconfirm, Modal } from 'antd';

const Notification = () => {
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();
    const { notifications, loading } = useSelector((state: RootState) => state.notifications);
    const [activeTab, setActiveTab] = useState('all');
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const allSelected = notifications.length > 0 && selectedIds.length === notifications.length;

    // Function to get icon based on notification type
    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'message':
                return <MessageCircle className="h-6 w-6" />;
            case 'connection':
                return <UserPlus className="h-6 w-6" />;
            case 'activity':
                return <Calendar className="h-6 w-6" />;
            case 'activity_update':
                return <Calendar className="h-6 w-6" />;
            case 'activity_deleted':
                return <Trash2 className="h-6 w-6" />;
            case 'like':
                return <Heart className="h-6 w-6" />;
            case 'unlike':
                return <HeartOff className="h-6 w-6" />;
            default:
                return <Bell className="h-6 w-6" />;
        }
    };


    const handleNotificationClick = (notification: Notification) => {
        // Navigate based on notification type
        switch (notification.type) {
            case 'message':
                navigate('/messages', { state: { selectedUserId: notification.from_user_id } });
                break;
            case 'connection':
                navigate('/connections');
                break;
            case 'activity':
                navigate(`/activity/${notification.metadata?.activity_id}`);
                break;
            case 'activity_update':
                navigate(`/activity/${notification.metadata?.activity_id}`);
                break;
            case 'activity_deleted':
                // For deleted activities, navigate to activities list since the activity no longer exists
                navigate('/activity');
                break;
            case 'like':
                if (notification.metadata?.activity_id) {
                    navigate(`/activity/${notification.metadata.activity_id}`);
                }
                break;
            case 'unlike':
                if (notification.metadata?.activity_id) {
                    navigate(`/activity/${notification.metadata.activity_id}`);
                }
                break;
            case 'event':
                // navigate(`/profile/${notification.metadata?.user_id}`);
                break;
            case 'discovery':
                // navigate(`/profile/${notification.metadata?.user_id}`);
                break;
            default:
                break;
        }
    };

    const handleMarkAsRead = (e: React.MouseEvent, notification: Notification) => {
        e.stopPropagation();
        dispatch(markNotificationAsRead(notification.id));
    };

    const handleDelete = (e: React.MouseEvent, notification: Notification) => {
        // e.stopPropagation();
        dispatch(deleteNotification(notification.id));
    };

    const handleMarkAllAsRead = () => {
        dispatch(markAllNotificationsAsRead());
    };

    const handleMarkSelectedAsRead = () => {
        const dummyEvent = {} as React.MouseEvent<Element, MouseEvent>;
        selectedIds.forEach(id => {
            const notif = notifications.find(n => n.id === id);
            if (notif && !notif.read) {
                handleMarkAsRead(dummyEvent, notif);
            }
        });
        setSelectedIds([]);
    };

    const handleDeleteSelected = () => {
        Modal.confirm({
            title: 'Delete selected notifications',
            content: 'Are you sure you want to delete the selected notifications?',
            okText: 'Yes',
            cancelText: 'No',
            onOk: () => {
                const dummyEvent = {} as React.MouseEvent<Element, MouseEvent>;
                selectedIds.forEach(id => {
                    const notif = notifications.find(n => n.id === id);
                    if (notif) {
                        handleDelete(dummyEvent, notif);
                    }
                });
                setSelectedIds([]);
            },
        });
    };

    const filteredNotifications = notifications.filter((notification) => {
        if (activeTab === 'all') return true;
        if (activeTab === 'unread') return !notification.read;
        return notification.type === activeTab;
    });

    const groupedNotifications = filteredNotifications.reduce((groups: { [key: string]: Notification[] }, notification) => {
        const date = new Date(notification.created_at).toLocaleDateString();
        if (!groups[date]) {
            groups[date] = [];
        }
        groups[date].push(notification);
        return groups;
    }, {});

    // Compute if any selected notification is unread
    const anySelectedUnread = selectedIds.some(id => {
        const notif = notifications.find(n => n.id === id);
        return notif && !notif.read;
    });

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Spin size="large" />
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
                {notifications.some((n) => !n.read) && (
                    <Button
                        type="text"
                        icon={<Check className="h-4 w-4" />}
                        onClick={handleMarkAllAsRead}
                    >
                        Mark all as read
                    </Button>
                )}
            </div>

            <Tabs
                activeKey={activeTab}
                onChange={setActiveTab}
                size="middle"
                
                className="w-full"
                items={[
                    { key: 'all', label: 'All' },
                    { key: 'unread', label: 'Unread' },
                    { key: 'message', label: 'Messages' },
                    { key: 'connection', label: 'Connections' },
                    { key: 'activity', label: 'Activities' },
                    { key: 'like', label: 'Likes' },
                    { key: 'discovery', label: 'Discoveries' },
                ]}
            />

            <div className="flex items-center mb-4">
                <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={e => {
                        if (e.target.checked) {
                            setSelectedIds(notifications.map(n => n.id));
                        } else {
                            setSelectedIds([]);
                        }
                    }}
                    className="mr-2"
                />
                <span>Select All</span>
                <Button
                    className="ml-4"
                    disabled={selectedIds.length === 0 || !anySelectedUnread}
                    onClick={handleMarkSelectedAsRead}
                >
                    Mark as Read
                </Button>
                <Button
                    className="ml-2"
                    danger
                    disabled={selectedIds.length === 0}
                    onClick={handleDeleteSelected}
                >
                    Delete
                </Button>
            </div>

            {Object.keys(groupedNotifications).length === 0 ? (
                <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="No notifications"
                />
            ) : (
                <div className="space-y-6">
                    {Object.entries(groupedNotifications).map(([date, notifications]) => (
                        <div key={date}>
                            <h2 className="text-sm font-medium text-gray-500 mb-3">{date}</h2>
                            <div className="space-y-2">
                                {notifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        className={`p-4 rounded-lg cursor-pointer transition-colors ${notification.read ? 'bg-white' : 'bg-blue-50'
                                            } hover:bg-gray-50`}
                                        onClick={() => handleNotificationClick(notification)}
                                    >
                                        <div className="flex items-start space-x-3">
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.includes(notification.id)}
                                                onChange={e => {
                                                    e.stopPropagation();
                                                    setSelectedIds(ids =>
                                                        e.target.checked
                                                            ? [...ids, notification.id]
                                                            : ids.filter(id => id !== notification.id)
                                                    );
                                                }}
                                                className="mt-1 mr-2"
                                            />
                                            <div className="flex-shrink-0">
                                                <div className={`${notification.read ? 'text-gray-400' : 'text-blue-500'}`}>
                                                    {getNotificationIcon(notification.type)}
                                                </div>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-900">
                                                    {notification.content}
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                                                </p>
                                            </div>
                                            <div className="flex-shrink-0 flex items-center space-x-2">
                                                {!notification.read && (
                                                    <Button
                                                        type="text"
                                                        size="small"
                                                        icon={<Check className="h-4 w-4" />}
                                                        onClick={(e) => handleMarkAsRead(e, notification)}
                                                        className="text-gray-500 hover:text-blue-500"
                                                    />
                                                )}
                                                <Popconfirm
                                                    title="Delete notification"
                                                    description="Are you sure you want to delete this notification?"
                                                    onConfirm={(e) => handleDelete(e as React.MouseEvent, notification)}
                                                    okText="Yes"
                                                    cancelText="No"
                                                >
                                                    <Button
                                                        type="text"
                                                        size="small"
                                                        icon={<Trash2 className="h-4 w-4" />}
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="text-gray-500 hover:text-red-500"
                                                    />
                                                </Popconfirm>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Notification;