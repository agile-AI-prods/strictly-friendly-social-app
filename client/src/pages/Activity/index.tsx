// The exported code uses Tailwind CSS. Install Tailwind CSS in your dev environment to ensure all styles work.
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import {
    fetchActivities,
    createActivity,
    updateActivity,
    deleteActivity,
    inviteParticipants,
    updateParticipantStatus,
    setFilters,
    clearFilters,
    type Activity as ActivityType,
    type ActivityType as ActivityTypeOption,
    ActivityStatus,
    ParticipantStatus,
    setShowCreateModal,
    setSelectedActivity,
} from '../../store/slices/activitySlice';
import ActivityCard from './ActivityCard';
import { useCalendarApp } from '@schedule-x/react'
import {
    createViewDay,
    createViewMonthAgenda,
    createViewMonthGrid,
    createViewWeek,
} from '@schedule-x/calendar'
import { createEventsServicePlugin } from '@schedule-x/events-service'
import { createDragAndDropPlugin } from '@schedule-x/drag-and-drop'
import { createEventModalPlugin } from '@schedule-x/event-modal'
import { format } from 'date-fns';
import type { Activity } from '../../store/slices/activitySlice';
import { notification } from 'antd';
import { useTheme } from '../../context/ThemeContext';

import '@schedule-x/theme-default/dist/index.css'
import { fetchConnectedConnections, selectConnectedConnections } from '../../store/slices/connectionSlice';
import { Connection, Profile } from '../../types';
import SmartCalendar from './SmartCalendar';
// 1. Define calendar color themes
const calendars = {
    personal: {
        colorName: 'personal',
        lightColors: { main: '#f9d71c', container: '#fff5aa', onContainer: '#594800' },
        darkColors: { main: '#fff5c0', onContainer: '#fff5de', container: '#a29742' },
    },
    work: {
        colorName: 'work',
        lightColors: { main: '#f91c45', container: '#ffd2dc', onContainer: '#59000d' },
        darkColors: { main: '#ffc0cc', onContainer: '#ffdee6', container: '#a24258' },
    },
    leisure: {
        colorName: 'leisure',
        lightColors: { main: '#1cf9b0', container: '#dafff0', onContainer: '#004d3d' },
        darkColors: { main: '#c0fff5', onContainer: '#e6fff5', container: '#42a297' },
    },
    school: {
        colorName: 'school',
        lightColors: { main: '#1c7df9', container: '#d2e7ff', onContainer: '#002859' },
        darkColors: { main: '#c0dfff', onContainer: '#dee6ff', container: '#426aa2' },
    },
};

// 2. Map activity type to calendarId
function getCalendarIdForActivity(activity: Activity) {
    switch (activity.type) {
        case 'Outdoor':
        case 'Fitness':
            return 'personal';
        case 'Social':
        case 'Food':
            return 'leisure';
        case 'Arts':
            return 'school';
        case 'Indoor':
            return 'work';
        default:
            return 'personal';
    }
}

