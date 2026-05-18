import { Activity } from '../store/slices/activitySlice';

export interface CalendarEvent {
  title: string;
  description: string;
  location: string;
  startDate: string;
  endDate: string;
  timezone?: string;
}

export const generateGoogleCalendarLink = (activity: Activity): string => {
  const startDate = new Date(activity.start_datetime);
  const endDate = new Date(activity.end_datetime);
  
  // Format dates for Google Calendar (YYYYMMDDTHHMMSSZ)
  const formatDate = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  };

  const event: CalendarEvent = {
    title: activity.title,
    description: `${activity.description}\n\nJoin this activity on our platform!\n\nType: ${activity.type}\nMax Participants: ${activity.max_participants}\nPrivacy: ${activity.privacy}`,
    location: activity.location,
    startDate: formatDate(startDate),
    endDate: formatDate(endDate),
  };

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${event.startDate}/${event.endDate}`,
    details: event.description,
    location: event.location,
    ctz: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};

export const generateOutlookCalendarLink = (activity: Activity): string => {
  const startDate = new Date(activity.start_datetime);
  const endDate = new Date(activity.end_datetime);
  
  const formatDate = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  };

  const event: CalendarEvent = {
    title: activity.title,
    description: `${activity.description}\n\nJoin this activity on our platform!\n\nType: ${activity.type}\nMax Participants: ${activity.max_participants}\nPrivacy: ${activity.privacy}`,
    location: activity.location,
    startDate: formatDate(startDate),
    endDate: formatDate(endDate),
  };

  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: event.title,
    startdt: startDate.toISOString(),
    enddt: endDate.toISOString(),
    body: event.description,
    location: event.location,
  });

  return `https://outlook.live.com/calendar/0/${params.toString()}`;
};

export const generateICalendarData = (activity: Activity): string => {
  const startDate = new Date(activity.start_datetime);
  const endDate = new Date(activity.end_datetime);
  
  const formatDate = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  };

  const eventId = `activity-${activity.id}@${window.location.hostname}`;
  const now = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Socialite//Activity Calendar//EN',
    'BEGIN:VEVENT',
    `UID:${eventId}`,
    `DTSTAMP:${now}`,
    `DTSTART:${formatDate(startDate)}`,
    `DTEND:${formatDate(endDate)}`,
    `SUMMARY:${activity.title}`,
    `DESCRIPTION:${activity.description}\\n\\nJoin this activity on our platform!\\n\\nType: ${activity.type}\\nMax Participants: ${activity.max_participants}\\nPrivacy: ${activity.privacy}`,
    `LOCATION:${activity.location}`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');
};

export const downloadICalendarFile = (activity: Activity): void => {
  const icalData = generateICalendarData(activity);
  const blob = new Blob([icalData], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `${activity.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const result = document.execCommand('copy');
      document.body.removeChild(textArea);
      return result;
    }
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}; 