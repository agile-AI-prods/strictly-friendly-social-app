import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { 
  fetchFriendsBirthdays, 
  fetchBirthdaysForYear, 
  fetchUpcomingBirthdays, 
  fetchTodaysBirthdays 
} from '../store/slices/birthdaySlice';

export const useBirthdays = () => {
  const dispatch = useAppDispatch();
  const { 
    birthdays, 
    upcomingBirthdays, 
    todaysBirthdays, 
    loading, 
    error, 
    lastFetched 
  } = useAppSelector(state => state.birthdays);
  const currentUser = useAppSelector(state => state.auth.user);

  // Auto-fetch birthdays when user changes
  useEffect(() => {
    if (currentUser?.id) {
      dispatch(fetchFriendsBirthdays(currentUser.id));
    }
  }, [currentUser?.id, dispatch]);

  const fetchBirthdaysForYearHandler = async (year: number) => {
    if (!currentUser?.id) return;
    await dispatch(fetchBirthdaysForYear({ userId: currentUser.id, year }));
  };

  const fetchUpcomingBirthdaysHandler = async () => {
    if (!currentUser?.id) return;
    await dispatch(fetchUpcomingBirthdays(currentUser.id));
  };

  const fetchTodaysBirthdaysHandler = async () => {
    if (!currentUser?.id) return;
    await dispatch(fetchTodaysBirthdays(currentUser.id));
  };

  const refreshBirthdays = async () => {
    if (!currentUser?.id) return;
    await dispatch(fetchFriendsBirthdays(currentUser.id));
  };

  return {
    birthdays,
    upcomingBirthdays,
    todaysBirthdays,
    loading,
    error,
    lastFetched,
    fetchBirthdaysForYear: fetchBirthdaysForYearHandler,
    fetchUpcomingBirthdays: fetchUpcomingBirthdaysHandler,
    fetchTodaysBirthdays: fetchTodaysBirthdaysHandler,
    refreshBirthdays,
  };
}; 