const Activity = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { effectiveTheme, currentColor, getFontSizeClassForElement } = useTheme();
    const user = useSelector((state: RootState) => state.auth.user);
    const {
        activities,
        loading,
        error,
        filters,
        selectedActivity,
        activityTypes,
        eventOptions,
        placeOptions
    } = useSelector((state: RootState) => state.activities);

    const [activeActivityTab, setActiveActivityTab] = useState('upcoming');
    const [filterOpen, setFilterOpen] = useState(false);
    const [activeFilterTab, setActiveFilterTab] = useState('type');

    const [showFriendSelector, setShowFriendSelector] = useState(false);
    const [availableFriends, setAvailableFriends] = useState<Profile[]>([]);
    const [selectedFriends, setSelectedFriends] = useState<Profile[]>([]);
    const [uploadedImage, setUploadedImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [showJoinedOnly, setShowJoinedOnly] = useState(false);
    const connections = useSelector(selectConnectedConnections) as Connection[];
    // Current date for the calendar

    const eventsService = useState(() => createEventsServicePlugin())[0]

    // 3. Map activities to Schedule X event format, assign calendarId
    const scheduleXEvents = useMemo(() => activities.map(activity => ({
        ...activity,
        id: activity.id,
        title: activity.title,
        start: format(new Date(activity.start_datetime), 'yyyy-MM-dd HH:mm'),
        end: format(new Date(activity.end_datetime), 'yyyy-MM-dd HH:mm'),
        description: activity.description,
        location: activity.location,
        people: activity.participants?.map(p => p.user.name),
        calendarId: getCalendarIdForActivity(activity),
    })), [activities]);
    console.log(scheduleXEvents)
    const dragAndDropPlugin = createDragAndDropPlugin(30);
    const isEventEditable = (event: any) => event.creator_id === user?.id;
    // Handler for event updates (drag/move) permission
    const onBeforeEventUpdate = (oldEvent: any, newEvent: any) => {
        if (!isEventEditable(oldEvent)) {
            notification.warning({
                message: 'Permission Denied',
                description: 'You can only move or edit activities you created.'
            });
            return false; // Block the update
        }
        return true; // Allow the update
    };
    // const customComponents = {
    //     eventModal: ({ calendarEvent }: { calendarEvent: Activity }) => {
    //         return (
    //             <div
    //                 style={{
    //                     padding: "40px",
    //                     background: "yellow",
    //                     color: "black",
    //                     borderRadius: "24px",
    //                     border: "1px solid black",
    //                     fontSize: "24px",
    //                     fontWeight: "bold",
    //                 }}
    //             >
    //                 {calendarEvent.title}
    //             </div>
    //         );
    //     },
    // }

    const calendar = useCalendarApp({
        views: [createViewDay(), createViewWeek(), createViewMonthGrid(), createViewMonthAgenda()],
        calendars,
        plugins: [eventsService, dragAndDropPlugin, createEventModalPlugin()],
        // Workaround: enforce permissions in event update handler since isEventDraggable is not supported in this version
        callbacks: { onBeforeEventUpdate }
    })
    console.log(calendar)
    useEffect(() => {
        if (scheduleXEvents.length > 0) {
            console.log('eventService is called')
            eventsService.set(scheduleXEvents)
        }
    }, [scheduleXEvents])
    useEffect(() => {
        // get all events
        // eventsService.getAll()
    }, [])
    // Fetch activities on component mount
    useEffect(() => {
        if (user) {
            dispatch(fetchActivities());
            dispatch(fetchConnectedConnections())
        }
    }, [dispatch, user]);

    // Filter activities based on joined status
    const filterActivities = (activities: ActivityType[], tab: string) => {
        let filtered = activities;
        const now = new Date();

        console.log('Initial activities count:', activities.length);
        console.log('Current filters:', filters);

        // Filter by tab
        if (tab === 'upcoming') {
            filtered = filtered.filter(activity => new Date(activity.start_datetime) > now);
        } else if (tab === 'past') {
            filtered = filtered.filter(activity => new Date(activity.end_datetime) < now);
        } else if (tab === 'mine') {
            filtered = filtered.filter(activity =>
                activity.creator_id === user?.id ||
                activity.participants?.some(p => p.user_id === user?.id)
            );
        }

        console.log('After tab filter:', filtered.length);

        // Filter by activity type if any types are selected
        if (filters.type.length > 0) {
            filtered = filtered.filter(activity => filters.type.includes(activity.type));
            console.log('After type filter:', filtered.length);
        }

        // Filter by event type if any events are selected
        if (filters.event.length > 0) {
            filtered = filtered.filter(activity => {
                // Check if activity title or description contains any of the selected event types
                const activityText = `${activity.title} ${activity.description}`.toLowerCase();
                return filters.event.some(event =>
                    activityText.includes(event.toLowerCase())
                );
            });
            console.log('After event filter:', filtered.length);
        }

        // Filter by place if any places are selected
        if (filters.place.length > 0) {
            filtered = filtered.filter(activity => {
                // Check if activity location contains any of the selected places
                const locationText = activity.location.toLowerCase();
                return filters.place.some(place =>
                    locationText.includes(place.toLowerCase())
                );
            });
            console.log('After place filter:', filtered.length);
        }

        // Filter by search query
        if (filters.searchQuery) {
            const searchLower = filters.searchQuery.toLowerCase();
            filtered = filtered.filter(activity =>
                activity.title.toLowerCase().includes(searchLower) ||
                activity.description.toLowerCase().includes(searchLower) ||
                activity.location.toLowerCase().includes(searchLower)
            );
            console.log('After search filter:', filtered.length);
        }

        // Filter by joined status
        if (showJoinedOnly) {
            filtered = filtered.filter(activity => hasJoinedActivity(activity));
        }

        // Filter by date
        if (filters.date) {
            filtered = filtered.filter(activity => activity.start_datetime.split('T')[0] === filters.date);
            console.log('After date filter:', filtered.length);
        }

        console.log('Final filtered activities:', filtered.length);
        return filtered;
    };

    // Check if user has joined an activity
    const hasJoinedActivity = (activity: ActivityType) => {
        return activity.participants?.some(p => p.user_id === user?.id);
    };

    // Toggle activity type filter
    const toggleActivityTypeFilter = (type: ActivityTypeOption) => {
        const newTypes = filters.type.includes(type)
            ? filters.type.filter((t: ActivityTypeOption) => t !== type)
            : [...filters.type, type];
        dispatch(setFilters({ type: newTypes }));
    };

    // Toggle event filter
    const toggleEventFilter = (event: string) => {
        const newEvents = filters.event.includes(event)
            ? filters.event.filter((e: string) => e !== event)
            : [...filters.event, event];
        dispatch(setFilters({ event: newEvents }));
    };

    // Toggle place filter
    const togglePlaceFilter = (place: string) => {
        const newPlaces = filters.place.includes(place)
            ? filters.place.filter((p: string) => p !== place)
            : [...filters.place, place];
        dispatch(setFilters({ place: newPlaces }));
    };

    // Clear all filters
    const handleClearFilters = () => {
        dispatch(clearFilters());
    };

    if (!user) return null;

    return (
        <div className={`min-h-screen py-4 sm:py-8 ${effectiveTheme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'
            }`}>
            <div className="container mx-auto px-2 sm:px-4">

                {/* Calendar View */}
                <div className={`rounded-lg shadow-md p-2 sm:p-4 mb-4 sm:mb-6 ${effectiveTheme === 'dark' ? 'bg-gray-800' : 'bg-white'
                    }`}>
                    <SmartCalendar
                        events={activities}
                        onEditActivity={(activity) => {
                            console.log('activity:', activity)
                            dispatch(setSelectedActivity(activity));
                            dispatch(setShowCreateModal(true));
                        }}
                    />
                </div>
                {/* Activity Filters */}
                <div className={`rounded-lg shadow-md p-3 sm:p-4 mb-4 sm:mb-6 ${effectiveTheme === 'dark' ? 'bg-gray-800' : 'bg-white'
                    }`}>
                    <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:space-x-4">
                        <div className="flex-1">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search activities by title, description, or location"
                                    value={filters.searchQuery}
                                    onChange={(e) => dispatch(setFilters({ searchQuery: e.target.value }))}
                                    className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 text-sm ${effectiveTheme === 'dark'
                                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-green-500'
                                        : 'border-gray-300 focus:ring-indigo-500'
                                        }`}
                                />
                                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                                    <i className="fas fa-search"></i>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                            <div className="relative">
                                <input
                                    type="date"
                                    value={filters.date || ''}
                                    onChange={(e) => dispatch(setFilters({ date: e.target.value }))}
                                    className={`w-full sm:w-auto px-4 py-2 border rounded-lg text-sm ${effectiveTheme === 'dark'
                                        ? 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600'
                                        : 'border-gray-300 hover:bg-gray-50'
                                        }`}
                                    placeholder="Select date"
                                />
                            </div>
                            <div className="relative">
                                <button
                                    onClick={() => setFilterOpen(!filterOpen)}
                                    className={`flex items-center justify-center w-full sm:w-auto px-4 py-2 border rounded-lg text-sm ${effectiveTheme === 'dark'
                                        ? 'border-gray-600 bg-gray-700 text-white hover:bg-gray-600'
                                        : 'border-gray-300 hover:bg-gray-50'
                                        }`}
                                >
                                    <i className={`fas fa-filter mr-2 ${effectiveTheme === 'dark' ? 'text-green-500' : 'text-indigo-500'
                                        }`}></i>
                                    Filter
                                    <i className={`fas fa-chevron-${filterOpen ? 'up' : 'down'} ml-2 ${effectiveTheme === 'dark' ? 'text-gray-400' : 'text-gray-400'
                                        }`}></i>
                                </button>
                                {filterOpen && (
                                    <div className={`absolute right-0 mt-2 w-full sm:w-80 rounded-lg shadow-lg z-10 p-4 ${effectiveTheme === 'dark' ? 'bg-gray-800' : 'bg-white'
                                        }`}>
                                        <div className="flex flex-wrap gap-2 mb-4">
                                            <button
                                                onClick={() => setActiveFilterTab('type')}
                                                className={`px-3 py-1 text-sm rounded ${activeFilterTab === 'type'
                                                    ? `bg-${currentColor.primary} text-white`
                                                    : effectiveTheme === 'dark' ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-800'
                                                    }`}
                                            >
                                                Type
                                            </button>
                                            <button
                                                onClick={() => setActiveFilterTab('event')}
                                                className={`px-3 py-1 text-sm rounded ${activeFilterTab === 'event'
                                                    ? `bg-${currentColor.primary} text-white`
                                                    : effectiveTheme === 'dark' ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-800'
                                                    }`}
                                            >
                                                Event
                                            </button>
                                            <button
                                                onClick={() => setActiveFilterTab('place')}
                                                className={`px-3 py-1 text-sm rounded ${activeFilterTab === 'place'
                                                    ? `bg-${currentColor.primary} text-white`
                                                    : effectiveTheme === 'dark' ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-800'
                                                    }`}
                                            >
                                                Place
                                            </button>
                                        </div>

                                        {activeFilterTab === 'type' && (
                                            <div>
                                                <h3 className={`font-medium mb-3 ${effectiveTheme === 'dark' ? 'text-white' : 'text-gray-800'
                                                    }`}>Activity Type</h3>
                                                <div className="space-y-2 max-h-40 overflow-y-auto">
                                                    {activityTypes.map((type) => (
                                                        <div key={type} className="flex items-center">
                                                            <input
                                                                type="checkbox"
                                                                id={`type-${type}`}
                                                                checked={filters.type.includes(type)}
                                                                onChange={() => toggleActivityTypeFilter(type)}
                                                                className={`w-4 h-4 border rounded focus:ring-2 ${effectiveTheme === 'dark'
                                                                    ? 'text-green-500 border-gray-600 focus:ring-green-500'
                                                                    : 'text-indigo-600 border-gray-300 focus:ring-indigo-500'
                                                                    }`}
                                                            />
                                                            <label htmlFor={`type-${type}`} className={`ml-2 text-sm ${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                                                                }`}>
                                                                {type}
                                                            </label>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {activeFilterTab === 'event' && (
                                            <div>
                                                <h3 className={`font-medium mb-3 ${effectiveTheme === 'dark' ? 'text-white' : 'text-gray-800'
                                                    }`}>Event Type</h3>
                                                <div className="space-y-2 max-h-40 overflow-y-auto">
                                                    {eventOptions.map((event) => (
                                                        <div key={event} className="flex items-center">
                                                            <input
                                                                type="checkbox"
                                                                id={`event-${event}`}
                                                                checked={filters.event.includes(event)}
                                                                onChange={() => toggleEventFilter(event)}
                                                                className={`w-4 h-4 border rounded focus:ring-2 ${effectiveTheme === 'dark'
                                                                    ? 'text-green-500 border-gray-600 focus:ring-green-500'
                                                                    : 'text-indigo-600 border-gray-300 focus:ring-indigo-500'
                                                                    }`}
                                                            />
                                                            <label htmlFor={`event-${event}`} className={`ml-2 text-sm ${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                                                                }`}>
                                                                {event}
                                                            </label>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {activeFilterTab === 'place' && (
                                            <div>
                                                <h3 className={`font-medium mb-3 ${effectiveTheme === 'dark' ? 'text-white' : 'text-gray-800'
                                                    }`}>Place</h3>
                                                <div className="space-y-2 max-h-40 overflow-y-auto">
                                                    {placeOptions.map((place) => (
                                                        <div key={place} className="flex items-center">
                                                            <input
                                                                type="checkbox"
                                                                id={`place-${place}`}
                                                                checked={filters.place.includes(place)}
                                                                onChange={() => togglePlaceFilter(place)}
                                                                className={`w-4 h-4 border rounded focus:ring-2 ${effectiveTheme === 'dark'
                                                                    ? 'text-green-500 border-gray-600 focus:ring-green-500'
                                                                    : 'text-indigo-600 border-gray-300 focus:ring-indigo-500'
                                                                    }`}
                                                            />
                                                            <label htmlFor={`place-${place}`} className={`ml-2 text-sm ${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                                                                }`}>
                                                                {place}
                                                            </label>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <div className={`mt-4 pt-3 border-t flex justify-between ${effectiveTheme === 'dark' ? 'border-gray-700' : 'border-gray-100'
                                            }`}>
                                            <button
                                                onClick={handleClearFilters}
                                                className={`text-sm ${effectiveTheme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-800'
                                                    }`}
                                            >
                                                Clear All
                                            </button>
                                            <button
                                                onClick={() => setFilterOpen(false)}
                                                className={`text-sm text-white px-3 py-1 rounded ${effectiveTheme === 'dark' ? 'bg-green-600 hover:bg-green-700' : 'bg-indigo-600 hover:bg-indigo-700'
                                                    }`}
                                            >
                                                Apply
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    {/* Active Filters Display */}
                    {(filters.type.length > 0 || filters.date || filters.searchQuery || filters.event.length > 0 || filters.place.length > 0) && (
                        <div className="mt-4 flex flex-wrap items-center gap-2">
                            <span className={`text-sm ${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                                }`}>Active Filters:</span>
                            {filters.date && (
                                <span className={`text-xs px-3 py-1 rounded-full flex items-center ${effectiveTheme === 'dark' ? 'bg-green-900 text-green-200' : 'bg-indigo-100 text-indigo-800'
                                    }`}>
                                    {new Date(filters.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                    <button
                                        onClick={() => dispatch(setFilters({ date: null }))}
                                        className={`ml-2 ${effectiveTheme === 'dark' ? 'text-green-300 hover:text-green-100' : 'text-indigo-600 hover:text-indigo-800'
                                            }`}
                                    >
                                        <i className="fas fa-times"></i>
                                    </button>
                                </span>
                            )}
                            {filters.type.map(type => (
                                <span key={type} className={`text-xs px-3 py-1 rounded-full flex items-center ${effectiveTheme === 'dark' ? 'bg-green-900 text-green-200' : 'bg-indigo-100 text-indigo-800'
                                    }`}>
                                    {type}
                                    <button
                                        onClick={() => toggleActivityTypeFilter(type)}
                                        className={`ml-2 ${effectiveTheme === 'dark' ? 'text-green-300 hover:text-green-100' : 'text-indigo-600 hover:text-indigo-800'
                                            }`}
                                    >
                                        <i className="fas fa-times"></i>
                                    </button>
                                </span>
                            ))}
                            {filters.event.map(event => (
                                <span key={event} className={`text-xs px-3 py-1 rounded-full flex items-center ${effectiveTheme === 'dark' ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800'
                                    }`}>
                                    {event}
                                    <button
                                        onClick={() => toggleEventFilter(event)}
                                        className={`ml-2 ${effectiveTheme === 'dark' ? 'text-green-300 hover:text-green-100' : 'text-green-600 hover:text-green-800'
                                            }`}
                                    >
                                        <i className="fas fa-times"></i>
                                    </button>
                                </span>
                            ))}
                            {filters.place.map(place => (
                                <span key={place} className={`text-xs px-3 py-1 rounded-full flex items-center ${effectiveTheme === 'dark' ? 'bg-purple-900 text-purple-200' : 'bg-purple-100 text-purple-800'
                                    }`}>
                                    {place}
                                    <button
                                        onClick={() => togglePlaceFilter(place)}
                                        className={`ml-2 ${effectiveTheme === 'dark' ? 'text-purple-300 hover:text-purple-100' : 'text-purple-600 hover:text-purple-800'
                                            }`}
                                    >
                                        <i className="fas fa-times"></i>
                                    </button>
                                </span>
                            ))}
                            {filters.searchQuery && (
                                <span className={`text-xs px-3 py-1 rounded-full flex items-center ${effectiveTheme === 'dark' ? 'bg-green-900 text-green-200' : 'bg-indigo-100 text-indigo-800'
                                    }`}>
                                    "{filters.searchQuery}"
                                    <button
                                        onClick={() => dispatch(setFilters({ searchQuery: '' }))}
                                        className={`ml-2 ${effectiveTheme === 'dark' ? 'text-green-300 hover:text-green-100' : 'text-indigo-600 hover:text-indigo-800'
                                            }`}
                                    >
                                        <i className="fas fa-times"></i>
                                    </button>
                                </span>
                            )}
                            <button
                                onClick={handleClearFilters}
                                className={`text-xs ml-2 ${effectiveTheme === 'dark' ? 'text-green-400 hover:text-green-200' : 'text-indigo-600 hover:text-indigo-800'
                                    }`}
                            >
                                Clear All
                            </button>
                        </div>
                    )}
                </div>
                {/* Activity Tabs */}
                <div className={`rounded-lg shadow-md overflow-hidden ${effectiveTheme === 'dark' ? 'bg-gray-800' : 'bg-white'
                    }`}>
                    <div className={`flex flex-wrap border-b ${effectiveTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'
                        }`}>
                        <button
                            onClick={() => setActiveActivityTab('mine')}
                            className={`flex-1 min-w-[120px] py-3 px-2 sm:px-4 text-center font-medium text-xs sm:text-sm ${activeActivityTab === 'mine'
                                ? `text-${currentColor.primary} border-b-2 border-${currentColor.primary}`
                                : effectiveTheme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            My Activities
                        </button>
                        <button
                            onClick={() => setActiveActivityTab('upcoming')}
                            className={`flex-1 min-w-[120px] py-3 px-2 sm:px-4 text-center font-medium text-xs sm:text-sm ${activeActivityTab === 'upcoming'
                                ? `text-${currentColor.primary} border-b-2 border-${currentColor.primary}`
                                : effectiveTheme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Upcoming
                        </button>
                        <button
                            onClick={() => setActiveActivityTab('past')}
                            className={`flex-1 min-w-[120px] py-3 px-2 sm:px-4 text-center font-medium text-xs sm:text-sm ${activeActivityTab === 'past'
                                ? `text-${currentColor.primary} border-b-2 border-${currentColor.primary}`
                                : effectiveTheme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Past
                        </button>
                        <button
                            onClick={() => setActiveActivityTab('suggested')}
                            className={`flex-1 min-w-[120px] py-3 px-2 sm:px-4 text-center font-medium text-xs sm:text-sm ${activeActivityTab === 'suggested'
                                ? `text-${currentColor.primary} border-b-2 border-${currentColor.primary}`
                                : effectiveTheme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Suggested
                        </button>
                    </div>
                    {/* Activity List */}
                    <div className="p-2 sm:p-4">
                        {loading ? (
                            <div className="text-center py-12">
                                <div className={`animate-spin rounded-full h-12 w-12 border-b-2 mx-auto ${effectiveTheme === 'dark' ? 'border-green-500' : 'border-indigo-600'
                                    }`}></div>
                                <p className={`mt-4 ${effectiveTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                                    }`}>Loading activities...</p>
                            </div>
                        ) : error ? (
                            <div className="text-center py-12">
                                <div className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-4 ${effectiveTheme === 'dark' ? 'bg-red-900' : 'bg-red-100'
                                    }`}>
                                    <i className="fas fa-exclamation-circle text-red-500 text-2xl"></i>
                                </div>
                                <h3 className={`text-lg font-medium mb-2 ${effectiveTheme === 'dark' ? 'text-white' : 'text-gray-800'
                                    }`}>Error loading activities</h3>
                                <p className={`${effectiveTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                                    }`}>{error}</p>
                            </div>
                        ) : filterActivities(activities, activeActivityTab).length > 0 ? (
                            <div className="gap-2 sm:gap-3 lg:gap-4 w-full" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))' }}>

                                {activeActivityTab === 'mine' ? (
                                    <>
                                        <div className="col-span-full">

                                            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded">
                                                Created by Me
                                            </div>
                                            <div className="gap-2 sm:gap-3 lg:gap-4 w-full" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))' }}>
                                                {filterActivities(activities, activeActivityTab)
                                                    .filter(activity => activity.creator_id === user?.id)
                                                    .map((activity) => (
                                                        <ActivityCard activity={activity} activeActivityTab={activeActivityTab} key={activity.id} />
                                                    ))}
                                            </div>
                                        </div>
                                        <div className="col-span-full mt-8">

                                            <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-2 rounded">
                                                Joined Activities
                                            </div>
                                            <div className="gap-2 sm:gap-3 lg:gap-4 w-full" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))' }}>

                                                {filterActivities(activities, activeActivityTab)
                                                    .filter(activity => activity.creator_id !== user?.id)
                                                    .map((activity) => (
                                                        <ActivityCard activity={activity} activeActivityTab={activeActivityTab} key={activity.id} />
                                                    ))}
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    filterActivities(activities, activeActivityTab).map((activity) => (
                                        <ActivityCard activity={activity} activeActivityTab={activeActivityTab} key={activity.id} />
                                    ))
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <div className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-4 ${effectiveTheme === 'dark' ? 'bg-green-900' : 'bg-indigo-100'
                                    }`}>
                                    <i className={`fas fa-calendar-day text-2xl ${effectiveTheme === 'dark' ? 'text-green-500' : 'text-indigo-500'
                                        }`}></i>
                                </div>
                                <h3 className={`text-lg font-medium mb-2 ${effectiveTheme === 'dark' ? 'text-white' : 'text-gray-800'
                                    }`}>No activities found</h3>
                                <p className={`mb-6 ${effectiveTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                                    }`}>
                                    {activeActivityTab === 'upcoming'
                                        ? "You don't have any upcoming activities that match your filters."
                                        : activeActivityTab === 'past'
                                            ? "You don't have any past activities that match your filters."
                                            : "We don't have any suggested activities that match your filters right now."}
                                </p>
                                {activeActivityTab === 'upcoming' && (
                                    <button
                                        onClick={() => dispatch(setShowCreateModal(true))}
                                        className={`px-4 py-2 text-white rounded ${effectiveTheme === 'dark' ? 'bg-green-600 hover:bg-green-700' : 'bg-indigo-600 hover:bg-indigo-700'
                                            }`}
                                    >
                                        <i className="fas fa-plus mr-2"></i> Create New Activity
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

        </div>
    );
};

export default Activity;