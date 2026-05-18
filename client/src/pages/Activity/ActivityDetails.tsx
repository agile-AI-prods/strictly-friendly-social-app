import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { ParticipantStatus, updateParticipantStatus, fetchSingleActivity } from '../../store/slices/activitySlice';
import { fetchComments, createComment, updateComment, deleteComment, Comment } from '../../store/slices/commentsSlice';
import { formatDistanceToNow } from 'date-fns';
import { AppDispatch } from '../../store';
import { Tabs } from 'antd';
import socketService from '../../services/socketService';
import ShareActivityModal from '../../components/ShareActivityModal';
import { LikeButton } from '../../components/LikeButton';
import { useTheme } from '../../context/ThemeContext';

const ActivityDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch<AppDispatch>();
    const { effectiveTheme, currentColor, getFontSizeClassForElement } = useTheme();
    const user = useSelector((state: RootState) => state.auth.user);
    const activity = useSelector((state: RootState) => state.activities.singleActivity);
    const fetchSingleActivityStatus = useSelector((state: RootState) => state.activities.status.fetchSingleActivity);
    const comments = useSelector((state: RootState) => state.comments.comments);
    const commentsStatus = useSelector((state: RootState) => state.comments.status);
    const [updatingParticipant, setUpdatingParticipant] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'details' | 'discussion'>('details');
    const [newComment, setNewComment] = useState('');
    const [editingComment, setEditingComment] = useState<string | null>(null);
    const [editContent, setEditContent] = useState('');
    const [showShareModal, setShowShareModal] = useState(false);

    const activityComments = comments[id || ''] || [];

    // Fetch activity when component mounts or id changes
    useEffect(() => {
        if (id) {
            dispatch(fetchSingleActivity(id));
        }
    }, [id, dispatch]);

    // Fetch comments when activity changes
    useEffect(() => {
        if (id) {
            dispatch(fetchComments(id));
            socketService.subscribeToComments(id);
        }

        return () => {
            if (id) {
                socketService.unsubscribeFromComments(id);
            }
        };
    }, [id, dispatch]);

    const handleUpdateParticipantStatus = async (userId: string, status: ParticipantStatus) => {
        if (!activity) return;

        setUpdatingParticipant(userId);
        try {
            await dispatch(updateParticipantStatus({
                activityId: activity.id,
                userId,
                status
            })).unwrap();
        } catch (error) {
            console.error('Error updating participant status:', error);
        } finally {
            setUpdatingParticipant(null);
        }
    };

    const handleSubmitComment = async () => {
        if (!id || !newComment.trim()) return;

        try {
            await dispatch(createComment({ activityId: id, content: newComment.trim() })).unwrap();
            setNewComment('');
        } catch (error) {
            console.error('Error creating comment:', error);
        }
    };

    const handleUpdateComment = async (commentId: string) => {
        if (!editContent.trim()) return;

        try {
            await dispatch(updateComment({ commentId, content: editContent.trim() })).unwrap();
            setEditingComment(null);
            setEditContent('');
        } catch (error) {
            console.error('Error updating comment:', error);
        }
    };

    const handleDeleteComment = async (commentId: string) => {
        if (window.confirm('Are you sure you want to delete this comment?')) {
            try {
                await dispatch(deleteComment(commentId)).unwrap();
            } catch (error) {
                console.error('Error deleting comment:', error);
            }
        }
    };

    const startEditing = (comment: Comment) => {
        setEditingComment(comment.id);
        setEditContent(comment.content);
    };

    const cancelEditing = () => {
        setEditingComment(null);
        setEditContent('');
    };

    if (!activity) {
        return (
            <div className={`min-h-screen ${effectiveTheme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'} py-8`}>
                <div className="container mx-auto px-4">
                    <div className="mb-6">
                        <button
                            onClick={() => navigate('/activities')}
                            className={`flex items-center ${effectiveTheme === 'dark' ? 'text-blue-400 hover:text-blue-300' : 'text-indigo-600 hover:text-indigo-800'}`}
                        >
                            <i className="fas fa-arrow-left mr-2"></i>
                            Back to Strictly Ups
                        </button>
                    </div>
                    {fetchSingleActivityStatus === 'pending' ? (
                        <div className={`${effectiveTheme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-8 text-center`}>
                            <div className={`animate-spin rounded-full h-12 w-12 border-b-2 border-${currentColor.primary} mx-auto mb-4`}></div>
                            <p className={`${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Loading activity...</p>
                        </div>
                    ) : fetchSingleActivityStatus === 'rejected' ? (
                        <div className="text-center py-12">
                            <h2 className={`text-2xl font-semibold ${effectiveTheme === 'dark' ? 'text-white' : 'text-gray-800'}`}>Activity not found</h2>
                            <p className={`${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'} mt-2`}>The activity you're looking for doesn't exist or has been removed.</p>
                            <button
                                onClick={() => navigate('/activities')}
                                className={`mt-4 px-4 py-2 ${currentColor.primary} text-white rounded-lg hover:${currentColor.hover}`}
                            >
                                Back to Strictly Ups
                            </button>
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <h2 className={`text-2xl font-semibold ${effectiveTheme === 'dark' ? 'text-white' : 'text-gray-800'}`}>Activity not found</h2>
                            <button
                                onClick={() => navigate('/activities')}
                                className={`mt-4 px-4 py-2 ${currentColor.primary} text-white rounded-lg hover:${currentColor.hover}`}
                            >
                                Back to Strictly Ups
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    }


    const getParticipantGroups = () => {
        if (!activity || !activity.participants) {
            return {
                accepted: [],
                invited: [],
                joining: [],
                inviting: [],
                declined: []
            };
        }
        
        const groups = {
            accepted: activity.participants.filter(p => p.status === 'accepted'),
            invited: activity.participants.filter(p => p.status === 'invited'),
            joining: activity.participants.filter(p => p.status === 'joining'),
            inviting: activity.participants.filter(p => p.status === 'inviting'),
            declined: activity.participants.filter(p => p.status === 'declined')
        };
        return groups;
    };

    const participantGroups = getParticipantGroups();
    const isCreator = user?.id === activity?.creator_id;

    // Show loading state if activity is not loaded
    if (!activity) {
        return (
            <div className="min-h-screen bg-gray-50 py-8">
                <div className="container mx-auto px-4">
                    <div className="mb-6">
                        <button
                            onClick={() => navigate('/activities')}
                            className="flex items-center text-indigo-600 hover:text-indigo-800"
                        >
                            <i className="fas fa-arrow-left mr-2"></i>
                            Back to Strictly Ups
                        </button>
                    </div>
                    <div className="bg-white rounded-lg shadow-md p-8 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading activity...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`min-h-screen ${effectiveTheme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'} py-8`}>
            <div className="container mx-auto px-4">
                <div className="mb-6">
                    <button
                        onClick={() => navigate('/activities')}
                        className={`flex items-center ${effectiveTheme === 'dark' ? 'text-blue-400 hover:text-blue-300' : 'text-indigo-600 hover:text-indigo-800'}`}
                    >
                        <i className="fas fa-arrow-left mr-2"></i>
                        Back to Strictly Ups
                    </button>
                </div>

                <div className={`${effectiveTheme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md overflow-hidden`}>
                    {/* Activity Header */}
                    <div className="relative h-64">
                        <img
                            src={activity.image_url}
                            alt={activity.title}
                            className={`w-full h-full object-cover ${effectiveTheme === 'dark' ? 'filter brightness-90' : ''}`}
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-40 flex items-end">
                            <div className="p-6 text-white w-full">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <h1 className={`text-3xl font-bold mb-2 ${getFontSizeClassForElement('text-3xl')}`}>{activity.title}</h1>
                                        <div className="flex items-center space-x-4">
                                            <span className="bg-white bg-opacity-20 px-3 py-1 rounded-full text-sm">
                                                {activity.type}
                                            </span>
                                            <span className="bg-white bg-opacity-20 px-3 py-1 rounded-full text-sm">
                                                {(activity.participants?.length || 0)}/{activity.max_participants} Participants
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setShowShareModal(true)}
                                        className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-3 rounded-full transition-colors"
                                        title="Share Activity"
                                    >
                                        <i className="fas fa-share-alt text-lg"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tabs Navigation */}
                    <Tabs
                        activeKey={activeTab}
                        onChange={key => setActiveTab(key as 'details' | 'discussion')}
                        className="px-6 pt-4"
                        items={[
                            {
                                key: 'details',
                                label: 'Details',
                                children: (
                                    <div className="p-0">
                                        {/* Activity Details */}
                                        <div className="p-0">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div>
                                                    <h2 className={`text-xl font-semibold ${effectiveTheme === 'dark' ? 'text-white' : 'text-gray-800'} mb-4 ${getFontSizeClassForElement('text-xl')}`}>Details</h2>
                                                    <div className="space-y-4">
                                                        <div className="flex items-start">
                                                            <i className={`fas fa-calendar-alt ${currentColor.primary} mt-1 mr-3`}></i>
                                                            <div>
                                                                <p className={`${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                                                                    {new Date(activity.start_datetime).toLocaleDateString('en-US', {
                                                                        weekday: 'long',
                                                                        month: 'long',
                                                                        day: 'numeric'
                                                                    })}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-start">
                                                            <i className={`fas fa-map-marker-alt ${currentColor.primary} mt-1 mr-3`}></i>
                                                            <p className={`${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>{activity.location}</p>
                                                        </div>
                                                        <div className="flex items-start">
                                                            <i className={`fas fa-user ${currentColor.primary} mt-1 mr-3`}></i>
                                                            <p className={`${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                                                                Created by {activity.participants?.find(p => p.user_id === activity.creator_id)?.user?.name || 'Unknown'}
                                                            </p>
                                                        </div>
                                                        <div className="flex items-start">
                                                            <i className={`fas fa-clock ${currentColor.primary} mt-1 mr-3`}></i>
                                                            <p className={`${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                                                                Created {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div>
                                                    <h2 className={`text-xl font-semibold ${effectiveTheme === 'dark' ? 'text-white' : 'text-gray-800'} mb-4 ${getFontSizeClassForElement('text-xl')}`}>Description</h2>
                                                    <p className={`${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'} whitespace-pre-wrap`}>{activity.description}</p>
                                                </div>
                                            </div>
                                            {/* Participants Section */}
                                            <div className="mt-8">
                                                <h2 className={`text-xl font-semibold ${effectiveTheme === 'dark' ? 'text-white' : 'text-gray-800'} mb-4 ${getFontSizeClassForElement('text-xl')}`}>Participants</h2>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {Object.entries(participantGroups).map(([status, participants]) => (
                                                        <div key={status} className={`${effectiveTheme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-4`}>
                                                            <h3 className={`font-medium ${effectiveTheme === 'dark' ? 'text-white' : 'text-gray-800'} mb-3 capitalize ${getFontSizeClassForElement('text-base')}`}>{status}</h3>
                                                            {participants.length > 0 ? (
                                                                <div className="space-y-3">
                                                                    {participants.map(participant => (
                                                                        <div key={participant.id} className="flex items-center space-x-3">
                                                                            <img
                                                                                src={participant.user.photo_url || '/assets/avatars/avatar.png'}
                                                                                alt={participant.user.name}
                                                                                className={`w-10 h-10 rounded-full object-cover ${effectiveTheme === 'dark' ? 'filter brightness-90' : ''}`}
                                                                                onError={(e) => {
                                                                                    e.currentTarget.src = '/assets/avatars/avatar.png';
                                                                                }}
                                                                            />
                                                                            <div className="flex-1">
                                                                                <p className={`text-sm font-medium ${effectiveTheme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                                                                                    {participant.user.name}
                                                                                </p>
                                                                                {participant.joined_at && (
                                                                                    <p className={`text-xs ${effectiveTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                                                                        Joined {formatDistanceToNow(new Date(participant.joined_at), { addSuffix: true })}
                                                                                    </p>
                                                                                )}
                                                                            </div>
                                                                            {isCreator && status === 'joining' && (
                                                                                <div className="flex space-x-2">
                                                                                    <button
                                                                                        onClick={() => handleUpdateParticipantStatus(participant.user_id, 'accepted')}
                                                                                        className="p-1 text-green-600 hover:text-green-700 disabled:opacity-50"
                                                                                        title="Accept"
                                                                                        disabled={updatingParticipant === participant.user_id}
                                                                                    >
                                                                                        {updatingParticipant === participant.user_id ? (
                                                                                            <i className="fas fa-spinner fa-spin"></i>
                                                                                        ) : (
                                                                                            <i className="fas fa-check"></i>
                                                                                        )}
                                                                                    </button>
                                                                                    <button
                                                                                        onClick={() => handleUpdateParticipantStatus(participant.user_id, 'declined')}
                                                                                        className="p-1 text-red-600 hover:text-red-700 disabled:opacity-50"
                                                                                        title="Decline"
                                                                                        disabled={updatingParticipant === participant.user_id}
                                                                                    >
                                                                                        {updatingParticipant === participant.user_id ? (
                                                                                            <i className="fas fa-spinner fa-spin"></i>
                                                                                        ) : (
                                                                                            <i className="fas fa-times"></i>
                                                                                        )}
                                                                                    </button>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            ) : (
                                                                <p className={`text-sm ${effectiveTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>No {status} participants</p>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )
                            },
                            {
                                key: 'discussion',
                                label: 'Discussion',
                                children: (
                                    <div className="p-6">
                                        <h2 className={`text-xl font-semibold ${effectiveTheme === 'dark' ? 'text-white' : 'text-gray-800'} mb-4 ${getFontSizeClassForElement('text-xl')}`}>Discussion</h2>

                                        {/* Comment Input */}
                                        <div className="mb-6">
                                            <div className="flex items-start space-x-3">
                                                <img
                                                    src={user?.photo_url || '/assets/avatar.png'}
                                                    alt={user?.name || 'User'}
                                                    className={`w-8 h-8 rounded-full object-cover mt-2 ${effectiveTheme === 'dark' ? 'filter brightness-90' : ''}`}
                                                    onError={(e) => {
                                                        e.currentTarget.src = '/assets/avatar.png';
                                                    }}
                                                />
                                                <div className="flex-1">
                                                    <textarea
                                                        value={newComment}
                                                        onChange={(e) => setNewComment(e.target.value)}
                                                        onKeyDown={(e) => {
                                                            if (e.ctrlKey && e.key === 'Enter') {
                                                                e.preventDefault();
                                                                if (newComment.trim() && commentsStatus.createComment !== 'pending') {
                                                                    handleSubmitComment();
                                                                }
                                                            }
                                                        }}
                                                        placeholder="Add a comment... (Ctrl+Enter to submit)"
                                                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-${currentColor.primary} resize-none ${
                                                            effectiveTheme === 'dark'
                                                                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                                                                : 'border-gray-300 text-gray-900 placeholder-gray-500'
                                                        }`}
                                                        rows={3}
                                                        disabled={commentsStatus.createComment === 'pending'}
                                                    />
                                                    <div className="flex justify-between items-center mt-2">
                                                        <span className={`text-sm ${effectiveTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                                            {newComment.length}/500 characters
                                                        </span>
                                                        <button
                                                            onClick={handleSubmitComment}
                                                            disabled={!newComment.trim() || commentsStatus.createComment === 'pending'}
                                                            className={`px-4 py-2 ${currentColor.primary} text-white rounded-lg hover:${currentColor.hover} disabled:opacity-50 disabled:cursor-not-allowed`}
                                                        >
                                                            {commentsStatus.createComment === 'pending' ? (
                                                                <span className="flex items-center">
                                                                    <i className="fas fa-spinner fa-spin mr-2"></i>
                                                                    Posting...
                                                                </span>
                                                            ) : (
                                                                'Post Comment'
                                                            )}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Comments List */}
                                        <div className="space-y-4">
                                            {commentsStatus.fetchComments === 'pending' ? (
                                                <div className="text-center py-8">
                                                    <i className={`fas fa-spinner fa-spin text-2xl ${currentColor.primary}`}></i>
                                                    <p className={`mt-2 ${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Loading comments...</p>
                                                </div>
                                            ) : activityComments.length > 0 ? (
                                                activityComments.map((comment) => (
                                                    <div key={comment.id} className={`${effectiveTheme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-4`}>
                                                        <div className="flex items-start space-x-3">
                                                            <img
                                                                src={comment.user.photo_url || '/assets/avatar.png'}
                                                                alt={comment.user.name}
                                                                className={`w-8 h-8 rounded-full object-cover ${effectiveTheme === 'dark' ? 'filter brightness-90' : ''}`}
                                                                onError={(e) => {
                                                                    e.currentTarget.src = '/assets/avatar.png';
                                                                }}
                                                            />
                                                            <div className="flex-1">
                                                                <div className="flex items-center space-x-2 mb-1">
                                                                    <span className={`font-medium ${effectiveTheme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                                                                        {comment.user.name}
                                                                    </span>
                                                                    <span className={`text-sm ${effectiveTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                                                        {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                                                                    </span>
                                                                    {comment.updated_at !== comment.created_at && (
                                                                        <span className={`text-xs ${effectiveTheme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>(edited)</span>
                                                                    )}
                                                                </div>

                                                                {editingComment === comment.id ? (
                                                                    <div className="space-y-2">
                                                                        <textarea
                                                                            value={editContent}
                                                                            onChange={(e) => setEditContent(e.target.value)}
                                                                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-${currentColor.primary} resize-none ${
                                                                                effectiveTheme === 'dark'
                                                                                    ? 'bg-gray-600 border-gray-500 text-white'
                                                                                    : 'border-gray-300 text-gray-900'
                                                                            }`}
                                                                            rows={2}
                                                                        />
                                                                        <div className="flex space-x-2">
                                                                            <button
                                                                                onClick={() => handleUpdateComment(comment.id)}
                                                                                disabled={!editContent.trim() || commentsStatus.updateComment === 'pending'}
                                                                                className={`px-3 py-1 ${currentColor.primary} text-white rounded text-sm hover:${currentColor.hover} disabled:opacity-50`}
                                                                            >
                                                                                Save
                                                                            </button>
                                                                            <button
                                                                                onClick={cancelEditing}
                                                                                className={`px-3 py-1 ${effectiveTheme === 'dark' ? 'bg-gray-600 text-gray-300 hover:bg-gray-500' : 'bg-gray-300 text-gray-700 hover:bg-gray-400'} rounded text-sm`}
                                                                            >
                                                                                Cancel
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <p className={`${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} whitespace-pre-wrap`}>{comment.content}</p>
                                                                )}
                                                            </div>

                                                            {/* Comment Actions */}
                                                            <div className="flex items-center space-x-2">
                                                                {/* Like Button for Comment */}
                                                                <LikeButton
                                                                    targetId={comment.id}
                                                                    targetType="comment"
                                                                    size="small"
                                                                    showCount={true}
                                                                    variant="text"
                                                                />

                                                                {user?.id === comment.user_id && (
                                                                    <>
                                                                        {editingComment !== comment.id && (
                                                                            <button
                                                                                onClick={() => startEditing(comment)}
                                                                                className={`${effectiveTheme === 'dark' ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
                                                                                title="Edit"
                                                                            >
                                                                                <i className="fas fa-edit"></i>
                                                                            </button>
                                                                        )}
                                                                        <button
                                                                            onClick={() => handleDeleteComment(comment.id)}
                                                                            className={`${effectiveTheme === 'dark' ? 'text-gray-400 hover:text-red-400' : 'text-gray-400 hover:text-red-600'}`}
                                                                            title="Delete"
                                                                            disabled={commentsStatus.deleteComment === 'pending'}
                                                                        >
                                                                            <i className="fas fa-trash"></i>
                                                                        </button>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className={`text-center py-8 ${effectiveTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                                    <i className="fas fa-comments text-3xl mb-2"></i>
                                                    <p>No comments yet. Be the first to comment!</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )
                            }
                        ]}
                    />
                </div>

                {/* Share Modal */}
                <ShareActivityModal
                    activity={activity}
                    visible={showShareModal}
                    onClose={() => setShowShareModal(false)}
                />
            </div>
        </div>
    );
};

export default ActivityDetails; 