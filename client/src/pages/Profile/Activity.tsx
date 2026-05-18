// The exported code uses Tailwind CSS. Install Tailwind CSS in your dev environment to ensure all styles work.
import React, { useState, useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import { Tabs } from 'antd';
import type { TabsProps } from 'antd';
const Activity = () => {
    const [activeTab, setActiveTab] = useState('activities');
    const [activeActivityTab, setActiveActivityTab] = useState('upcoming');
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [filterOpen, setFilterOpen] = useState(false);
    const [activityTypeFilter, setActivityTypeFilter] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const calendarRef = useRef<HTMLDivElement>(null);
    // Current date for the calendar
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    // Sample activities data
    const activities = [
        {
            id: 1,
            title: "Hiking at Mountain Ridge",
            type: "Outdoor",
            date: "2025-06-05",
            time: "09:00 AM",
            location: "Mountain Ridge Trail, Seattle",
            participants: 5,
            maxParticipants: 8,
            description: "A moderate 5-mile hike with beautiful views. Suitable for all experience levels.",
            creator: "Emma Wilson",
            image: "https://readdy.ai/api/search-image?query=beautiful%2520mountain%2520hiking%2520trail%2520with%2520lush%2520green%2520trees%2520and%2520clear%2520blue%2520sky%252C%2520scenic%2520landscape%2520view%2520from%2520mountain%2520ridge%252C%2520perfect%2520weather%2520for%2520hiking%252C%2520peaceful%2520nature%2520scene%2520with%2520distant%2520mountains%2520and%2520valleys&width=300&height=200&seq=hiking1&orientation=landscape"
        },
        {
            id: 2,
            title: "Board Game Night",
            type: "Indoor",
            date: "2025-06-10",
            time: "07:00 PM",
            location: "Meeple's Board Game Cafe, Downtown",
            participants: 6,
            maxParticipants: 8,
            description: "Join us for a fun evening of strategy and party games. Beginners welcome!",
            creator: "James Parker",
            image: "https://readdy.ai/api/search-image?query=cozy%2520board%2520game%2520cafe%2520with%2520wooden%2520tables%2520and%2520shelves%2520filled%2520with%2520board%2520games%252C%2520warm%2520ambient%2520lighting%252C%2520people%2520gathered%2520around%2520tables%2520playing%2520games%2520with%2520smiles%2520and%2520laughter%252C%2520casual%2520friendly%2520atmosphere&width=300&height=200&seq=boardgame1&orientation=landscape"
        },
        {
            id: 3,
            title: "Book Club Meeting",
            type: "Social",
            date: "2025-05-28",
            time: "06:30 PM",
            location: "Evergreen Library, Meeting Room 2",
            participants: 8,
            maxParticipants: 12,
            description: "We'll be discussing 'The Midnight Library' by Matt Haig. New members welcome!",
            creator: "Sophia Chen",
            image: "https://readdy.ai/api/search-image?query=modern%2520library%2520meeting%2520room%2520with%2520comfortable%2520chairs%2520arranged%2520in%2520a%2520circle%252C%2520bookshelves%2520lining%2520the%2520walls%252C%2520warm%2520lighting%252C%2520coffee%2520table%2520with%2520books%2520and%2520refreshments%252C%2520inviting%2520space%2520for%2520literary%2520discussion&width=300&height=200&seq=bookclub1&orientation=landscape"
        },
        {
            id: 4,
            title: "Jazz Concert",
            type: "Arts",
            date: "2025-05-25",
            time: "08:00 PM",
            location: "Blue Note Jazz Club, Capitol Hill",
            participants: 4,
            maxParticipants: 6,
            description: "An evening of live jazz featuring the Marcus Johnson Quartet. Dinner and drinks available.",
            creator: "Marcus Johnson",
            image: "https://readdy.ai/api/search-image?query=elegant%2520jazz%2520club%2520with%2520dim%2520blue%2520lighting%252C%2520stage%2520with%2520musicians%2520playing%2520saxophone%2520and%2520piano%252C%2520intimate%2520tables%2520with%2520candles%252C%2520audience%2520enjoying%2520the%2520performance%252C%2520sophisticated%2520atmosphere%2520with%2520cocktail%2520glasses%2520and%2520ambient%2520lighting&width=300&height=200&seq=jazz1&orientation=landscape"
        },
        {
            id: 5,
            title: "Pottery Workshop",
            type: "Arts",
            date: "2025-06-15",
            time: "02:00 PM",
            location: "Creative Clay Studio, Fremont",
            participants: 3,
            maxParticipants: 8,
            description: "Learn the basics of wheel throwing and hand building techniques. All materials provided.",
            creator: "Jamie Smith",
            image: "https://readdy.ai/api/search-image?query=bright%2520pottery%2520studio%2520with%2520pottery%2520wheels%2520and%2520clay%2520working%2520stations%252C%2520shelves%2520with%2520colorful%2520ceramic%2520pieces%252C%2520large%2520windows%2520with%2520natural%2520light%252C%2520creative%2520workspace%2520with%2520tools%2520and%2520materials%2520for%2520ceramic%2520art&width=300&height=200&seq=pottery1&orientation=landscape"
        },
        {
            id: 6,
            title: "Farmers Market Trip",
            type: "Social",
            date: "2025-06-07",
            time: "10:00 AM",
            location: "Downtown Farmers Market",
            participants: 2,
            maxParticipants: 5,
            description: "Let's explore local produce and artisan foods together. We can grab coffee afterward!",
            creator: "Jamie Smith",
            image: "https://readdy.ai/api/search-image?query=vibrant%2520outdoor%2520farmers%2520market%2520with%2520colorful%2520produce%2520stands%252C%2520fresh%2520fruits%2520and%2520vegetables%2520displayed%2520beautifully%252C%2520people%2520browsing%2520and%2520shopping%252C%2520sunny%2520day%2520with%2520vendor%2520tents%2520and%2520bustling%2520atmosphere&width=300&height=200&seq=market1&orientation=landscape"
        },
        {
            id: 7,
            title: "Photography Walk",
            type: "Outdoor",
            date: "2025-06-20",
            time: "04:00 PM",
            location: "Waterfront Park",
            participants: 4,
            maxParticipants: 10,
            description: "Bring your camera for a casual photography session during golden hour. All skill levels welcome.",
            creator: "Alex Morgan",
            image: "https://readdy.ai/api/search-image?query=scenic%2520waterfront%2520park%2520during%2520golden%2520hour%2520with%2520warm%2520sunlight%252C%2520walking%2520paths%2520along%2520water%2527s%2520edge%252C%2520people%2520with%2520cameras%2520capturing%2520the%2520beautiful%2520landscape%252C%2520trees%2520and%2520urban%2520skyline%2520in%2520background&width=300&height=200&seq=photo1&orientation=landscape"
        },
        {
            id: 8,
            title: "Cooking Class: Italian Pasta",
            type: "Food",
            date: "2025-06-12",
            time: "06:00 PM",
            location: "Culinary Institute, Downtown",
            participants: 6,
            maxParticipants: 8,
            description: "Learn to make fresh pasta from scratch and prepare classic Italian sauces. Ingredients provided.",
            creator: "Taylor Kim",
            image: "https://readdy.ai/api/search-image?query=professional%2520cooking%2520classroom%2520with%2520stainless%2520steel%2520workstations%252C%2520people%2520in%2520aprons%2520learning%2520to%2520make%2520fresh%2520pasta%252C%2520flour%2520and%2520ingredients%2520on%2520counters%252C%2520chef%2520instructor%2520demonstrating%2520techniques%252C%2520warm%2520kitchen%2520lighting&width=300&height=200&seq=cooking1&orientation=landscape"
        }
    ];
    // Suggested activities
    const suggestedActivities = [
        {
            id: 101,
            title: "Yoga in the Park",
            type: "Fitness",
            date: "2025-06-08",
            time: "08:00 AM",
            location: "Green Lake Park",
            participants: 12,
            maxParticipants: 20,
            description: "Start your Sunday with outdoor yoga. All levels welcome. Bring your own mat.",
            image: "https://readdy.ai/api/search-image?query=peaceful%2520morning%2520yoga%2520session%2520in%2520a%2520green%2520park%252C%2520people%2520on%2520colorful%2520yoga%2520mats%2520in%2520various%2520poses%252C%2520tall%2520trees%2520providing%2520shade%252C%2520serene%2520atmosphere%2520with%2520early%2520sunlight%2520filtering%2520through%2520leaves&width=300&height=200&seq=yoga1&orientation=landscape"
        },
        {
            id: 102,
            title: "Wine Tasting Tour",
            type: "Social",
            date: "2025-06-14",
            time: "03:00 PM",
            location: "Woodinville Wine Country",
            participants: 8,
            maxParticipants: 12,
            description: "Visit three local wineries for tastings. Transportation provided from downtown.",
            image: "https://readdy.ai/api/search-image?query=elegant%2520winery%2520tasting%2520room%2520with%2520wooden%2520barrels%252C%2520people%2520sampling%2520wine%2520at%2520a%2520long%2520wooden%2520bar%252C%2520vineyard%2520visible%2520through%2520large%2520windows%252C%2520wine%2520glasses%2520and%2520bottles%2520displayed%2520beautifully%252C%2520sophisticated%2520rustic%2520atmosphere&width=300&height=200&seq=wine1&orientation=landscape"
        },
        {
            id: 103,
            title: "Beginner's Rock Climbing",
            type: "Fitness",
            date: "2025-06-18",
            time: "05:00 PM",
            location: "Vertical World Climbing Gym",
            participants: 4,
            maxParticipants: 8,
            description: "Introduction to indoor rock climbing with certified instructors. Equipment provided.",
            image: "https://readdy.ai/api/search-image?query=modern%2520indoor%2520rock%2520climbing%2520gym%2520with%2520colorful%2520climbing%2520walls%2520of%2520various%2520heights%2520and%2520difficulties%252C%2520climbers%2520with%2520safety%2520harnesses%2520scaling%2520walls%252C%2520instructors%2520helping%2520beginners%252C%2520bright%2520well-lit%2520facility&width=300&height=200&seq=climbing1&orientation=landscape"
        }
    ];
    // Filter activities by date and type
    const filterActivities = (activities: any[], tab: string) => {
        const today = new Date();
        // Filter by tab (past, upcoming, suggested)
        let filtered = tab === 'suggested'
            ? suggestedActivities
            : activities.filter(activity => {
                const activityDate = new Date(activity.date);
                if (tab === 'past') {
                    return activityDate < today;
                } else if (tab === 'upcoming') {
                    return activityDate >= today;
                }
                return true;
            });
        // Filter by selected date if any
        if (selectedDate) {
            filtered = filtered.filter(activity => {
                const activityDate = new Date(activity.date);
                return activityDate.toDateString() === selectedDate.toDateString();
            });
        }
        // Filter by activity type if any selected
        if (activityTypeFilter.length > 0) {
            filtered = filtered.filter(activity =>
                activityTypeFilter.includes(activity.type)
            );
        }
        // Filter by search query
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(activity =>
                activity.title.toLowerCase().includes(query) ||
                activity.description.toLowerCase().includes(query) ||
                activity.location.toLowerCase().includes(query)
            );
        }
        return filtered;
    };
    // Initialize calendar
    useEffect(() => {
        if (calendarRef.current) {
            const calendarChart = echarts.init(calendarRef.current);
            // Generate calendar data - mark dates with activities
            const calendarData = activities.map(activity => {
                return [
                    activity.date,
                    1  // Activity count for this date
                ];
            });
            const option = {
                animation: false,
                tooltip: {
                    formatter: function (params: any) {
                        return `${params.value[0]}: ${params.value[1]} activities`;
                    }
                },
                visualMap: {
                    show: false,
                    min: 0,
                    max: 5,
                    calculable: true,
                    orient: 'horizontal',
                    left: 'center',
                    top: 'top',
                    inRange: {
                        color: ['#ebedf0', '#c6e48b', '#7bc96f', '#239a3b', '#196127']
                    }
                },
                calendar: {
                    top: 20,
                    left: 30,
                    right: 30,
                    cellSize: ['auto', 25],
                    range: `${currentYear}-${currentMonth + 1}`,
                    itemStyle: {
                        borderWidth: 0.5
                    },
                    yearLabel: { show: false },
                    dayLabel: {
                        firstDay: 1,
                        nameMap: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
                    },
                    monthLabel: {
                        nameMap: 'en',
                        fontSize: 14,
                        fontWeight: 'bold'
                    }
                },
                series: {
                    type: 'heatmap',
                    coordinateSystem: 'calendar',
                    calendarIndex: 0,
                    data: calendarData
                }
            };
            calendarChart.setOption(option);
            // Handle calendar click events
            calendarChart.on('click', function (params: any) {
                if (params.componentType === 'series' && params.value) {
                    const clickedDate = new Date(params.value[0]);
                    setSelectedDate(prevDate =>
                        prevDate && prevDate.toDateString() === clickedDate.toDateString()
                            ? null
                            : clickedDate
                    );
                }
            });
            // Resize handler
            const handleResize = () => {
                calendarChart.resize();
            };
            window.addEventListener('resize', handleResize);
            return () => {
                window.removeEventListener('resize', handleResize);
                calendarChart.dispose();
            };
        }
    }, [activities, currentMonth, currentYear]);
    // Activity type options for filtering
    const activityTypes = ["Outdoor", "Indoor", "Social", "Arts", "Food", "Fitness"];
    // Toggle activity type filter

    const items: TabsProps['items'] = [
        {
            key: 'activities',
            label: 'Activities',
            children: (
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    <Tabs
                        activeKey={activeActivityTab}
                        onChange={setActiveActivityTab}
                        items={[
                            {
                                key: 'upcoming',
                                label: 'Upcoming Activities',
                                children: (
                                    <div className="p-4">
                                        {filterActivities(activities, 'upcoming').length > 0 ? (
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                {filterActivities(activities, 'upcoming').map((activity) => (
                                                    <div key={activity.id} className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                                                        <div className="relative h-48 overflow-hidden">
                                                            <img
                                                                src={activity.image}
                                                                alt={activity.title}
                                                                className="w-full h-full object-cover"
                                                            />
                                                            <div className="absolute top-2 right-2">
                                                                <span className={`text-xs font-medium px-2 py-1 rounded-full ${activity.type === 'Outdoor' ? 'bg-green-100 text-green-800' :
                                                                    activity.type === 'Indoor' ? 'bg-blue-100 text-blue-800' :
                                                                        activity.type === 'Social' ? 'bg-purple-100 text-purple-800' :
                                                                            activity.type === 'Arts' ? 'bg-pink-100 text-pink-800' :
                                                                                activity.type === 'Food' ? 'bg-yellow-100 text-yellow-800' :
                                                                                    'bg-indigo-100 text-indigo-800'
                                                                    }`}>
                                                                    {activity.type}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="p-4">
                                                            <h3 className="text-lg font-semibold text-gray-800 mb-2">{activity.title}</h3>
                                                            <div className="space-y-2 mb-3">
                                                                <div className="flex items-start">
                                                                    <i className="fas fa-calendar-alt text-indigo-500 mt-1 mr-2"></i>
                                                                    <span className="text-gray-600 text-sm">
                                                                        {new Date(activity.date).toLocaleDateString('en-US', {
                                                                            weekday: 'long',
                                                                            month: 'long',
                                                                            day: 'numeric'
                                                                        })} at {activity.time}
                                                                    </span>
                                                                </div>
                                                                <div className="flex items-start">
                                                                    <i className="fas fa-map-marker-alt text-indigo-500 mt-1 mr-2"></i>
                                                                    <span className="text-gray-600 text-sm">{activity.location}</span>
                                                                </div>
                                                                <div className="flex items-start">
                                                                    <i className="fas fa-users text-indigo-500 mt-1 mr-2"></i>
                                                                    <span className="text-gray-600 text-sm">
                                                                        {activity.participants}/{activity.maxParticipants} participants
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <p className="text-gray-600 text-sm mb-4 line-clamp-2">{activity.description}</p>
                                                            <div className="flex items-center justify-between mt-2">
                                                                <div className="flex items-center">
                                                                    <span className="text-xs text-gray-500">Created by {activity.creator}</span>
                                                                </div>
                                                                <div className="flex space-x-2">
                                                                    <button className="p-2 text-gray-500 hover:text-indigo-600 !rounded-button whitespace-nowrap cursor-pointer">
                                                                        <i className="fas fa-edit"></i>
                                                                    </button>
                                                                    <button className="p-2 text-gray-500 hover:text-red-600 !rounded-button whitespace-nowrap cursor-pointer">
                                                                        <i className="fas fa-times"></i>
                                                                    </button>
                                                                    <button className="p-2 text-gray-500 hover:text-indigo-600 !rounded-button whitespace-nowrap cursor-pointer">
                                                                        <i className="fas fa-share-alt"></i>
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
                                                            <button className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded !rounded-button whitespace-nowrap cursor-pointer">
                                                                View Details
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-12">
                                                <div className="w-16 h-16 bg-indigo-100 rounded-full mx-auto flex items-center justify-center mb-4">
                                                    <i className="fas fa-calendar-day text-indigo-500 text-2xl"></i>
                                                </div>
                                                <h3 className="text-lg font-medium text-gray-800 mb-2">No activities found</h3>
                                                <p className="text-gray-600 mb-6">
                                                    You don't have any upcoming activities that match your filters.
                                                </p>
                                                <button
                                                    onClick={() => setShowCreateModal(true)}
                                                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded !rounded-button whitespace-nowrap cursor-pointer"
                                                >
                                                    <i className="fas fa-plus mr-2"></i> Create New Activity
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )
                            },
                            {
                                key: 'past',
                                label: 'Past Activities',
                                children: (
                                    <div className="p-4">
                                        {filterActivities(activities, 'past').length > 0 ? (
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                {filterActivities(activities, 'past').map((activity) => (
                                                    <div key={activity.id} className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                                                        <div className="relative h-48 overflow-hidden">
                                                            <img
                                                                src={activity.image}
                                                                alt={activity.title}
                                                                className="w-full h-full object-cover"
                                                            />
                                                            <div className="absolute top-2 right-2">
                                                                <span className={`text-xs font-medium px-2 py-1 rounded-full ${activity.type === 'Outdoor' ? 'bg-green-100 text-green-800' :
                                                                    activity.type === 'Indoor' ? 'bg-blue-100 text-blue-800' :
                                                                        activity.type === 'Social' ? 'bg-purple-100 text-purple-800' :
                                                                            activity.type === 'Arts' ? 'bg-pink-100 text-pink-800' :
                                                                                activity.type === 'Food' ? 'bg-yellow-100 text-yellow-800' :
                                                                                    'bg-indigo-100 text-indigo-800'
                                                                    }`}>
                                                                    {activity.type}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="p-4">
                                                            <h3 className="text-lg font-semibold text-gray-800 mb-2">{activity.title}</h3>
                                                            <div className="space-y-2 mb-3">
                                                                <div className="flex items-start">
                                                                    <i className="fas fa-calendar-alt text-indigo-500 mt-1 mr-2"></i>
                                                                    <span className="text-gray-600 text-sm">
                                                                        {new Date(activity.date).toLocaleDateString('en-US', {
                                                                            weekday: 'long',
                                                                            month: 'long',
                                                                            day: 'numeric'
                                                                        })} at {activity.time}
                                                                    </span>
                                                                </div>
                                                                <div className="flex items-start">
                                                                    <i className="fas fa-map-marker-alt text-indigo-500 mt-1 mr-2"></i>
                                                                    <span className="text-gray-600 text-sm">{activity.location}</span>
                                                                </div>
                                                                <div className="flex items-start">
                                                                    <i className="fas fa-users text-indigo-500 mt-1 mr-2"></i>
                                                                    <span className="text-gray-600 text-sm">
                                                                        {activity.participants}/{activity.maxParticipants} participants
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <p className="text-gray-600 text-sm mb-4 line-clamp-2">{activity.description}</p>
                                                            <div className="flex items-center justify-between mt-2">
                                                                <div className="flex items-center">
                                                                    <span className="text-xs text-gray-500">Created by {activity.creator}</span>
                                                                </div>
                                                                <div className="flex space-x-2">
                                                                    <button className="p-2 text-gray-500 hover:text-indigo-600 !rounded-button whitespace-nowrap cursor-pointer">
                                                                        <i className="fas fa-edit"></i>
                                                                    </button>
                                                                    <button className="p-2 text-gray-500 hover:text-red-600 !rounded-button whitespace-nowrap cursor-pointer">
                                                                        <i className="fas fa-times"></i>
                                                                    </button>
                                                                    <button className="p-2 text-gray-500 hover:text-indigo-600 !rounded-button whitespace-nowrap cursor-pointer">
                                                                        <i className="fas fa-share-alt"></i>
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
                                                            <button className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded !rounded-button whitespace-nowrap cursor-pointer">
                                                                View Details
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-12">
                                                <div className="w-16 h-16 bg-indigo-100 rounded-full mx-auto flex items-center justify-center mb-4">
                                                    <i className="fas fa-calendar-day text-indigo-500 text-2xl"></i>
                                                </div>
                                                <h3 className="text-lg font-medium text-gray-800 mb-2">No activities found</h3>
                                                <p className="text-gray-600 mb-6">
                                                    You don't have any past activities that match your filters.
                                                </p>
                                                <button
                                                    onClick={() => setShowCreateModal(true)}
                                                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded !rounded-button whitespace-nowrap cursor-pointer"
                                                >
                                                    <i className="fas fa-plus mr-2"></i> Create New Activity
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )
                            },
                            {
                                key: 'suggested',
                                label: 'Suggested For You',
                                children: (
                                    <div className="p-4">
                                        {filterActivities(activities, 'suggested').length > 0 ? (
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                {filterActivities(activities, 'suggested').map((activity) => (
                                                    <div key={activity.id} className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                                                        <div className="relative h-48 overflow-hidden">
                                                            <img
                                                                src={activity.image}
                                                                alt={activity.title}
                                                                className="w-full h-full object-cover"
                                                            />
                                                            <div className="absolute top-2 right-2">
                                                                <span className={`text-xs font-medium px-2 py-1 rounded-full ${activity.type === 'Outdoor' ? 'bg-green-100 text-green-800' :
                                                                    activity.type === 'Indoor' ? 'bg-blue-100 text-blue-800' :
                                                                        activity.type === 'Social' ? 'bg-purple-100 text-purple-800' :
                                                                            activity.type === 'Arts' ? 'bg-pink-100 text-pink-800' :
                                                                                activity.type === 'Food' ? 'bg-yellow-100 text-yellow-800' :
                                                                                    'bg-indigo-100 text-indigo-800'
                                                                    }`}>
                                                                    {activity.type}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="p-4">
                                                            <h3 className="text-lg font-semibold text-gray-800 mb-2">{activity.title}</h3>
                                                            <div className="space-y-2 mb-3">
                                                                <div className="flex items-start">
                                                                    <i className="fas fa-calendar-alt text-indigo-500 mt-1 mr-2"></i>
                                                                    <span className="text-gray-600 text-sm">
                                                                        {new Date(activity.date).toLocaleDateString('en-US', {
                                                                            weekday: 'long',
                                                                            month: 'long',
                                                                            day: 'numeric'
                                                                        })} at {activity.time}
                                                                    </span>
                                                                </div>
                                                                <div className="flex items-start">
                                                                    <i className="fas fa-map-marker-alt text-indigo-500 mt-1 mr-2"></i>
                                                                    <span className="text-gray-600 text-sm">{activity.location}</span>
                                                                </div>
                                                                <div className="flex items-start">
                                                                    <i className="fas fa-users text-indigo-500 mt-1 mr-2"></i>
                                                                    <span className="text-gray-600 text-sm">
                                                                        {activity.participants}/{activity.maxParticipants} participants
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <p className="text-gray-600 text-sm mb-4 line-clamp-2">{activity.description}</p>
                                                            <div className="flex items-center justify-between mt-2">
                                                                <div className="flex items-center">
                                                                    <span className="text-xs text-gray-500">Created by {activity.creator}</span>
                                                                </div>
                                                                <div className="flex space-x-2">
                                                                    <button className="p-2 text-gray-500 hover:text-indigo-600 !rounded-button whitespace-nowrap cursor-pointer">
                                                                        <i className="fas fa-edit"></i>
                                                                    </button>
                                                                    <button className="p-2 text-gray-500 hover:text-red-600 !rounded-button whitespace-nowrap cursor-pointer">
                                                                        <i className="fas fa-times"></i>
                                                                    </button>
                                                                    <button className="p-2 text-gray-500 hover:text-indigo-600 !rounded-button whitespace-nowrap cursor-pointer">
                                                                        <i className="fas fa-share-alt"></i>
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
                                                            <button className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded !rounded-button whitespace-nowrap cursor-pointer">
                                                                View Details
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-12">
                                                <div className="w-16 h-16 bg-indigo-100 rounded-full mx-auto flex items-center justify-center mb-4">
                                                    <i className="fas fa-calendar-day text-indigo-500 text-2xl"></i>
                                                </div>
                                                <h3 className="text-lg font-medium text-gray-800 mb-2">No activities found</h3>
                                                <p className="text-gray-600 mb-6">
                                                    We don't have any suggested activities that match your filters right now.
                                                </p>
                                                <button
                                                    onClick={() => setShowCreateModal(true)}
                                                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded !rounded-button whitespace-nowrap cursor-pointer"
                                                >
                                                    <i className="fas fa-plus mr-2"></i> Create New Activity
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )
                            }
                        ]}
                    />
                </div>
            )
        },
        {
            key: 'profile',
            label: 'Profile',
            children: <div>Profile Content</div>
        },
        {
            key: 'connections',
            label: 'Connections',
            children: <div>Connections Content</div>
        },
        {
            key: 'messages',
            label: 'Messages',
            children: <div>Messages Content</div>
        }
    ];
    return (
        <div className="min-h-screen bg-gray-50">
            <div className="container mx-auto px-4 py-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-800">Activities</h1>
                    <div className="mt-4 md:mt-0">
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors !rounded-button whitespace-nowrap cursor-pointer"
                        >
                            <i className="fas fa-plus mr-2"></i> Create Activity
                        </button>
                    </div>
                </div>
                <Tabs
                    activeKey={activeTab}
                    onChange={setActiveTab}
                    items={items}
                    className="bg-white rounded-lg shadow-md"
                />
            </div>
            {/* Create Activity Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg w-full max-w-3xl">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-semibold text-gray-800">Create New Activity</h3>
                                <button
                                    onClick={() => setShowCreateModal(false)}
                                    className="text-gray-400 hover:text-gray-600 !rounded-button whitespace-nowrap cursor-pointer"
                                >
                                    <i className="fas fa-times"></i>
                                </button>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="activity-title" className="block text-sm font-medium text-gray-700 mb-1">Activity Title</label>
                                    <input
                                        id="activity-title"
                                        type="text"
                                        placeholder="Enter a title for your activity"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Activity Type</label>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                        {activityTypes.map((type) => (
                                            <button
                                                key={type}
                                                className="p-3 border rounded-lg flex flex-col items-center justify-center transition-colors border-gray-200 hover:border-indigo-500 hover:bg-indigo-50 !rounded-button whitespace-nowrap cursor-pointer"
                                            >
                                                <i className={`fas fa-${type === 'Outdoor' ? 'hiking' :
                                                    type === 'Indoor' ? 'home' :
                                                        type === 'Social' ? 'users' :
                                                            type === 'Arts' ? 'palette' :
                                                                type === 'Food' ? 'utensils' :
                                                                    'dumbbell'
                                                    } text-2xl mb-2 text-gray-400`}></i>
                                                <span className="text-sm">{type}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="activity-date" className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                                        <input
                                            id="activity-date"
                                            type="date"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="activity-time" className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                                        <input
                                            id="activity-time"
                                            type="time"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="activity-location" className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                                    <div className="flex space-x-2">
                                        <input
                                            id="activity-location"
                                            type="text"
                                            placeholder="Enter location"
                                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                        <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors !rounded-button whitespace-nowrap cursor-pointer">
                                            <i className="fas fa-map-marker-alt"></i>
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="activity-description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                    <textarea
                                        id="activity-description"
                                        placeholder="Describe your activity..."
                                        rows={4}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    ></textarea>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="max-participants" className="block text-sm font-medium text-gray-700 mb-1">Maximum Participants</label>
                                        <input
                                            id="max-participants"
                                            type="number"
                                            min="1"
                                            defaultValue="8"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Privacy</label>
                                        <div className="relative">
                                            <select
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
                                                defaultValue="public"
                                            >
                                                <option value="public">Public - Anyone can join</option>
                                                <option value="connections">Connections Only</option>
                                                <option value="private">Private - Invite only</option>
                                            </select>
                                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                                <i className="fas fa-chevron-down text-gray-400"></i>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Invite Friends</label>
                                    <div className="flex flex-wrap gap-2 mb-2">
                                        <div className="flex items-center space-x-2 bg-indigo-50 px-3 py-2 rounded-full">
                                            <img
                                                src="https://readdy.ai/api/search-image?query=professional%2520portrait%2520photo%2520of%2520a%2520friendly%2520young%2520woman%2520with%2520brown%2520hair%2520and%2520warm%2520smile%252C%2520natural%2520lighting%252C%2520soft%2520background%252C%2520high%2520quality%252C%2520photorealistic%252C%25208k&width=80&height=80&seq=emma1&orientation=squarish"
                                                alt="Emma Wilson"
                                                className="w-6 h-6 rounded-full object-cover"
                                            />
                                            <span className="text-sm text-gray-700">Emma Wilson</span>
                                            <button className="text-gray-400 hover:text-gray-600 !rounded-button whitespace-nowrap cursor-pointer">
                                                <i className="fas fa-times"></i>
                                            </button>
                                        </div>
                                        <button className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-full hover:border-indigo-500 hover:bg-indigo-50 transition-colors !rounded-button whitespace-nowrap cursor-pointer">
                                            <i className="fas fa-plus text-indigo-600"></i>
                                            <span className="text-sm text-gray-700">Add Friends</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-end space-x-3 mt-8">
                                <button
                                    onClick={() => setShowCreateModal(false)}
                                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors !rounded-button whitespace-nowrap cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors !rounded-button whitespace-nowrap cursor-pointer"
                                >
                                    Create Activity
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
export default Activity