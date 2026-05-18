import React, { useEffect } from 'react';
import { useBirthdays } from '../hooks/useBirthdays';

export const BirthdayNotifications: React.FC = () => {
  const { 
    upcomingBirthdays, 
    todaysBirthdays, 
    fetchUpcomingBirthdays, 
    fetchTodaysBirthdays,
    loading 
  } = useBirthdays();

  useEffect(() => {
    // Fetch upcoming and today's birthdays when component mounts
    fetchUpcomingBirthdays();
    fetchTodaysBirthdays();
  }, [fetchUpcomingBirthdays, fetchTodaysBirthdays]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  const hasTodayBirthdays = todaysBirthdays.length > 0;
  const hasUpcomingBirthdays = upcomingBirthdays.length > 0;

  if (!hasTodayBirthdays && !hasUpcomingBirthdays) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow p-4 space-y-4">
      {/* Today's Birthdays */}
      {hasTodayBirthdays && (
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center">
            <span className="text-2xl mr-2">🎉</span>
            Today's Birthdays
          </h3>
          <div className="space-y-2">
            {todaysBirthdays.map((birthday) => (
              <div key={birthday.id} className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg">
                <img
                  src={birthday.friend.photo_url || '/assets/avatar.png'}
                  alt={birthday.friend.name}
                  className="w-10 h-10 rounded-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = '/assets/avatar.png';
                  }}
                />
                <div className="flex-1">
                  <p className="font-medium text-gray-800">
                    {birthday.friend.name}
                  </p>
                  <p className="text-sm text-gray-600">
                    It's their birthday today! 🎂
                  </p>
                </div>
                <button className="px-3 py-1 bg-yellow-500 text-white rounded-full text-sm hover:bg-yellow-600 transition-colors">
                  Send Wishes
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Birthdays */}
      {hasUpcomingBirthdays && (
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center">
            <span className="text-2xl mr-2">📅</span>
            Upcoming Birthdays
          </h3>
          <div className="space-y-2">
            {upcomingBirthdays.slice(0, 3).map((birthday) => {
              const daysUntil = Math.ceil(
                (new Date(birthday.dateStart).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
              );
              
              return (
                <div key={birthday.id} className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                  <img
                    src={birthday.friend.photo_url || '/assets/avatar.png'}
                    alt={birthday.friend.name}
                    className="w-10 h-10 rounded-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = '/assets/avatar.png';
                    }}
                  />
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">
                      {birthday.friend.name}
                    </p>
                    <p className="text-sm text-gray-600">
                      {daysUntil === 1 ? 'Tomorrow' : `In ${daysUntil} days`} • {new Date(birthday.dateStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                  <button className="px-3 py-1 bg-blue-500 text-white rounded-full text-sm hover:bg-blue-600 transition-colors">
                    Remind Me
                  </button>
                </div>
              );
            })}
          </div>
          {upcomingBirthdays.length > 3 && (
            <p className="text-sm text-gray-500 mt-2">
              +{upcomingBirthdays.length - 3} more upcoming birthdays
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default BirthdayNotifications; 