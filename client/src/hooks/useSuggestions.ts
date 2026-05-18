import { useState, useEffect, useCallback } from 'react';
import { getSuggestedUsers, getPopularUsers } from '../api/userApi';

export const useSuggestions = () => {
  const [suggestedUsers, setSuggestedUsers] = useState<any[]>([]);
  const [popularUsers, setPopularUsers] = useState<any[]>([]);
  const [loadingSuggested, setLoadingSuggested] = useState(false);
  const [loadingPopular, setLoadingPopular] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSuggestedUsers = useCallback(async () => {
    setLoadingSuggested(true);
    setError(null);
    try {
      const users = await getSuggestedUsers(10);
      setSuggestedUsers(users);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch suggested users');
      console.error('Error fetching suggested users:', err);
    } finally {
      setLoadingSuggested(false);
    }
  }, []);

  const fetchPopularUsers = useCallback(async () => {
    setLoadingPopular(true);
    setError(null);
    try {
      const users = await getPopularUsers(10);
      setPopularUsers(users);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch popular users');
      console.error('Error fetching popular users:', err);
    } finally {
      setLoadingPopular(false);
    }
  }, []);

  const refreshSuggestions = useCallback(async () => {
    await Promise.all([fetchSuggestedUsers(), fetchPopularUsers()]);
  }, [fetchSuggestedUsers, fetchPopularUsers]);

  useEffect(() => {
    refreshSuggestions();
  }, [refreshSuggestions]);

  return {
    suggestedUsers,
    popularUsers,
    loadingSuggested,
    loadingPopular,
    error,
    refreshSuggestions,
    fetchSuggestedUsers,
    fetchPopularUsers
  };
}; 