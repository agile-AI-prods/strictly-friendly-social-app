import { useEffect, useState, useRef } from 'react'
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { setSelectedActivity, setShowCreateModal, Activity, ActivityType, inviteParticipants, updateActivity, ActivityStatus, createActivity } from '../../store/slices/activitySlice';
import { Profile } from '../../types';
import { DatePicker, Modal } from 'antd';
import dayjs from 'dayjs';
import { activityService } from '../../services/activityService';
import ShareActivityModal from '../../components/ShareActivityModal';
import React from 'react';
import { useTheme } from '../../context/ThemeContext';

interface EditEventModalProps {
    clickedDate?: Date | null;
    onClose?: () => void;
}

const EditEventModal = ({ clickedDate, onClose }: EditEventModalProps) => {
    const dispatch = useAppDispatch()
    const { effectiveTheme, currentColor, getFontSizeClassForElement } = useTheme();
    const selectedActivity = useAppSelector(state => state.activities.selectedActivity)
    const [activeActivity, setActiveActivity] = useState<Activity>();
    const [selectedType, setSelectedType] = useState<ActivityType | null>(null);
    const activityTypes: ActivityType[] = ["Outdoor", "Indoor", "Social", "Arts", "Food", "Fitness"];
    const eventTypes: string[] = ["Concert", "Workshop", "Meetup", "Party", "Conference", "Fundraiser", "Festival", "Seminar"];
    const [showFriendSelector, setShowFriendSelector] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadedImage, setUploadedImage] = useState<File | null>(null);
    const [selectedFriends, setSelectedFriends] = useState<Profile[]>([]);
    const connections = useAppSelector(state => state.connections.connections)
    const currentUser = useAppSelector(state => state.auth.user)
    const [availableFriends, setAvailableFriends] = useState<Profile[]>([])
    const showCreateModal = useAppSelector(state => state.activities.showCreateModal)
    const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const formRef = useRef<HTMLFormElement | null>(null);
    const [showShareModal, setShowShareModal] = useState(false);
    const [tab, setTab] = useState<'activity' | 'event'>('activity');
    const [hideExactAddress, setHideExactAddress] = useState(false);
    const [showMapModal, setShowMapModal] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState<string>('');

    const { RangePicker } = DatePicker

    // Handle map location selection
    const handleMapLocationSelect = (location: string) => {
        setSelectedLocation(location);
        // Update the location input field
        const locationInput = document.getElementById('activity-location') as HTMLInputElement;
        if (locationInput) {
            locationInput.value = location;
        }
        setShowMapModal(false);
    };

    // Open Google Maps in a new window for location selection
    const openMapForLocation = () => {
        const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedLocation || '')}`;
        window.open(mapUrl, '_blank', 'width=800,height=600');
        
        // Alternative: Open a modal with embedded map
        setShowMapModal(true);
    };

    useEffect(() => {
        if (selectedActivity) {
            setDateRange([dayjs(selectedActivity.start_datetime), dayjs(selectedActivity.end_datetime)])
            setActiveActivity(selectedActivity);
            setSelectedType(selectedActivity.type); // Set the selected type to match the activity
            console.log('selectedActivity', selectedActivity)
            // Remove setFieldValue calls since we're using defaultValue in the form inputs
            setHideExactAddress(!!selectedActivity.hide_exact_address);
        } else if (clickedDate) {
            // Pre-fill with clicked date for new activity
            const startDate = dayjs(clickedDate);
            const endDate = startDate.add(1, 'hour'); // Default 1 hour duration
            setDateRange([startDate, endDate]);
            setActiveActivity(undefined);
            setSelectedType(null); // Reset selected type for new activity
            setHideExactAddress(false);
        } else {
            // Reset when creating new activity without clicked date
            setDateRange(null);
            setActiveActivity(undefined);
            setSelectedType(null); // Reset selected type for new activity
            setHideExactAddress(false);
        }
    }, [selectedActivity, clickedDate])
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
    useEffect(() => {
        if (connections.length > 0) {
            setAvailableFriends(connections.map(conn => conn.sender.id == currentUser?.id ? conn.receiver : conn.sender))
        }
    }, [connections])
    // Handle image upload
    const handleImageUpload = async (file: File) => {
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Please upload an image file');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('Image size should be less than 5MB');
            return;
        }

        setUploadedImage(file);
        setImagePreview(URL.createObjectURL(file));
    };

    // Handle friend selection
    const handleFriendSelection = (friend: Profile) => {
        setSelectedFriends(prev => {
            const isSelected = prev.some(f => f.id === friend.id);
            if (isSelected) {
                return prev.filter(f => f.id !== friend.id);
            } else {
                return [...prev, friend];
            }
        });
    };
    // Handle participant invitation
    const handleInviteParticipants = async (activityId: string, userIds: string[]) => {
        try {
            await dispatch(inviteParticipants({ activityId, userIds })).unwrap();
        } catch (error) {
            console.error('Error inviting participants:', error);
        }
    };

    // Handle friend invitation
    const handleInviteFriends = async () => {
        // if (!selectedActivity) return;

        try {
            // const userIds = selectedFriends.map(friend => friend.id);
            // await handleInviteParticipants(selectedActivity.id, userIds);
            setShowFriendSelector(false);
            // setSelectedFriends([]);
        } catch (error) {
            console.error('Error inviting friends:', error);
        }
    };
    // Handle activity update
    const handleUpdateActivity = async (id: string, updates: Partial<Activity>) => {
        try {
            let imageUrl: string | undefined = updates.image_url;

            // Upload new image if one was selected
            if (uploadedImage && currentUser) {
                const uploadedUrl = await activityService.uploadImageToStorage(uploadedImage, currentUser.id);
                imageUrl = uploadedUrl || undefined;
            }

            const updatedActivity: Partial<Activity> = {
                ...updates,
                updated_at: new Date().toISOString(),
                image_url: imageUrl || updates.image_url,
                hide_exact_address: hideExactAddress,
            };

            await dispatch(updateActivity({ id, updates: updatedActivity })).unwrap();
            dispatch(setSelectedActivity(null));
            dispatch(setShowCreateModal(false));
            setUploadedImage(null);
            setImagePreview(null);
        } catch (error) {
            console.error('Error updating activity:', error);
        }
    };
    // Handle activity creation
    const handleCreateActivity = async (activityData: Partial<Activity>) => {
        if (!currentUser) return;

        try {
            let imageUrl: string | undefined = activityData.image_url;

            // Upload image if one was selected
            if (uploadedImage && currentUser) {
                const uploadedUrl = await activityService.uploadImageToStorage(uploadedImage, currentUser.id);
                imageUrl = uploadedUrl || undefined;
            }

            const newActivity: Partial<Activity> = {
                ...activityData,
                creator_id: currentUser.id,
                status: 'upcoming' as ActivityStatus,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                image_url: imageUrl || getDefaultImage(activityData.type as ActivityType),
                hide_exact_address: hideExactAddress,
            };

            await dispatch(createActivity(newActivity)).unwrap();
            dispatch(setShowCreateModal(false))
            setUploadedImage(null);
            setImagePreview(null);
        } catch (error) {
            console.error('Error creating activity:', error);
        }
    };

    console.log('filtered friends', availableFriends
        .filter(af => {
            // const participants = selectedActivity?.participants;
            if (!selectedActivity?.participants?.find(p => p.user.id == af.id)) {
                return af
            }
        }))
    console.log('participants:', selectedActivity?.participants)
    // Determine which type options to show
    const typeOptions = tab === 'activity' ? activityTypes : eventTypes;
    // Ensure selectedType is always valid for the current tab
    useEffect(() => {
        if (tab === 'activity' && !activityTypes.includes(selectedType as ActivityType)) {
            setSelectedType(activityTypes[0]);
        } else if (tab === 'event' && !eventTypes.includes(selectedType || '')) {
            setSelectedType(eventTypes[0] as ActivityType);
        }
    }, [tab]);
    return (
        <Modal
            open={showCreateModal}
            onCancel={() => {
                dispatch(setShowCreateModal(false));
                dispatch(setSelectedActivity(null));
                onClose?.();
            }}
            title={
                selectedActivity ? 'Edit Activity' : 'Create New Activity'
            }
            width={750}
            className={effectiveTheme === 'dark' ? 'dark-modal' : ''}
            footer={
                <div className="flex justify-between items-center">
                    <div className="flex space-x-3">
                        {selectedActivity && (
                            <button
                                type="button"
                                onClick={() => setShowShareModal(true)}
                                className={`px-4 py-2 border rounded-lg transition-colors flex items-center ${
                                    effectiveTheme === 'dark' 
                                        ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                                }`}
                            >
                                <i className="fas fa-share-alt mr-2"></i>
                                Share
                            </button>
                        )}
                    </div>
                    <div className="flex space-x-3">
                        <button
                            type="button"
                            onClick={() => {
                                dispatch(setShowCreateModal(false));
                                dispatch(setSelectedActivity(null));
                                onClose?.();
                            }}
                            className={`px-4 py-2 border rounded-lg transition-colors ${
                                effectiveTheme === 'dark' 
                                    ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                            }`}
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={() => formRef.current?.requestSubmit()}
                            className={`px-4 py-2 ${currentColor.primary} text-white rounded-lg hover:${currentColor.hover} transition-colors flex items-center justify-center min-w-[120px]`}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <span className="flex items-center justify-center">
                                    <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></span>
                                    {activeActivity ? (tab === 'activity' ? 'Updating Activity...' : 'Updating Event...') : (tab === 'activity' ? 'Creating Activity...' : 'Creating Event...')}
                                </span>
                            ) : (
                                activeActivity ? (tab === 'activity' ? 'Update Activity' : 'Update Event') : (tab === 'activity' ? 'Create Activity' : 'Create Event')
                            )}
                        </button>
                    </div>
                </div>
            }
        >
            <div>
                {/* Tab Switcher */}
                <div className={`flex mb-6 border-b ${effectiveTheme === 'dark' ? 'border-gray-600' : 'border-gray-200'}`}>
                    <button
                        className={`px-6 py-2 font-semibold focus:outline-none ${tab === 'activity' ? `border-b-2 ${currentColor.primary} ${currentColor.primary}` : effectiveTheme === 'dark' ? 'text-gray-400' : 'text-gray-400'}`}
                        onClick={() => setTab('activity')}
                        type="button"
                    >
                        Activity
                    </button>
                    <button
                        className={`px-6 py-2 font-semibold focus:outline-none ${tab === 'event' ? `border-b-2 ${currentColor.primary} ${currentColor.primary}` : effectiveTheme === 'dark' ? 'text-gray-400' : 'text-gray-400'}`}
                        onClick={() => setTab('event')}
                        type="button"
                    >
                        Event
                    </button>
                </div>
                <div className=" flex items-center justify-center p-4 overflow-y-auto">
                    <div className={`${effectiveTheme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg w-full max-w-3xl`}>
                        <div className="">
                            <form
                                ref={formRef}
                                onSubmit={async (e) => {
                                    e.preventDefault();
                                    setIsSubmitting(true);
                                    try {
                                        const formData = new FormData(e.currentTarget);
                                        const activityData: Partial<Activity> = {
                                            title: formData.get('title') as string,
                                            type: selectedType || (formData.get('type') as ActivityType),
                                            start_datetime: dateRange ? dateRange[0].toISOString() : '',
                                            end_datetime: dateRange ? dateRange[1].toISOString() : '',
                                            location: formData.get('location') as string,
                                            description: formData.get('description') as string,
                                            max_participants: parseInt(formData.get('max_participants') as string),
                                            privacy: formData.get('privacy') as 'public' | 'connections' | 'private',
                                            // image_url: activeActivity?.image_url
                                        };

                                        if (activeActivity) {
                                            const userIds = selectedFriends.map(friend => friend.id)
                                            await handleInviteParticipants(activeActivity.id, userIds)
                                            await handleUpdateActivity(activeActivity.id, activityData);
                                        } else {
                                            await handleCreateActivity(activityData);
                                        }
                                    } finally {
                                        setIsSubmitting(false);
                                    }
                                }}
                                className="space-y-4"
                            >
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="activity-title" className={`block text-sm font-medium pb-1 ${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                            {tab === 'activity' ? 'Activity Title' : 'Event Title'}
                                        </label>
                                        <input
                                            id="activity-title"
                                            name="title"
                                            type="text"
                                            // value={activeActivity?.title}
                                            defaultValue={activeActivity?.title}
                                            placeholder={tab === 'activity' ? 'Enter a title for your activity' : 'Enter a title for your event'}
                                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-${currentColor.primary} mb-0 ${
                                                effectiveTheme === 'dark'
                                                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                                                    : 'border-gray-300 text-gray-900 placeholder-gray-500'
                                            }`}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="activity-location" className={`block text-sm font-medium mb-1 ${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                            Place
                                        </label>
                                        <div className="flex space-x-2 items-center">
                                            <input
                                                id="activity-location"
                                                name="location"
                                                type="text"
                                                defaultValue={activeActivity?.location}
                                                placeholder="Enter place (businesses can advertise here)"
                                                className={`flex-1 px-3 py-2 border-2 border-yellow-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 ${
                                                    effectiveTheme === 'dark' ? 'bg-gray-700 text-white placeholder-gray-400' : 'bg-white text-gray-900 placeholder-gray-500'
                                                }`}
                                                required
                                            />
                                            <button 
                                                type="button" 
                                                onClick={openMapForLocation}
                                                className={`px-4 py-2 ${currentColor.primary} text-white rounded-lg hover:${currentColor.hover} transition-colors`}
                                                title="Select location from map"
                                            >
                                                <i className="fas fa-map-marker-alt"></i>
                                            </button>
                                        </div>
                                        <div className={`text-xs mt-1 ${effectiveTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                            <label className="inline-flex items-center">
                                                <input
                                                    type="checkbox"
                                                    checked={hideExactAddress}
                                                    onChange={e => setHideExactAddress(e.target.checked)}
                                                    className="mr-2"
                                                />
                                                Hide exact address until accepted
                                            </label>
                                            <div className="ml-6">Only accepted participants will see the full address if this is checked.</div>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className={`block text-sm font-medium pb-1 ${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{tab === 'activity' ? 'Activity Type' : 'Event Type'}</label>
                                    <div className="flex gap-4">
                                        {typeOptions.map((type) => (
                                            <button
                                                key={type}
                                                type="button"
                                                onClick={() => setSelectedType(type as ActivityType)}
                                                className={`px-4 py-1 border rounded-lg flex flex-col items-center justify-center transition-colors ${(selectedType || activeActivity?.type) === type
                                                    ? `border-${currentColor.primary} ${effectiveTheme === 'dark' ? 'bg-gray-700' : 'bg-indigo-50'}`
                                                    : `${effectiveTheme === 'dark' ? 'border-gray-600 hover:border-gray-500 hover:bg-gray-700' : 'border-gray-200 hover:border-indigo-500 hover:bg-indigo-50'}`
                                                    }`}
                                            >
                                                <i className={`fas fa-${type === 'Outdoor' ? 'hiking' :
                                                    type === 'Indoor' ? 'home' :
                                                        type === 'Social' ? 'users' :
                                                            type === 'Arts' ? 'palette' :
                                                                type === 'Food' ? 'utensils' :
                                                                    type === 'Fitness' ? 'dumbbell' :
                                                                        type === 'Concert' ? 'music' :
                                                                            type === 'Workshop' ? 'chalkboard-teacher' :
                                                                                type === 'Meetup' ? 'users' :
                                                                                    type === 'Party' ? 'glass-cheers' :
                                                                                        type === 'Conference' ? 'microphone' :
                                                                                            type === 'Fundraiser' ? 'hand-holding-usd' :
                                                                                                type === 'Festival' ? 'theater-masks' :
                                                                                                    type === 'Seminar' ? 'book-open' :
                                                                                                        'calendar'
                                                    } text-2xl ${(selectedType || activeActivity?.type) === type ? `${currentColor.primary}` : effectiveTheme === 'dark' ? 'text-gray-400' : 'text-gray-400'
                                                    }`}></i>
                                                <span className={`text-sm ${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{type}</span>
                                            </button>
                                        ))}
                                    </div>
                                    <input
                                        type="hidden"
                                        name="type"
                                        value={selectedType || activeActivity?.type || typeOptions[0]}
                                    />
                                </div>

                                <div className="">
                                    <label htmlFor='startAndEndTime' className={`block ${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`} >
                                        Start-End Time
                                    </label>
                                    <RangePicker
                                        showTime
                                        value={dateRange}
                                        onChange={(dates) => setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs] | null)}
                                        className={effectiveTheme === 'dark' ? 'dark-theme-picker' : ''}
                                        style={{
                                            backgroundColor: effectiveTheme === 'dark' ? '#374151' : undefined,
                                            borderColor: effectiveTheme === 'dark' ? '#4B5563' : undefined,
                                            color: effectiveTheme === 'dark' ? '#F9FAFB' : undefined
                                        }}
                                    />
                                </div>
                                <div>
                                    <label htmlFor="activity-description" className={`block text-sm font-medium mb-1 ${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Description
                                    </label>
                                    <textarea
                                        id="activity-description"
                                        name="description"
                                        defaultValue={activeActivity?.description}
                                        placeholder={tab === 'activity' ? 'Describe your activity...' : 'Describe your event...'}
                                        rows={2}
                                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-${currentColor.primary} ${
                                            effectiveTheme === 'dark'
                                                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                                                : 'border-gray-300 text-gray-900 placeholder-gray-500'
                                        }`}
                                        required
                                    ></textarea>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="max-participants" className={`block text-sm font-medium mb-1 ${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                            Maximum Participants
                                        </label>
                                        <input
                                            id="max-participants"
                                            name="max_participants"
                                            type="number"
                                            min="1"
                                            defaultValue={activeActivity?.max_participants || 8}
                                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-${currentColor.primary} ${
                                                effectiveTheme === 'dark'
                                                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                                                    : 'border-gray-300 text-gray-900 placeholder-gray-500'
                                            }`}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className={`block text-sm font-medium mb-1 ${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Privacy</label>
                                        <div className="relative">
                                            <select
                                                name="privacy"
                                                defaultValue={activeActivity?.privacy || 'public'}
                                                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-${currentColor.primary} appearance-none ${
                                                    effectiveTheme === 'dark'
                                                        ? 'bg-gray-700 border-gray-600 text-white'
                                                        : 'border-gray-300 text-gray-900'
                                                }`}
                                                required
                                            >
                                                <option value="public">Public - Anyone can join</option>
                                                <option value="connections">Connections Only</option>
                                                <option value="private">Private - Invite only</option>
                                            </select>
                                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                                <i className={`fas fa-chevron-down ${effectiveTheme === 'dark' ? 'text-gray-400' : 'text-gray-400'}`}></i>
                                            </div>
                                        </div>
                                    </div>
                                </div>


                                {(activeActivity?.participants?.length ?? 0) > 0 && <div>
                                    <label className={`block text-sm font-medium mb-1 ${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Participants</label>
                                    <div className="flex flex-wrap gap-2 mb-2">
                                        {activeActivity?.participants
                                            // .filter(p => p.status === 'accepted')
                                            .map(participant => (
                                                <div key={participant.id} className={`flex items-center space-x-2 px-3 py-2 rounded-full ${
                                                    effectiveTheme === 'dark' ? 'bg-gray-700' : 'bg-indigo-50'
                                                }`}>
                                                    <img
                                                        src={participant.user.photo_url}
                                                        alt={participant.user.name}
                                                        className={`w-6 h-6 rounded-full object-cover ${effectiveTheme === 'dark' ? 'filter brightness-90' : ''}`}
                                                    />
                                                    <span className={`text-sm ${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{participant.user.name}</span>
                                                    <button
                                                        type="button"
                                                        className={`${effectiveTheme === 'dark' ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
                                                    >
                                                        <i className="fas fa-times"></i>
                                                    </button>
                                                </div>
                                            ))}
                                    </div>
                                </div>}
                                {activeActivity?.id && (<div>
                                    <label className={`block text-sm font-medium mb-1 ${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Invite Friends</label>
                                    <div className="flex flex-wrap gap-2 mb-2">
                                        {selectedFriends
                                            // .filter(p => p.status === 'invited' || p.status === 'accepted')
                                            .map(participant => (
                                                <div key={participant.id} className={`flex items-center space-x-2 px-3 py-2 rounded-full ${
                                                    effectiveTheme === 'dark' ? 'bg-gray-700' : 'bg-indigo-50'
                                                }`}>
                                                    <img
                                                        src={participant.photo_url}
                                                        alt={participant.name}
                                                        className={`w-6 h-6 rounded-full object-cover ${effectiveTheme === 'dark' ? 'filter brightness-90' : ''}`}
                                                    />
                                                    <span className={`text-sm ${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{participant.name}</span>
                                                    <button
                                                        type="button"
                                                        className={`${effectiveTheme === 'dark' ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
                                                        onClick={() => handleFriendSelection(participant)}
                                                    >
                                                        <i className="fas fa-times"></i>
                                                    </button>
                                                </div>
                                            ))}
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowFriendSelector(true);
                                            }}
                                            className={`flex items-center space-x-2 px-3 py-2 border rounded-full transition-colors ${
                                                effectiveTheme === 'dark'
                                                    ? 'border-gray-600 hover:border-gray-500 hover:bg-gray-700 text-gray-300'
                                                    : 'border-gray-300 hover:border-indigo-500 hover:bg-indigo-50 text-gray-700'
                                            }`}
                                        >
                                            <i className={`fas fa-plus ${currentColor.primary}`}></i>
                                            <span className="text-sm">Add Friends</span>
                                        </button>
                                    </div>
                                </div>
                                )}
                                <div>
                                    <label className={`block text-sm font-medium mb-1 ${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                        {tab === 'activity' ? 'Activity Image' : 'Event Image'}
                                    </label>
                                    <div className="mt-1 flex items-center space-x-4">
                                        <div className="flex-shrink-0 h-32 w-32 relative">
                                            <img
                                                src={imagePreview || activeActivity?.image_url || getDefaultImage(selectedType || 'Outdoor')}
                                                alt="Activity preview"
                                                className={`h-32 w-32 object-cover rounded-lg ${effectiveTheme === 'dark' ? 'filter brightness-90' : ''}`}
                                            />
                                            {isUploading && (
                                                <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-grow">
                                            <label className={`cursor-pointer inline-flex items-center px-4 py-2 border rounded-md shadow-sm text-sm font-medium transition-colors ${
                                                effectiveTheme === 'dark'
                                                    ? 'border-gray-600 text-gray-300 bg-gray-700 hover:bg-gray-600 focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500'
                                                    : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                                            }`}>
                                                <i className="fas fa-upload mr-2"></i>
                                                Upload Image
                                                <input
                                                    type="file"
                                                    className="hidden"
                                                    accept="image/*"
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file) handleImageUpload(file);
                                                    }}
                                                />
                                            </label>
                                            <p className={`mt-1 text-xs ${effectiveTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                                PNG, JPG, GIF up to 5MB
                                            </p>
                                        </div>
                                    </div>
                                </div>


                            </form>
                        </div>
                    </div>
                </div>

                {
                    showFriendSelector && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                            <div className={`${effectiveTheme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg w-full max-w-md`}>
                                <div className="p-6">
                                    <div className="flex justify-between items-center mb-6">
                                        <h3 className={`text-xl font-semibold ${effectiveTheme === 'dark' ? 'text-white' : 'text-gray-800'}`}>Invite Friends</h3>
                                        <button
                                            onClick={() => {
                                                setShowFriendSelector(false);
                                                setSelectedFriends([]);
                                            }}
                                            className={`${effectiveTheme === 'dark' ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
                                        >
                                            <i className="fas fa-times"></i>
                                        </button>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="max-h-96 overflow-y-auto">
                                            {availableFriends
                                                .filter(af => {
                                                    // const participants = selectedActivity?.participants;
                                                    if (!selectedActivity?.participants?.find(p => p.user.id == af.id)) {
                                                        return af
                                                    }
                                                })
                                                .map(friend => (
                                                    <div
                                                        key={friend.id}
                                                        onClick={() => handleFriendSelection(friend)}
                                                        className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer ${selectedFriends.some(f => f.id === friend.id)
                                                            ? effectiveTheme === 'dark' ? 'bg-gray-700 border border-gray-600' : 'bg-indigo-50 border border-indigo-200'
                                                            : effectiveTheme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                                                            }`}
                                                    >
                                                        <img
                                                            src={friend.photo_url}
                                                            alt={friend.name}
                                                            className={`w-10 h-10 rounded-full object-cover ${effectiveTheme === 'dark' ? 'filter brightness-90' : ''}`}
                                                        />
                                                        <span className={`${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-800'}`}>{friend.name}</span>
                                                        {selectedFriends.some(f => f.id === friend.id) && (
                                                            <i className={`fas fa-check ${currentColor.primary} ml-auto`}></i>
                                                        )}
                                                    </div>
                                                ))}
                                        </div>
                                        <div className="flex justify-end space-x-3 pt-4 border-t">
                                            <button
                                                onClick={() => {
                                                    setShowFriendSelector(false);
                                                    setSelectedFriends([]);
                                                }}
                                                className={`px-4 py-2 border rounded-lg transition-colors ${
                                                    effectiveTheme === 'dark' 
                                                        ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                                                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                                                }`}
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleInviteFriends}
                                                className={`px-4 py-2 ${currentColor.primary} text-white rounded-lg hover:${currentColor.hover}`}
                                            >
                                                Invite Selected Friends
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                }
            </div>

            {/* Share Modal */}
            {selectedActivity && (
                <ShareActivityModal
                    activity={selectedActivity}
                    visible={showShareModal}
                    onClose={() => setShowShareModal(false)}
                />
            )}

            {/* Map Selection Modal */}
            <Modal
                open={showMapModal}
                onCancel={() => setShowMapModal(false)}
                title="Select Location"
                width={800}
                className={effectiveTheme === 'dark' ? 'dark-modal' : ''}
                footer={[
                    <button
                        key="cancel"
                        onClick={() => setShowMapModal(false)}
                        className={`px-4 py-2 border rounded-lg transition-colors ${
                            effectiveTheme === 'dark' 
                                ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                        Cancel
                    </button>,
                    <button
                        key="confirm"
                        onClick={() => {
                            if (selectedLocation) {
                                handleMapLocationSelect(selectedLocation);
                            }
                        }}
                        className={`px-4 py-2 ${currentColor.primary} text-white rounded-lg hover:${currentColor.hover} ml-2`}
                    >
                        Confirm Location
                    </button>
                ]}
            >
                <div className="space-y-4">
                    <div>
                        <label className={`block text-sm font-medium mb-2 ${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                            Search for a location
                        </label>
                        <div className="flex space-x-2">
                            <input
                                type="text"
                                placeholder="Search for places, addresses, or landmarks..."
                                value={selectedLocation}
                                onChange={(e) => setSelectedLocation(e.target.value)}
                                className={`flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-${currentColor.primary} ${
                                    effectiveTheme === 'dark'
                                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                                        : 'border-gray-300 text-gray-900 placeholder-gray-500'
                                }`}
                            />
                            <button
                                type="button"
                                onClick={() => {
                                    if (selectedLocation) {
                                        const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedLocation)}`;
                                        window.open(mapUrl, '_blank');
                                    }
                                }}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                            >
                                <i className="fas fa-search mr-2"></i>
                                Search
                            </button>
                        </div>
                    </div>
                    
                    <div className={`${effectiveTheme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'} p-4 rounded-lg`}>
                        <h4 className={`font-medium mb-2 ${effectiveTheme === 'dark' ? 'text-white' : 'text-gray-800'}`}>Quick Location Options</h4>
                        <div className="grid grid-cols-2 gap-2">
                            {[
                                'Restaurant',
                                'Cafe',
                                'Park',
                                'Gym',
                                'Museum',
                                'Theater',
                                'Library',
                                'Shopping Center'
                            ].map((place) => (
                                <button
                                    key={place}
                                    type="button"
                                    onClick={() => setSelectedLocation(place)}
                                    className={`px-3 py-2 text-sm border rounded-lg transition-colors ${
                                        effectiveTheme === 'dark'
                                            ? 'border-gray-600 hover:bg-gray-600 hover:border-gray-500 text-gray-300 text-left'
                                            : 'border-gray-300 hover:bg-white hover:border-indigo-500 text-gray-700 text-left'
                                    }`}
                                >
                                    {place}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className={`text-sm ${effectiveTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        <p><strong>Tip:</strong> Click "Search" to open Google Maps and find the exact location. You can then copy the address and paste it back here.</p>
                    </div>
                </div>
            </Modal>
        </Modal>
    )
}

export default EditEventModal