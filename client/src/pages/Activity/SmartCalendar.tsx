import 'smart-webcomponents-react/source/styles/smart.default.css';
import { useRef, useEffect, useState } from "react";
import { useTheme } from '../../context/ThemeContext';

import { Button } from 'smart-webcomponents-react/button';
import { Calendar } from 'smart-webcomponents-react/calendar';
import { Input } from 'smart-webcomponents-react/input';
import { Tree, TreeItem, TreeItemsGroup } from 'smart-webcomponents-react/tree';
import { Scheduler } from 'smart-webcomponents-react/scheduler';
import { Activity, setSelectedActivity, setShowEventDetail, setShowCreateModal } from '../../store/slices/activitySlice';
import Holidays from 'date-holidays';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { useBirthdays } from '../../hooks/useBirthdays';
import EventDetailsModal from './EventModal';
import EditEventModal from './EditEventModal';

type SmartCalendarProps = {
    events: Activity[];
    onEditActivity: (activity: any) => void;
};

export default function SmartCalendar({ events, onEditActivity }: SmartCalendarProps) {
    const { effectiveTheme, currentColor } = useTheme();
    const [holidays, setHolidays] = useState<any[]>([]);
    const [clickedDate, setClickedDate] = useState<Date | null>(null);
    const activities = useAppSelector(state => state.activities.activities)
    const { birthdays: friendsBirthdays, fetchBirthdaysForYear } = useBirthdays();
    const dispatch = useAppDispatch()

    useEffect(() => {
        const hd = new Holidays('US');
        const year = new Date().getFullYear();
        const usHolidays = hd.getHolidays(year);
        setHolidays(usHolidays);
        console.log(usHolidays)
    }, []);

    const holidayEvents = holidays
        .filter(holiday => holiday.type === 'public')
        .map(holiday => ({
            label: holiday.name,
            dateStart: holiday.start ? new Date(holiday.start) : new Date(holiday.date),
            dateEnd: holiday.end ? new Date(holiday.end) : new Date(holiday.date),
            class: 'holiday',
            description: holiday.type === 'public' ? 'Public Holiday' : holiday.type,
            backgroundColor: '#3b82f6', // Blue for holidays
            borderColor: '#2563eb',
            textColor: '#ffffff'
        }));

    const data = [
        ...events.map(activity => {
            const startDate = new Date(activity.start_datetime);
            const endDate = new Date(activity.end_datetime);

            // Debug logging to check date ranges
            console.log(`Activity: ${activity.title}`, {
                start: startDate.toISOString(),
                end: endDate.toISOString(),
                isMultiDay: startDate.toDateString() !== endDate.toDateString(),
                duration: (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24) // days
            });

            return {
                id: activity.id,
                label: activity.title,
                dateStart: startDate,
                dateEnd: endDate,
                description: activity.description,
                class: 'event',
                // Add additional properties for better multi-day support
                allDay: startDate.toDateString() !== endDate.toDateString(), // Mark as all-day if multi-day
                backgroundColor: '#a855f7', // Purple for events (original color)
                borderColor: '#9333ea',
                textColor: '#ffffff'
            };
        }),
        ...holidayEvents,
        ...friendsBirthdays.map(birthday => ({
            ...birthday,
            backgroundColor: '#22c55e', // Green for birthdays (original color)
            borderColor: '#16a34a',
            textColor: '#ffffff'
        }))
    ];

    const scheduler = useRef<any>(null);
    const calendar = useRef<any>(null);
    const tree = useRef<any>(null);
    const primaryContainer = useRef<HTMLDivElement | null>(null);
    const view = 'month';

    const views = [
        'day',
        {
            type: 'week',
            hideWeekend: false,
        },
        {
            type: 'month',
            hideWeekend: false,
        }, 'agenda',
        {
            label: '4 days',
            value: 'workWeek',
            type: 'week',
            shortcutKey: 'X',
            hideWeekend: false,
            hideNonworkingWeekdays: false,
        }
    ];

    const firstDayOfWeek = 1;

    const currentTimeIndicator = true;

    const scrollButtonsPosition = 'far';

    const updateData = (e: any) => {
        const item = e.detail.item;

        for (let i = 0; i < data.length; i++) {
            const dataItem = data[i];

            if (dataItem.label === item.label && dataItem.class === item.class) {
                e.type === 'itemRemove' ? data.splice(i, 1) : data.splice(i, 1, item);
                return;
            }
        }
    }

    const handleToggle = () => {
        if (primaryContainer.current && scheduler.current) {
            primaryContainer.current.classList.toggle('unexpand');
            scheduler.current.disableDateMenu = !primaryContainer.current.classList.contains('unexpand');
        }
    }

    const addNew = () => {
        // Open the create activity modal instead of the scheduler's built-in window
        dispatch(setSelectedActivity(null)); // Clear any selected activity
        dispatch(setShowCreateModal(true));
    }

    const handleCalendarChange = (e: any) => {
        if (scheduler.current) {
            scheduler.current.dateCurrent = e.detail.value;
        }
    }

    const handleDateChange = (e: any) => {
        if (calendar.current) {
            calendar.current.selectedDates = [e.detail.value];
        }

        // Refresh birthdays when year changes
        const newYear = new Date(e.detail.value).getFullYear();
        const currentYear = new Date().getFullYear();
        if (newYear !== currentYear) {
            fetchBirthdaysForYear(newYear);
        }
    }

    const handleTreeChange = () => {
        if (!tree.current || !scheduler.current) return;
        const selectedIndexes = tree.current.selectedIndexes;
        const types: string[] = [];
        if (selectedIndexes) {
            for (let i = 0; i < selectedIndexes.length; i++) {
                const item = tree.current.getItem(selectedIndexes[i]);
                if (item) {
                    types.push(item.value);
                }
            }
            if (types.length > 0) {
                scheduler.current.dataSource = data.filter(d => types.indexOf(d.class) > -1);
            }
        }
    }

    const handleItemClick = (e: any) => {
        console.log('item clicked', e)

        if (e.detail.itemObj?.class === 'birthday') {
            // Handle birthday event click
            const friend = e.detail.itemObj.friend;
            alert(`🎉 Happy Birthday, ${friend.name}! 🎂\n\nSend them a birthday message!`);
            return false;
        }

        if ((e.detail.itemObj?.id)) {
            // onEditActivity(e.detail.item);
            console.log(e.detail.itemObj)
            dispatch(setSelectedActivity(activities.find(activity => activity.id == e.detail.itemObj.id)))
            dispatch(setShowEventDetail(true))

        }
        if (e.preventDefault) e.preventDefault();
        return false;
    }

    const handleSchedulerClick = (e: any) => {
        // Check if the click is on an empty cell (not on an event)
        const target = e.target;
        if (target && target.classList.contains('smart-scheduler-cell')) {
            console.log('Empty cell clicked', target);

            // Extract date from the cell
            let cellDate = null;

            // Method 1: Check for 'date' attribute (matches actual HTML)
            const cellDateString = target.getAttribute('date');
            if (cellDateString) {
                cellDate = new Date(cellDateString);
            }
            // Method 2: Check if the cell has a title attribute
            else if (target.title) {
                cellDate = new Date(target.title);
            }
            // Method 3: Try to get date from cell's text content or aria-label
            else if (target.getAttribute('aria-label')) {
                const ariaLabel = target.getAttribute('aria-label');
                const dateMatch = ariaLabel.match(/(\d{1,2}\/\d{1,2}\/\d{4})/);
                if (dateMatch) {
                    cellDate = new Date(dateMatch[1]);
                }
            }
            // Method 4: Use the scheduler's current date and calculate based on cell position
            else if (scheduler.current) {
                const currentDate = scheduler.current.dateCurrent;
                cellDate = new Date(currentDate);
            }

            console.log('Extracted date:', cellDate);

            // Store the clicked date
            setClickedDate(cellDate);

            // Open create activity modal
            dispatch(setSelectedActivity(null));
            dispatch(setShowCreateModal(true));
        }
    }

    const clearClickedDate = () => {
        setClickedDate(null);
    }

    return (
        <div>
            <div id="primaryContainer" ref={primaryContainer} className={`${effectiveTheme === 'dark' ? 'dark-theme' : ''
                }`}>
                <div id="header" className={`${effectiveTheme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
                    }`}>
                    <Button id="toggleButton" onClick={handleToggle}></Button>
                    <div id="title">Scheduler</div>
                    <Button id="addNew" className={`floating ${effectiveTheme === 'dark' ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-700 border-gray-300'
                        }`} onClick={addNew}>
                        <span>Create</span>
                    </Button>
                </div>

                {/* Main Content */}
                <div className="content flex flex-col lg:flex-row h-full">
                    {/* Sidebar */}
                    <section id="sideA" className={`hidden lg:block w-full lg:w-80 xl:w-96 flex-shrink-0 border-r ${effectiveTheme === 'dark'
                        ? 'bg-gray-900 text-white border-gray-700'
                        : 'bg-gray-50 text-gray-900 border-gray-200'
                        }`}>
                        <div className="controls-container p-4 space-y-6">
                            {/* Calendar */}
                            <div className="space-y-3">
                                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                    Calendar
                                </h3>
                                <Calendar
                                    ref={calendar}
                                    id="calendar"
                                    scrollButtonsPosition={scrollButtonsPosition}
                                    onChange={handleCalendarChange}
                                    className={`w-full ${effectiveTheme === 'dark' ? 'dark-calendar' : ''}`}
                                ></Calendar>
                            </div>

                            {/* Search */}
                            <div className="space-y-3">
                                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                    Search
                                </h3>
                                <Input
                                    id="searchBar"
                                    className={`w-full ${effectiveTheme === 'dark'
                                        ? 'bg-gray-800 text-white border-gray-600 placeholder-gray-400'
                                        : 'bg-white text-gray-900 border-gray-300 placeholder-gray-500'
                                        }`}
                                    placeholder="Search for people"
                                ></Input>
                            </div>

                            {/* My Calendars */}
                            <div className="space-y-3">
                                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                    My Calendars
                                </h3>
                                <Tree
                                    ref={tree}
                                    id="tree"
                                    selectionMode="checkBox"
                                    toggleElementPosition="far"
                                    onChange={handleTreeChange}
                                    className={`w-full ${effectiveTheme === 'dark' ? 'dark-tree' : ''}`}
                                >
                                    <TreeItemsGroup expanded>
                                        <TreeItem value="birthday" selected>Birthdays</TreeItem>
                                        <TreeItem value="holiday" selected>Holidays</TreeItem>
                                        <TreeItem value="event" selected>Events</TreeItem>
                                    </TreeItemsGroup>
                                </Tree>
                            </div>
                        </div>
                    </section>

                    {/* Main Scheduler */}
                    <section id="sideB"
                        onClick={handleSchedulerClick}
                        className={`w-full lg:flex-1 min-h-0 ${effectiveTheme === 'dark'
                            ? 'bg-gray-800 text-white'
                            : 'bg-white text-gray-900'
                            }`}
                    >
                        <Scheduler
                            ref={scheduler}
                            id="scheduler"
                            dataSource={data as any}
                            view={view}
                            views={views as any}
                            firstDayOfWeek={firstDayOfWeek}
                            disableDateMenu={true}
                            disableWindowEditor={true}
                            currentTimeIndicator={currentTimeIndicator}
                            scrollButtonsPosition={scrollButtonsPosition}
                            onDragEnd={updateData}
                            onItemClick={handleItemClick}
                            onResizeEnd={updateData}
                            onItemUpdate={updateData}
                            onItemRemove={updateData}
                            onDateChange={handleDateChange}
                            eventCollectorTemplate={null}
                            eventTooltipTemplate={null}
                            eventTemplate={null}
                            cellTemplate={null}
                            eventRenderMode='classic'
                            className={`w-full h-full ${effectiveTheme === 'dark' ? 'dark-scheduler' : ''}`}
                        ></Scheduler>
                    </section>
                </div>

                {/* Modals */}
                <EventDetailsModal />
                <EditEventModal clickedDate={clickedDate} onClose={clearClickedDate} />
            </div>

            <style>
                {`
                     /* Responsive Layout */
                     @media (max-width: 1024px) {
                         #sideA {
                             display: none !important;
                         }
                         
                         #sideB {
                             width: 100% !important;
                             height: auto !important;
                             min-height: 400px;
                         }
                         
                         .content {
                             flex-direction: column !important;
                         }
                     }
                     
                     @media (max-width: 768px) {
                         #header {
                             padding: 0.75rem 1rem !important;
                         }
                         
                         #title {
                             font-size: 1rem !important;
                         }
                         
                         #sideB {
                             width: 100% !important;
                             height: auto !important;
                             min-height: 300px;
                         }
                     }
                     
                     /* Dark Theme Styles */
                     .dark-theme #header {
                         background-color: #1f2937 !important;
                         color: white !important;
                         border-bottom: 1px solid #374151 !important;
                     }
                     
                     .dark-theme #sideA {
                         background-color: #111827 !important;
                         color: white !important;
                         border-right: 1px solid #374151 !important;
                     }
                     
                     .dark-theme #sideB {
                         background-color: #1f2937 !important;
                         color: white !important;
                     }
                     
                     /* Scheduler Main Container */
                     .dark-theme .smart-scheduler {
                         background-color: #1f2937 !important;
                         color: white !important;
                     }
                     
                     /* Scheduler Header */
                     .dark-theme .smart-scheduler-header {
                         background-color: #374151 !important;
                         color: white !important;
                         border-bottom: 1px solid #4b5563 !important;
                     }
                     
                     /* Scheduler Navigation */
                     .dark-theme .smart-scheduler-navigation {
                         background-color: #374151 !important;
                         color: white !important;
                     }
                     
                     /* Scheduler Grid */
                     .dark-theme .smart-scheduler-grid {
                         background-color: #1f2937 !important;
                         color: white !important;
                     }
                     
                     /* Scheduler Cells */
                     .dark-theme .smart-scheduler-cell {
                         background-color: #1f2937 !important;
                         color: white !important;
                         border-color: #374151 !important;
                     }
                     
                     .dark-theme .smart-scheduler-cell:hover {
                         background-color: #374151 !important;
                     }
                     
                     .dark-theme .smart-scheduler-cell.smart-scheduler-cell-selected {
                         background-color: ${currentColor.primary === 'green-500' ? '#22c55e' : '#3b82f6'} !important;
                         color: white !important;
                     }
                     
                     /* Scheduler Day Headers */
                     .dark-theme .smart-scheduler-day-header {
                         background-color: #374151 !important;
                         color: white !important;
                         border-color: #4b5563 !important;
                     }
                     
                     /* Scheduler Events - Keep original colors */
                     .dark-theme .smart-scheduler-event {
                         color: white !important;
                     }
                     
                     /* Scheduler Today Highlight */
                     .dark-theme .smart-scheduler-cell.smart-scheduler-cell-today {
                         background-color: ${currentColor.primary === 'green-500' ? '#22c55e' : '#3b82f6'} !important;
                         color: white !important;
                     }
                     
                     /* Calendar Component */
                     .dark-theme .smart-calendar {
                         background-color: #111827 !important;
                         color: white !important;
                     }
                     
                     .dark-theme .smart-calendar-header {
                         background-color: #374151 !important;
                         color: white !important;
                     }
                     
                     .dark-theme .smart-calendar-cell {
                         background-color: #111827 !important;
                         color: white !important;
                         border-color: #374151 !important;
                     }
                     
                     .dark-theme .smart-calendar-cell:hover {
                         background-color: #374151 !important;
                     }
                     
                     .dark-theme .smart-calendar-cell.smart-calendar-cell-selected {
                         background-color: ${currentColor.primary === 'green-500' ? '#22c55e' : '#3b82f6'} !important;
                         color: white !important;
                     }
                     
                     /* Tree Component */
                     .dark-theme .smart-tree,
                     .dark-theme .smart-tree *,
                     .dark-theme .smart-tree-items-group,
                     .dark-theme .smart-tree-items-group * {
                         background-color: #111827 !important;
                         color: white !important;
                     }
                     
                     .dark-theme .smart-tree {
                         background-color: #1f2937 !important;
                         border: 1px solid #374151 !important;
                         border-radius: 8px !important;
                         box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
                     }
                     
                     .dark-theme .smart-tree-item,
                     .dark-theme .smart-tree-item * {
                         background-color: #111827 !important;
                         color: white !important;
                     }
                     
                     .dark-theme .smart-tree-item:hover,
                     .dark-theme .smart-tree-item:hover * {
                         background-color: #374151 !important;
                     }
                     
                     /* Tree Checkbox Colors */
                     .dark-theme .smart-tree-item[value="birthday"] .smart-checkbox {
                         background-color: #22c55e !important;
                         border-color: #16a34a !important;
                     }
                     
                     .dark-theme .smart-tree-item[value="holiday"] .smart-checkbox {
                         background-color: #3b82f6 !important;
                         border-color: #2563eb !important;
                     }
                     
                     .dark-theme .smart-tree-item[value="event"] .smart-checkbox {
                         background-color: #a855f7 !important;
                         border-color: #9333ea !important;
                     }
                     
                     /* Tree Item Text Colors */
                     .dark-theme .smart-tree-item[value="birthday"] {
                         color: #22c55e !important;
                     }
                     
                     .dark-theme .smart-tree-item[value="holiday"] {
                         color: #3b82f6 !important;
                     }
                     
                     .dark-theme .smart-tree-item[value="event"] {
                         color: #a855f7 !important;
                     }
                     
                     /* Input Component */
                     .dark-theme .smart-input {
                         background-color: #374151 !important;
                         color: white !important;
                         border-color: #4b5563 !important;
                     }
                     
                     .dark-theme .smart-input::placeholder {
                         color: #9ca3af !important;
                     }
                     
                     /* Button Component */
                     .dark-theme .smart-button {
                         background-color: #374151 !important;
                         color: white !important;
                         border-color: #4b5563 !important;
                     }
                     
                     .dark-theme .smart-button:hover {
                         background-color: #4b5563 !important;
                     }
                     
                     /* Additional Specific Selectors */
                     .dark-theme .smart-scheduler .smart-scheduler-cell {
                         background-color: #1f2937 !important;
                         color: white !important;
                     }
                     
                     .dark-theme .smart-scheduler .smart-scheduler-day-header {
                         background-color: #374151 !important;
                         color: white !important;
                     }
                     
                     .dark-theme .smart-scheduler .smart-scheduler-grid {
                         background-color: #1f2937 !important;
                         color: white !important;
                     }
                     
                     /* Override any remaining light backgrounds - but exclude events */
                     .dark-theme .smart-scheduler *:not(.smart-scheduler-event):not(.smart-scheduler-event *) {
                         background-color: #1f2937 !important;
                         color: white !important;
                     }
                     
                     .dark-theme .smart-scheduler .smart-scheduler-header * {
                         background-color: #374151 !important;
                         color: white !important;
                     }
                     
                     .dark-theme .smart-scheduler .smart-scheduler-day-header * {
                         background-color: #374151 !important;
                         color: white !important;
                     }
                 `}
            </style>
        </div>
    )
}