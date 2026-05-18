export  const calculateDistance = (
  lat1: number, 
  lon1: number, 
  lat2: number, 
  lon2: number
): number => {
  // Haversine formula to calculate distance between two points on Earth
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  const distance = R * c; // Distance in km
  
  return Math.round(distance);
};

const deg2rad = (deg: number): number => {
  return deg * (Math.PI/180);
};

export const calculateMatchScore = (
  userInterests: string[],
  otherInterests: string[],
  distance: number
): number => {
  // Calculate shared interests
  const sharedInterests = userInterests.filter(interest => 
    otherInterests.includes(interest)
  );
  
  // Calculate percentage of shared interests
  const interestScore = (sharedInterests.length / Math.max(userInterests.length, 1)) * 100;
  
  // Calculate distance score (100% if close, decreasing as distance increases)
  // 0km = 100%, 100km = 0%
  const distanceScore = Math.max(0, 100 - distance);
  
  // Calculate overall match score (weighted average)
  // 70% based on interests, 30% based on distance
  const matchScore = Math.round((interestScore * 0.7) + (distanceScore * 0.3));
  
  return Math.min(100, Math.max(0, matchScore));
};

export const getUserLocation = (): Promise<GeolocationPosition> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
    } else {
      navigator.geolocation.getCurrentPosition(resolve, reject);
    }
  });
};

// Add the missing getCurrentLocation export as an alias to getUserLocation
export const getCurrentLocation = getUserLocation;
 