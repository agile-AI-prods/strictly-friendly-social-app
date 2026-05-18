// Utility functions for IP address and location detection

export interface IPInfo {
  ip: string;
  country?: string;
  region?: string;
  city?: string;
  timezone?: string;
  isp?: string;
}

// Get IP information from client side
export const getClientIPInfo = async (): Promise<IPInfo | null> => {
  try {
    // Try ipapi.co first (more detailed info)
    const response = await fetch('https://ipapi.co/json/');
    if (response.ok) {
      const data = await response.json();
      return {
        ip: data.ip,
        country: data.country_name,
        region: data.region,
        city: data.city,
        timezone: data.timezone,
        isp: data.org
      };
    }
  } catch (error) {
    console.error('Error getting IP info from ipapi.co:', error);
  }

  try {
    // Fallback to ipify (simple IP only)
    const response = await fetch('https://api.ipify.org?format=json');
    if (response.ok) {
      const data = await response.json();
      return {
        ip: data.ip
      };
    }
  } catch (error) {
    console.error('Error getting IP from ipify:', error);
  }

  return null;
};

// Get basic IP only (faster)
export const getClientIP = async (): Promise<string | null> => {
  try {
    // Simple fetch without AbortController to avoid AbortError
    const response = await fetch('https://api.ipify.org?format=json');
    
    if (response.ok) {
      const data = await response.json();
      return data.ip;
    }
  } catch (error) {
    console.error('Error getting client IP:', error);
  }
  return null;
};

// Get IP and location information (more comprehensive)
export const getClientIPAndLocation = async (): Promise<IPInfo | null> => {
  return getClientIPInfo();
};
