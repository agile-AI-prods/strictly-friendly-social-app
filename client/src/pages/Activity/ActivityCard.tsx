import React, { useEffect, useState } from 'react'
import { Activity, ActivityType, ActivityParticipant, deleteActivity, setSelectedActivity, setShowCreateModal, setUploadedImage, updateParticipantStatus } from '../../store/slices/activitySlice';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { CheckCircle2 } from 'lucide-react';
import { useAppDispatch } from '../../store/hooks';
import { useNavigate, Link } from 'react-router-dom';
import ShareActivityModal from '../../components/ShareActivityModal';
import { LikeButton } from '../../components/LikeButton';
import { Modal, Button, Calendar } from 'antd';
import { Calendar as CalendarIcon } from 'lucide-react';
import dayjs from 'dayjs';
import { useTheme } from '../../context/ThemeContext';


const ActivityCard = ({ activity, activeActivityTab }: { activity: Activity, activeActivityTab: string }) => {

    const { effectiveTheme, currentColor, getFontSizeClassForElement } = useTheme();
    const authUser = useSelector((state: RootState) => state.auth.user)
    const navigate = useNavigate();

    // Default images for different activity types

    const getDefaultImage = (type: ActivityType) => {
        switch (type) {
            case 'Outdoor':
                return 'https://images.unsplash.com/photo-1501554728187-ce583db33af7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80';
            case 'Indoor':
                return 'https://images.unsplash.com/photo-1511512578047-dfb367046420?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80';
            case 'Social':
                return 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80';
            case 'Arts':
                return 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80';
            case 'Food':
                return 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80';
            case 'Fitness':
                return 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80';
            default:
                return 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80';
        }
    };
    const dispatch = useAppDispatch();
    const [joinStatus, setJoinStatus] = useState<string | null>(null)
    const [showShareModal, setShowShareModal] = useState(false);
    const [calendarModalOpen, setCalendarModalOpen] = useState(false);
    const [participantModalOpen, setParticipantModalOpen] = useState(false);
    const [selectedParticipant, setSelectedParticipant] = useState<ActivityParticipant | null>(null);
    const [participantsListModalOpen, setParticipantsListModalOpen] = useState(false);
    // Handle image error
    const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>, type: ActivityType) => {
        e.currentTarget.src = getDefaultImage(type);
    };
    useEffect(() => {
        const joined = activity.participants?.find(p => p.user_id === authUser?.id)
        if (joined) setJoinStatus(joined.status)
    }, [activity.participants])
    // Check if user has joined an activity
    const hasJoinedActivity = (activity: Activity) => {
        return activity.participants?.some(p => p.user_id === authUser?.id);
    };
    // Handle activity deletion
    const handleDeleteActivity = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this activity?')) {
            try {
                await dispatch(deleteActivity(id)).unwrap();
            } catch (error) {
                console.error('Error deleting activity:', error);
            }
        }
    };

    // Helper to format Google Calendar URL
    const getGoogleCalendarUrl = (activity: Activity) => {
        const start = dayjs(activity.start_datetime).format('YYYYMMDDTHHmmss[Z]');
        const end = dayjs(activity.end_datetime || activity.start_datetime).add(1, 'hour').format('YYYYMMDDTHHmmss[Z]');
        return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(activity.title)}&dates=${start}/${end}&details=${encodeURIComponent(activity.description || '')}`;
    };
    // Helper to generate .ics file content
    const getICSContent = (activity: Activity) => {
        const start = dayjs(activity.start_datetime).format('YYYYMMDDTHHmmss[Z]');
        const end = dayjs(activity.end_datetime || activity.start_datetime).add(1, 'hour').format('YYYYMMDDTHHmmss[Z]');
        return `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nSUMMARY:${activity.title}\nDESCRIPTION:${activity.description || ''}\nDTSTART:${start}\nDTEND:${end}\nEND:VEVENT\nEND:VCALENDAR`;
    };
    const handleICSDownload = (activity: Activity) => {
        const element = document.createElement('a');
        const file = new Blob([getICSContent(activity).replace(/\n/g, '\r\n')], { type: 'text/calendar' });
        element.href = URL.createObjectURL(file);
        element.download = `${activity.title}.ics`;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    };

    // Helper to check if user is accepted or creator
    const isAcceptedOrCreator = () => {
        if (!authUser) return false;
        if (activity.creator_id === authUser.id) return true;
        return activity.participants?.some(p => p.user_id === authUser.id && p.status === 'accepted');
    };
    // Helper to extract city/area from location string
    const getGeneralLocation = (location: string) => {
        // Try to extract city/state/zip from a full address
        if (!location) return '';
        const parts = location.split(',');
        if (parts.length > 1) {
            return parts.slice(-2).join(',').trim(); // e.g., 'Springfield, IL'
        }
        return location;
    };


    return (
        <div key={activity.id} className={`${
            effectiveTheme === 'dark' 
                ? 'bg-gray-800 border-gray-700 text-white' 
                : 'bg-white border-gray-200 text-gray-900'
        } border rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow ${getFontSizeClassForElement('text-base')}`}>
            <div
                className="relative h-48 overflow-hidden cursor-pointer"
                onClick={() => navigate(`/activities/${activity.id}`)}
            >
                <img
                    src={activity.image_url || getDefaultImage(activity.type)}
                    alt={activity.title}
                    className="w-full h-full object-cover"
                    onError={(e) => handleImageError(e, activity.type)}
                />
                <div className="absolute top-6 right-2">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                        effectiveTheme === 'dark' 
                            ? `bg-${currentColor.primary} text-white`
                            : `bg-${currentColor.light} text-${currentColor.text}`
                    }`}>
                        {activity.type}
                    </span>
                </div>
                {hasJoinedActivity(activity) && (
                    <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium flex items-center ${
                        effectiveTheme === 'dark' 
                            ? `bg-${currentColor.primary} text-white` 
                            : `bg-${currentColor.light} text-${currentColor.text}`
                    }`}>
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        {joinStatus}
                    </div>
                )}
            </div>
            <div className="p-4">
                <h3
                    className={`font-semibold mb-2 cursor-pointer ${getFontSizeClassForElement('text-lg')} ${
                        effectiveTheme === 'dark' 
                            ? 'text-white' 
                            : 'text-gray-800'
                    } hover:text-${currentColor.primary}`}
                    onClick={() => navigate(`/activities/${activity.id}`)}
                >
                    {activity.title}
                </h3>
                <div className="space-y-2 mb-3">
                    <div className="flex items-start">
                        <Button
                            type="text"
                            onClick={e => { e.stopPropagation(); setCalendarModalOpen(true); }}
                            className={`text-${currentColor.primary} pl-0`}>
                            <i className={`fas fa-calendar-alt mt-1 text-${currentColor.primary}`}></i>
                            <span className={`${getFontSizeClassForElement('text-sm')} flex items-center text-wrap ${
                                effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                            }`}>
                                From: {new Date(activity.start_datetime).toLocaleDateString('en-US', {
                                    weekday: "short",
                                    month: "short",
                                    day: 'numeric',
                                })} • {new Date(activity.start_datetime).toLocaleTimeString('en-US', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                })} 
                                <br />
                                To: {new Date(activity.end_datetime).toLocaleDateString('en-US', {
                                    weekday: "short",
                                    month: "short",
                                    day: 'numeric',
                                })} •{new Date(activity.end_datetime).toLocaleTimeString('en-US', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                })}
                            </span>
                        </Button>
                    </div>
                    <div className="flex items-start">
                        <i className={`fas fa-map-marker-alt mt-1 mr-2 text-${currentColor.primary}`}></i>
                        {activity.hide_exact_address && !isAcceptedOrCreator() ? (
                            <span className={`${getFontSizeClassForElement('text-sm')} ${
                                effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                            }`}>{getGeneralLocation(activity.location)}</span>
                        ) : (
                            <a
                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activity.location)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`${getFontSizeClassForElement('text-sm')} hover:underline text-${currentColor.primary} hover:text-${currentColor.hover}`}
                            >
                                {activity.location}
                            </a>
                        )}
                    </div>
                    <div className="flex items-start">
                        <i className={`fas fa-users mt-1 mr-2 text-${currentColor.primary}`}></i>
                        <span
                            className={`${getFontSizeClassForElement('text-sm')} hover:underline cursor-pointer text-${currentColor.primary} hover:text-${currentColor.hover}`}
                            onClick={e => {
                                e.stopPropagation();
                                setParticipantsListModalOpen(true);
                            }}
                        >
                            {activity.participants?.filter(p => (p.status === 'accepted' || 'joined' || 'invited')).length || 0}/{activity.max_participants} participants
                        </span>
                    </div>
                </div>

                <p className={`${getFontSizeClassForElement('text-sm')} mb-4 line-clamp-2 ${
                    effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                }`}>{activity.description}</p>

                {/* Participants Avatars */}
                {activity.participants && activity.participants.length > 0 && (
                    <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className={`${getFontSizeClassForElement('text-xs')} font-medium ${
                                effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                            }`}>Participants</span>
                            <span className={`${getFontSizeClassForElement('text-xs')} ${
                                effectiveTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                            }`}>
                                {activity.participants.filter(p => p.status === 'accepted').length}/{activity.max_participants}
                            </span>
                        </div>
                        <div className="flex items-center">
                            <div className="flex -space-x-2">
                                {activity.participants
                                    .filter(p => ['accepted', 'joined', 'joining', 'invited'].includes(p.status))
                                    .slice(0, 4)
                                    .map((participant, index) => (
                                        <div
                                            key={participant.id}
                                            className="relative cursor-pointer"
                                            title={`${participant.user.name} (${participant.status})`}
                                            onClick={e => {
                                                e.stopPropagation();
                                                setSelectedParticipant(participant);
                                                setParticipantModalOpen(true);
                                            }}
                                        >
                                            <img
                                                src={participant.user.photo_url || '/assets/avatars/avatar.png'}
                                                alt={participant.user.name}
                                                className={`w-8 h-8 rounded-full border-2 border-white object-cover ${participant.status === 'declined' ? 'opacity-50' : ''}`}
                                                onError={(e) => {
                                                    e.currentTarget.src = '/assets/avatars/avatar.png';
                                                }}
                                            />
                                            {/* Status indicator */}
                                            {participant.status === 'accepted' && (
                                                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                                            )}
                                            {participant.status === 'joined' && (
                                                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white"></div>
                                            )}
                                            {participant.status === 'joining' && (
                                                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-yellow-500 rounded-full border-2 border-white"></div>
                                            )}
                                            {participant.status === 'invited' && (
                                                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-purple-500 rounded-full border-2 border-white"></div>
                                            )}
                                            {participant.status === 'declined' && (
                                                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></div>
                                            )}
                                        </div>
                                    ))}
                            </div>
                            {activity.participants.filter(p => ['accepted', 'joined', 'joining', 'invited'].includes(p.status)).length > 4 && (
                                <span className={`ml-2 ${getFontSizeClassForElement('text-xs')} ${
                                    effectiveTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                                }`}>
                                    +{activity.participants.filter(p => ['accepted', 'joined', 'joining', 'invited'].includes(p.status)).length - 4} more
                                </span>
                            )}
                        </div>

                        {/* Status Legend */}
                        {activity.participants.some(p => ['accepted', 'joined', 'joining', 'invited', 'declined'].includes(p.status)) && (
                            <div className="mt-2 flex flex-wrap gap-2 text-xs">
                                {activity.participants.some(p => p.status === 'accepted') && (
                                    <div className="flex items-center">
                                        <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                                        <span className={`${getFontSizeClassForElement('text-xs')} ${
                                            effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                                        }`}>Accepted</span>
                                    </div>
                                )}
                                {activity.participants.some(p => p.status === 'joined') && (
                                    <div className="flex items-center">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full mr-1"></div>
                                        <span className={`${getFontSizeClassForElement('text-xs')} ${
                                            effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                                        }`}>Joined</span>
                                    </div>
                                )}
                                {activity.participants.some(p => p.status === 'joining') && (
                                    <div className="flex items-center">
                                        <div className="w-2 h-2 bg-yellow-500 rounded-full mr-1"></div>
                                        <span className={`${getFontSizeClassForElement('text-xs')} ${
                                            effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                                        }`}>Joining</span>
                                    </div>
                                )}
                                {activity.participants.some(p => p.status === 'invited') && (
                                    <div className="flex items-center">
                                        <div className="w-2 h-2 bg-purple-500 rounded-full mr-1"></div>
                                        <span className={`${getFontSizeClassForElement('text-xs')} ${
                                            effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                                        }`}>Invited</span>
                                    </div>
                                )}
                                {activity.participants.some(p => p.status === 'declined') && (
                                    <div className="flex items-center">
                                        <div className="w-2 h-2 bg-red-500 rounded-full mr-1"></div>
                                        <span className={`${getFontSizeClassForElement('text-xs')} ${
                                            effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                                        }`}>Declined</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center">
                        <span className={`${getFontSizeClassForElement('text-xs')} ${
                            effectiveTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                            Created by {activity.creator?.id ? (
                                <Link
                                    to={`/profile/${activity.creator.id}`}
                                    className={`text-${currentColor.primary} hover:text-${currentColor.hover} hover:underline`}
                                    onClick={e => e.stopPropagation()}
                                >
                                    {activity.creator.name}
                                </Link>
                            ) : (
                                activity.creator?.name || 'Unknown'
                            )}
                        </span>
                    </div>
                    <div className="flex space-x-2">
                        {/* Like Button */}
                        <LikeButton
                            targetId={activity.id}
                            targetType="activity"
                            size="small"
                            showCount={true}
                            variant="text"
                        />

                        {
                        // activeActivityTab === 'upcoming' && 
                        activity.creator_id === authUser?.id && (
                            <>
                                <button
                                    onClick={() =>{ dispatch(setSelectedActivity(activity))
                                        dispatch(setShowCreateModal(true))
                                    }}
                                    className={`p-2 ${
                                        effectiveTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                                    } hover:text-${currentColor.primary}`}
                                >
                                    <i className="fas fa-edit"></i>
                                </button>
                                <button
                                    onClick={() => handleDeleteActivity(activity.id)}
                                    className={`p-2 ${
                                        effectiveTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                                    } hover:text-red-500`}
                                >
                                    <i className="fas fa-times"></i>
                                </button>
                            </>
                        )}
                        <button
                            onClick={() => setShowShareModal(true)}
                            className={`p-2 ${
                                effectiveTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                            } hover:text-${currentColor.primary}`}
                            title="Share Activity"
                        >
                            <i className="fas fa-share-alt"></i>
                        </button>
                    </div>
                </div>
            </div>
            <div className={`px-4 py-3 border-t ${
                effectiveTheme === 'dark' 
                    ? 'bg-gray-700 border-gray-600' 
                    : 'bg-gray-50 border-gray-200'
            }`}>
                {activeActivityTab === 'upcoming' ? (
                    <button
                        onClick={async () => {
                            if (activity.creator_id === authUser?.id) {
                                setSelectedActivity(activity);
                                dispatch(setShowCreateModal(true))
                            } else {
                                console.log('join activity is called')
                                setJoinStatus('Pending')
                                await dispatch(updateParticipantStatus(
                                    {
                                        activityId: activity.id,
                                        userId: authUser?.id || '',
                                        status: 'joining'
                                    }
                                ));

                            }
                        }}
                        className={`w-full py-2 bg-${currentColor.primary} hover:bg-${currentColor.hover} text-white rounded disabled:bg-gray-300 disabled:text-gray-500`}
                        disabled={!!joinStatus}

                    >
                        {activity.creator_id === authUser?.id ? 'Edit Activity' : joinStatus == null ? 'Join Activity' : joinStatus}
                    </button>
                ) : activeActivityTab === 'past' ? (
                    <div className="flex space-x-2">
                        <button className={`flex-1 py-2 bg-${currentColor.primary} hover:bg-${currentColor.hover} text-white rounded`}>
                            View Details
                        </button>
                        {activity.creator_id === authUser?.id && (
                            <button
                                onClick={() => {
                                    dispatch(setSelectedActivity({
                                        ...activity,
                                        id: undefined, // Remove id so it's treated as a new activity
                                        start_datetime: new Date().toISOString(),
                                        end_datetime: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour later
                                        status: 'upcoming',
                                        created_at: undefined,
                                        updated_at: undefined,
                                        participants: [], // Optionally clear participants
                                    }));
                                    dispatch(setShowCreateModal(true));
                                }}
                                className={`flex-1 py-2 border border-${currentColor.primary} text-${currentColor.primary} hover:bg-${currentColor.light} rounded`}
                            >
                                Plan Again
                            </button>
                        )}
                    </div>
                ) : (
                    <button
                        onClick={async () => {
                            setJoinStatus('Pending')
                            await dispatch(updateParticipantStatus(
                                {
                                    activityId: activity.id,
                                    userId: authUser?.id || '',
                                    status: 'joining'
                                }
                            ));
                        }}
                        disabled={!!joinStatus}
                        className={`w-full py-2 bg-${currentColor.primary} hover:bg-${currentColor.hover} text-white rounded disabled:bg-gray-300 disabled:text-gray-500`}
                    >
                        {joinStatus == null ? 'Join Activity' : joinStatus}
                    </button>
                )}
            </div>

            {/* Share Modal */}
            <ShareActivityModal
                activity={activity}
                visible={showShareModal}
                onClose={() => setShowShareModal(false)}
            />

            <Modal
                open={calendarModalOpen}
                onCancel={() => setCalendarModalOpen(false)}
                footer={null}
                title="Event Calendar & Add to Calendar"
            >
                <div className="mb-4">
                                         <a
                         href={getGoogleCalendarUrl(activity)}
                         target="_blank"
                         rel="noopener noreferrer"
                         className={`block mb-2 text-${currentColor.primary} hover:underline`}
                     >
                         Add to Google Calendar
                     </a>
                    <Button
                        onClick={() => handleICSDownload(activity)}
                        className="mb-2"
                    >
                        Download .ics (Apple/Outlook)
                    </Button>
                </div>
                <Calendar
                    fullscreen={false}
                    value={dayjs(activity.start_datetime)}
                    dateCellRender={(date) => {
                        const currentDate = date.format('YYYY-MM-DD');
                        const startDate = dayjs(activity.start_datetime).format('YYYY-MM-DD');
                        const endDate = dayjs(activity.end_datetime).format('YYYY-MM-DD');
                        
                        // Check if current date is within the activity range
                        const isStartDate = currentDate === startDate;
                        const isEndDate = currentDate === endDate;
                        const isInRange = currentDate >= startDate && currentDate <= endDate;
                        
                        if (isInRange) {
                            return (
                                                                 <div className={`h-full w-full p-1 ${isStartDate ? `bg-${currentColor.primary} text-white rounded-l` : ''} ${isEndDate ? `bg-${currentColor.primary} text-white rounded-r` : ''} ${!isStartDate && !isEndDate ? `bg-${currentColor.light}` : ''}`}>
                                     {isStartDate && (
                                         <div className="text-xs font-bold">Start</div>
                                     )}
                                     {isEndDate && !isStartDate && (
                                         <div className="text-xs font-bold">End</div>
                                     )}
                                     {!isStartDate && !isEndDate && (
                                         <div className={`text-xs text-${currentColor.primary}`}>•</div>
                                     )}
                                 </div>
                            );
                        }
                        return null;
                    }}
                />
            </Modal>

            <Modal
                open={participantModalOpen}
                onCancel={() => setParticipantModalOpen(false)}
                footer={null}
                title={selectedParticipant?.user?.name || 'Participant'}
            >
                {selectedParticipant && (
                    <div className="flex flex-col items-center">
                        <img
                            src={selectedParticipant.user.photo_url || '/assets/avatars/avatar.png'}
                            alt={selectedParticipant.user.name}
                            className="w-20 h-20 rounded-full border-2 border-gray-200 mb-2"
                        />
                                                 <div className={`${getFontSizeClassForElement('text-lg')} font-semibold mb-1`}>{selectedParticipant.user.name}</div>
                         <div className={`${getFontSizeClassForElement('text-sm')} ${
                             effectiveTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                         } mb-2`}>Status: {selectedParticipant.status}</div>
                         <Button
                             type="primary"
                             href={`/profile/${selectedParticipant.user.id}`}
                             target="_blank"
                             rel="noopener noreferrer"
                             className={`bg-${currentColor.primary} hover:bg-${currentColor.hover}`}
                         >
                             View Profile
                         </Button>
                    </div>
                )}
            </Modal>

            <Modal
                open={participantsListModalOpen}
                onCancel={() => setParticipantsListModalOpen(false)}
                footer={null}
                title="Participants"
            >
                <div className="space-y-4">
                    {activity.participants && activity.participants.length > 0 ? (
                        activity.participants
                            .filter(p => ['accepted', 'joined', 'joining', 'invited'].includes(p.status))
                            .map(participant => (
                                <div key={participant.id} className="flex items-center gap-4 p-2 border-b last:border-b-0">
                                    <img
                                        src={participant.user.photo_url || '/assets/avatars/avatar.png'}
                                        alt={participant.user.name}
                                        className="w-10 h-10 rounded-full object-cover border"
                                    />
                                                                         <div className="flex-1">
                                         <div className={`font-medium ${getFontSizeClassForElement('text-base')}`}>{participant.user.name}</div>
                                         <div className={`${getFontSizeClassForElement('text-xs')} ${
                                             effectiveTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                                         }`}>Status: {participant.status}</div>
                                     </div>
                                     <Button
                                         type="link"
                                         href={`/profile/${participant.user.id}`}
                                         target="_blank"
                                         rel="noopener noreferrer"
                                         className={`text-${currentColor.primary} hover:text-${currentColor.hover}`}
                                     >
                                         View Profile
                                     </Button>
                                </div>
                            ))
                    ) : (
                                                 <div className={`${getFontSizeClassForElement('text-sm')} ${
                             effectiveTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                         } text-center`}>No participants yet.</div>
                    )}
                </div>
            </Modal>
        </div >
    )
}

export default ActivityCard