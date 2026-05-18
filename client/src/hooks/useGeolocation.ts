import { useState, useEffect } from 'react';

interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  city: string | null;
  error: string | null;
  loading: boolean;
}

const getCityFromCoordinates = async (latitude: number, longitude: number): Promise<string | null> => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`
    );
    const data = await response.json();
    // Try to get the most specific available location
    return (
      data.address?.city ||
      data.address?.town ||
      data.address?.village ||
      data.address?.hamlet ||
      data.address?.municipality ||
      data.address?.county ||
      data.address?.state ||
      null
    );
  } catch (error) {
    console.error('Error fetching city:', error);
    return null;
  }
};

export const useGeolocation = () => {
  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    city: null,
    error: null,
    loading: true
  });

  useEffect(() => {
    if (!navigator.geolocation) {
      setState(prev => ({
        ...prev,
        error: 'Geolocation is not supported by your browser',
        loading: false
      }));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const city = await getCityFromCoordinates(latitude, longitude);
        
        setState({
          latitude,
          longitude,
          city,
          error: null,
          loading: false
        });
      },
      (error) => {
        setState({
          latitude: null,
          longitude: null,
          city: null,
          error: error.message,
          loading: false
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    );
  }, []);

  return state;
}; 