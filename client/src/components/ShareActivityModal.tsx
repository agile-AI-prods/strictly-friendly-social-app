import React, { useState } from 'react';
import { Modal, notification } from 'antd';
import { Activity } from '../store/slices/activitySlice';
import { 
  generateGoogleCalendarLink, 
  generateOutlookCalendarLink, 
  downloadICalendarFile, 
  copyToClipboard 
} from '../utils/calendarUtils';

interface ShareActivityModalProps {
  activity: Activity;
  visible: boolean;
  onClose: () => void;
}

const ShareActivityModal: React.FC<ShareActivityModalProps> = ({
  activity,
  visible,
  onClose
}) => {
  const [copied, setCopied] = useState<string | null>(null);
  const [copying, setCopying] = useState(false);

  const activityUrl = `${window.location.origin}/activities/${activity.id}`;
  const googleCalendarUrl = generateGoogleCalendarLink(activity);
  const outlookCalendarUrl = generateOutlookCalendarLink(activity);

  const handleCopy = async (text: string, type: string) => {
    setCopying(true);
    const success = await copyToClipboard(text);
    if (success) {
      setCopied(type);
      notification.success({
        message: 'Copied to clipboard!',
        description: 'The link has been copied to your clipboard.',
        duration: 2,
      });
      setTimeout(() => setCopied(null), 2000);
    } else {
      notification.error({
        message: 'Failed to copy',
        description: 'Please try copying the link manually.',
        duration: 3,
      });
    }
    setCopying(false);
  };

  const handleDownloadICS = () => {
    downloadICalendarFile(activity);
    notification.success({
      message: 'iCal file downloaded!',
      description: 'The calendar file has been downloaded to your device.',
      duration: 2,
    });
  };

  const handleGoogleCalendar = () => {
    window.open(googleCalendarUrl, '_blank');
    notification.info({
      message: 'Opening Google Calendar...',
      description: 'A new tab will open with your event ready to add.',
      duration: 2,
    });
  };

  const handleOutlookCalendar = () => {
    window.open(outlookCalendarUrl, '_blank');
    notification.info({
      message: 'Opening Outlook Calendar...',
      description: 'A new tab will open with your event ready to add.',
      duration: 2,
    });
  };

  const shareOptions = [
    {
      id: 'link',
      title: 'Copy Activity Link',
      description: 'Share the direct link to this activity',
      icon: 'fas fa-link',
      action: () => handleCopy(activityUrl, 'link'),
      color: 'text-blue-600'
    },
    {
      id: 'google',
      title: 'Add to Google Calendar',
      description: 'Open Google Calendar with this event',
      icon: 'fab fa-google',
      action: handleGoogleCalendar,
      color: 'text-red-600'
    },
    {
      id: 'outlook',
      title: 'Add to Outlook Calendar',
      description: 'Open Outlook Calendar with this event',
      icon: 'fab fa-microsoft',
      action: handleOutlookCalendar,
      color: 'text-blue-700'
    },
    {
      id: 'ics',
      title: 'Download iCal File',
      description: 'Download .ics file for any calendar app',
      icon: 'fas fa-download',
      action: handleDownloadICS,
      color: 'text-green-600'
    }
  ];

  return (
    <Modal
      title="Share Activity"
      open={visible}
      onCancel={onClose}
      footer={null}
      width={500}
    >
      <div className="space-y-4">
        {/* Activity Preview */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-gray-800 mb-2">{activity.title}</h3>
          <div className="text-sm text-gray-600 space-y-1">
            <div className="flex items-center">
              <i className="fas fa-calendar-alt text-indigo-500 mr-2"></i>
              <span>
                {new Date(activity.start_datetime).toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </span>
            </div>
            <div className="flex items-center">
              <i className="fas fa-clock text-indigo-500 mr-2"></i>
              <span>
                {new Date(activity.start_datetime).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit'
                })} - {new Date(activity.end_datetime).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
            <div className="flex items-center">
              <i className="fas fa-map-marker-alt text-indigo-500 mr-2"></i>
              <span>{activity.location}</span>
            </div>
          </div>
        </div>

        {/* Share Options */}
        <div className="space-y-3">
          {shareOptions.map((option) => (
            <div
              key={option.id}
              className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
              onClick={option.action}
            >
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center ${option.color}`}>
                  <i className={`${option.icon} text-lg`}></i>
                </div>
                <div>
                  <h4 className="font-medium text-gray-800">{option.title}</h4>
                  <p className="text-sm text-gray-500">{option.description}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {copied === option.id && (
                  <span className="text-sm text-green-600 flex items-center">
                    <i className="fas fa-check mr-1"></i>
                    Copied!
                  </span>
                )}
                {copying && option.id === 'link' && (
                  <span className="text-sm text-gray-500 flex items-center">
                    <i className="fas fa-spinner fa-spin mr-1"></i>
                    Copying...
                  </span>
                )}
                <i className="fas fa-chevron-right text-gray-400"></i>
              </div>
            </div>
          ))}
        </div>

        {/* Additional Info */}
        <div className="mt-6 p-3 bg-blue-50 rounded-lg">
          <div className="flex items-start space-x-2">
            <i className="fas fa-info-circle text-blue-500 mt-1"></i>
            <div className="text-sm text-blue-700">
              <p className="font-medium mb-1">Calendar Integration Tips:</p>
              <ul className="space-y-1 text-xs">
                <li>• Google Calendar: Opens directly in your browser</li>
                <li>• Outlook Calendar: Opens in Outlook web app</li>
                <li>• iCal File: Works with Apple Calendar, Thunderbird, and more</li>
                <li>• Activity Link: Share with friends to join directly</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ShareActivityModal; 