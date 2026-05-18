import { useEffect, useRef } from 'react';

export function useLocationWatcher(onLocationChange: (coords: GeolocationCoordinates) => void) {
  const watchId = useRef<number | null>(null);

  useEffect(() => {
    if ('geolocation' in navigator) {
      watchId.current = navigator.geolocation.watchPosition(
        (pos) => onLocationChange(pos.coords),
        (err) => {
          if (err.code === 1) {
            alert("Permission denied for location.");
          } else if (err.code === 2) {
            alert("Position unavailable. Please check your network or device settings.");
          } else if (err.code === 3) {
            alert("Location request timed out.");
          } else {
            alert("Unknown error: " + err.message);
          }
        },
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 20000 }
      );
    }
    return () => {
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current);
      }
    };
  }, [onLocationChange]);
} 