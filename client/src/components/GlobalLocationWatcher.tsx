import { useEffect, useCallback } from 'react';
import { useAppSelector } from '../store/hooks';
import { getMe, updateProfile } from '../api/profileApi';
import { useGeolocation } from '../hooks/useGeolocation';

const GlobalLocationWatcher = () => {
    const currentUser = useAppSelector(state => state.auth.user);
    const { city } = useGeolocation();
    const handleLocation = useCallback(
        async (position: GeolocationPosition) => {
            if (!currentUser) return;

            try {
                // Fetch the latest profile from the backend
                const response = await getMe();
                const latestProfile = response.data;
                if (!latestProfile) return;

                const latestLocation = latestProfile.location;
                const coords = position.coords;
                if (
                    !latestLocation ||
                    latestLocation.latitude !== coords.latitude ||
                    latestLocation.longitude !== coords.longitude
                ) {
                    await updateProfile(currentUser.id, {
                        location: {
                            latitude: coords.latitude,
                            longitude: coords.longitude,
                            city: city || ''
                        }
                    });
                }
            } catch (error) {
                console.error('Error updating location:', error);
            }
        },
        [currentUser, city]
    );

    useEffect(() => {
        const watchId = navigator.geolocation.watchPosition(
            handleLocation,
            (error) => {
                console.error('Error watching position:', error);
            },
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );

        return () => {
            navigator.geolocation.clearWatch(watchId);
        };
    }, [handleLocation]);

    return null;
};

export { GlobalLocationWatcher }; 