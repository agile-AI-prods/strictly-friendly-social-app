const { getDatabase } = require('../config/database');
const { UUID } = require('mongodb');
const profileService = require('./profileService');
const notificationService = require('./notificationService');
const settingsService = require('./settingsService');

// Socket.io instance for real-time notifications
let io = null;
const setSocketIO = (socketIO) => {
  io = socketIO;
  console.log('Socket.io instance set in deviceManagementService:', !!io);
  console.log('Socket.io instance details:', {
    hasIO: !!io,
    rooms: io ? Object.keys(io.sockets.adapter.rooms).length : 'N/A'
  });
};

// Helper function to get client IP address (optimized)
const getClientIP = (req) => {
  // Try various methods to get the client IP
  let ip = req.headers['x-forwarded-for'] || 
           req.headers['x-real-ip'] || 
           req.headers['x-client-ip'] ||
           req.headers['cf-connecting-ip'] ||
           req.connection?.remoteAddress || 
           req.socket?.remoteAddress ||
           req.ip ||
           req.ips?.[0];
  
  // Handle comma-separated IPs (x-forwarded-for can contain multiple IPs)
  if (ip && ip.includes(',')) {
    ip = ip.split(',')[0].trim();
  }
  
  // Remove IPv6 prefix if present
  if (ip && ip.startsWith('::ffff:')) {
    ip = ip.substring(7);
  }
  
  return ip || 'unknown';
};

// Helper function to parse user agent string
const parseUserAgent = (userAgent) => {
  if (!userAgent) {
    return {
      browser: 'Unknown',
      os: 'Unknown',
      device: 'Unknown'
    };
  }

  let browser = 'Unknown';
  let os = 'Unknown';
  let device = 'Unknown';

  // Browser detection
  if (userAgent.includes('Chrome')) {
    browser = 'Chrome';
  } else if (userAgent.includes('Firefox')) {
    browser = 'Firefox';
  } else if (userAgent.includes('Safari')) {
    browser = 'Safari';
  } else if (userAgent.includes('Edge')) {
    browser = 'Edge';
  } else if (userAgent.includes('Opera')) {
    browser = 'Opera';
  }

  // OS detection
  if (userAgent.includes('Windows')) {
    os = 'Windows';
  } else if (userAgent.includes('Mac OS X') || userAgent.includes('Macintosh')) {
    os = 'macOS';
  } else if (userAgent.includes('Linux')) {
    os = 'Linux';
  } else if (userAgent.includes('Android')) {
    os = 'Android';
  } else if (userAgent.includes('iOS') || userAgent.includes('iPhone') || userAgent.includes('iPad')) {
    os = 'iOS';
  }

  // Device detection
  if (userAgent.includes('Mobile')) {
    device = 'Mobile';
  } else if (userAgent.includes('Tablet')) {
    device = 'Tablet';
  } else if (userAgent.includes('iPad')) {
    device = 'Tablet';
  } else {
    device = 'Desktop';
  }

  return { browser, os, device };
};

// Function to get public IP and location using external service
const getIPAndLocation = async () => {
  try {
    console.log('Starting IP and location lookup...');
    const https = require('https');
    return new Promise((resolve, reject) => {
      // Use ipapi.co for both IP and location data
      const options = {
        hostname: 'ipapi.co',
        port: 443,
        path: '/json/',
        method: 'GET',
        timeout: 5000, // Increased timeout for better reliability
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; DeviceManagement/1.0)'
        }
      };

      const req = https.request(options, (res) => {
        console.log('IP API response status:', res.statusCode);
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          try {
            console.log('IP API raw response:', data);
            const result = JSON.parse(data);
            console.log('IP API parsed result:', result);
            
            if (result.ip) {
              const location = `${result.city || 'Unknown'}, ${result.region || 'Unknown'}, ${result.country_name || 'Unknown'}`;
              const locationData = {
                ip: result.ip,
                location: location,
                country: result.country_name,
                region: result.region,
                city: result.city,
                timezone: result.timezone,
                isp: result.org
              };
              console.log('Resolved location data:', locationData);
              resolve(locationData);
            } else {
              console.log('Invalid IP API response - no IP field:', result);
              reject(new Error('Invalid response - no IP field'));
            }
          } catch (e) {
            console.error('Error parsing IP API response:', e);
            reject(e);
          }
        });
      });

      req.on('error', (e) => {
        console.error('IP API request error:', e);
        reject(e);
      });

      req.on('timeout', () => {
        console.log('IP API request timeout, destroying request');
        req.destroy();
        reject(new Error('Timeout'));
      });

      req.end();
    });
  } catch (error) {
    console.error('Error getting IP and location:', error);
    return null;
  }
};

// Fallback location service using ipinfo.io
const getFallbackLocation = async (ip) => {
  try {
    const https = require('https');
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'ipinfo.io',
        port: 443,
        path: `/${ip}/json`,
        method: 'GET',
        timeout: 5000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; DeviceManagement/1.0)'
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          try {
            const result = JSON.parse(data);
            if (result.city && result.region && result.country) {
              const location = `${result.city}, ${result.region}, ${result.country}`;
              console.log('Fallback location service result:', location);
              resolve(location);
            } else {
              console.log('Fallback location service incomplete data:', result);
              resolve(null);
            }
          } catch (e) {
            console.error('Fallback location service parse error:', e);
            reject(e);
          }
        });
      });

      req.on('error', (e) => {
        console.error('Fallback location service request error:', e);
        reject(e);
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Fallback location service timeout'));
      });

      req.end();
    });
  } catch (error) {
    console.error('Error in fallback location service:', error);
    return null;
  }
};

// Fallback function to get just IP (for backwards compatibility)
const getPublicIP = async () => {
  try {
    const result = await getIPAndLocation();
    return result ? result.ip : null;
  } catch (error) {
    // Fallback to simple IP service
    try {
      const https = require('https');
      return new Promise((resolve, reject) => {
        const options = {
          hostname: 'api.ipify.org',
          port: 443,
          path: '/?format=json',
          method: 'GET',
          timeout: 3000 // Reduced from 5s to 3s for faster failover
        };

        const req = https.request(options, (res) => {
          let data = '';
          res.on('data', (chunk) => {
            data += chunk;
          });
          res.on('end', () => {
            try {
              const result = JSON.parse(data);
              resolve(result.ip);
            } catch (e) {
              reject(e);
            }
          });
        });

        req.on('error', (e) => {
          reject(e);
        });

        req.on('timeout', () => {
          req.destroy();
          reject(new Error('Timeout'));
        });

        req.end();
      });
    } catch (fallbackError) {
      console.error('Error getting public IP fallback:', fallbackError);
      return null;
    }
  }
};

// Function to record device login (optimized for speed)
exports.recordDeviceLogin = async (req, email, providedClientIP = null) => {
  try {
    // PERFORMANCE OPTIMIZATION: Minimal processing during login
    let clientIP = providedClientIP || getClientIP(req);
    
    console.log('Recording device login for:', email, 'IP:', clientIP);

    const userAgent = req.headers['user-agent'];
    const { browser, os, device } = parseUserAgent(userAgent);
    const loginDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

    // ENHANCED DUPLICATE CHECK: Check for existing device with same characteristics
    const db = await getDatabase();
    const deviceManagementCollection = db.collection('device_management');
    
    // Check for existing device with same characteristics (more comprehensive)
    const existingDevice = await deviceManagementCollection.findOne({
      email,
      browser,
      os,
      device
    });

    // If device with same characteristics exists, skip insert and return existing
    if (existingDevice) {
      console.log('Device with same characteristics already exists, skipping insert');
      console.log('Existing device:', {
        id: existingDevice._id,
        lastLogin: existingDevice.login_date,
        ip: existingDevice.ip,
        location: existingDevice.location
      });
      return existingDevice;
    }

    // PERFORMANCE OPTIMIZATION: Quick insert with minimal data
    // Generate new UUID for the device record
    const deviceRecordId = new UUID();
    
    const insertData = {
      _id: deviceRecordId,
      email,
      browser,
      os,
      device,
      login_date: loginDate,
      ip: clientIP,
      location: 'Unknown' // Will be updated asynchronously
    };

    const result = await deviceManagementCollection.insertOne(insertData);
    
    if (!result.insertedId) {
      console.error('Error recording device login: No document inserted');
      return null;
    }
    
    const data = { ...insertData, _id: result.insertedId };

    console.log('Device login recorded for:', email);

    // IMMEDIATE NOTIFICATION: Send notification right away for new device
    try {
      console.log('Creating immediate login notification for new device');
      
      const userProfile = await profileService.getProfileByEmail(email);
      console.log('User profile found:', userProfile ? 'Yes' : 'No');
      
      if (userProfile) {
        // Check if user has login alerts enabled
        let loginAlertsEnabled = true; // Default to enabled
        
        try {
          const userSettings = await settingsService.getUserSettings(email);
          loginAlertsEnabled = userSettings.login_alerts !== 'false';
          console.log('Login alerts setting:', loginAlertsEnabled);
        } catch (settingsError) {
          console.log('Could not check login alerts setting, defaulting to enabled');
        }

        if (loginAlertsEnabled) {
          const deviceInfo = `${device} (${os}, ${browser})`;
          const content = `New login detected on ${deviceInfo}`;
          
          console.log('Creating notification with content:', content);

          const notification = await notificationService.createNotification({
            type: 'login_alert',
            from_user_id: userProfile._id || userProfile.id,
            to_user_id: userProfile._id || userProfile.id,
            content: content,
            metadata: {
              is_login: true,
              device_info: {
                browser,
                os,
                device,
                ip: clientIP,
                location: 'Unknown', // Will be updated later
                login_date: loginDate
              }
            }
          });
          
          console.log('Notification created successfully:', notification ? 'Yes' : 'No');

          const userId = userProfile._id || userProfile.id;
          console.log('User ID for notification:', userId);
          console.log('Socket.io available:', !!io);
          
          if (io && notification && userId) {
            // Send real-time notification to the user IMMEDIATELY
            io.to(userId.toString()).emit('notification:new', notification);
            console.log('Login notification sent IMMEDIATELY via Socket.io to user:', userId);
            
            // Also emit a specific login alert event IMMEDIATELY
            io.to(userId.toString()).emit('login:alert', {
              type: 'new_device',
              device: device,
              os: os,
              browser: browser,
              location: 'Unknown',
              ip: clientIP,
              timestamp: new Date().toISOString()
            });
            console.log('Login alert event emitted IMMEDIATELY to user:', userId);
            
            // Log all connected users for debugging
            const connectedUsers = Object.keys(io.sockets.adapter.rooms);
            console.log('Connected users/rooms:', connectedUsers);
          } else if (io && notification) {
            console.log('Login notification created but userProfile._id/id is missing:', userProfile);
          } else if (!io) {
            console.log('Socket.io not available for real-time notification');
          } else if (!notification) {
            console.log('Notification creation failed');
          }
        } else {
          console.log('Login alerts disabled for user:', email);
        }
      } else {
        console.log('No user profile found for email:', email);
      }
    } catch (notificationError) {
      console.error('Error creating immediate login notification:', notificationError);
    }

    // BACKGROUND PROCESSING: Handle location update and other heavy tasks asynchronously
    setImmediate(async () => {
      try {
        console.log('Starting background location processing for record ID:', data._id);
        
        // Update location asynchronously
        let finalLocation = 'Unknown';
        try {
          console.log('Attempting to get location for IP:', clientIP);
          const ipLocationData = await getIPAndLocation();
          console.log('Location data received:', ipLocationData);
          
          if (ipLocationData && ipLocationData.location) {
            finalLocation = ipLocationData.location;
            let updateData = { location: finalLocation };
            
            // If we got a better IP from the location service, update that too
            if (ipLocationData.ip && ipLocationData.ip !== clientIP) {
              updateData.ip = ipLocationData.ip;
              console.log('Updated IP from location service:', ipLocationData.ip);
            }
            
            await deviceManagementCollection.updateOne(
              { _id: data._id },
              { $set: updateData }
            );
            
            console.log('Successfully updated record with location:', finalLocation);
          } else {
            console.log('No location data received, keeping as Unknown');
          }
        } catch (locationError) {
          console.error('Error getting location asynchronously:', locationError);
          // Try fallback location service
          try {
            console.log('Trying fallback location service...');
            const fallbackLocation = await getFallbackLocation(clientIP);
            if (fallbackLocation) {
              finalLocation = fallbackLocation;
              await deviceManagementCollection.updateOne(
                { _id: data._id },
                { $set: { location: fallbackLocation } }
              );
              console.log('Updated location using fallback service:', fallbackLocation);
            }
          } catch (fallbackError) {
            console.error('Fallback location service also failed:', fallbackError);
          }
        }
        
        console.log('Background location processing completed for:', email);
      } catch (asyncError) {
        console.error('Error in background location processing:', asyncError);
      }
    });

    return data;
  } catch (error) {
    console.error('Error in recordDeviceLogin:', error);
    // Don't throw error to avoid breaking the login process
    return null;
  }
};

// Export the setSocketIO function
exports.setSocketIO = setSocketIO;

// Function to get device login history for a user
exports.getDeviceLoginHistory = async (email) => {
  try {
    const db = await getDatabase();
    const deviceManagementCollection = db.collection('device_management');
    
    const data = await deviceManagementCollection.find({ email })
      .sort({ login_date: -1 })
      .toArray();

    return data;
  } catch (error) {
    console.error('Error in getDeviceLoginHistory:', error);
    throw error;
  }
};

// Function to delete a specific device login record
exports.deleteDeviceLoginRecord = async (email, recordId) => {
  try {
    const db = await getDatabase();
    const deviceManagementCollection = db.collection('device_management');
    
    // First verify that the record belongs to the user
    const existingRecord = await deviceManagementCollection.findOne({
      _id: recordId,
      email: email
    });

    if (!existingRecord) {
      throw new Error('Record not found or access denied');
    }

    // Delete the record
    const result = await deviceManagementCollection.deleteOne({
      _id: recordId,
      email: email
    });

    if (result.deletedCount === 0) {
      throw new Error('Failed to delete record');
    }

    console.log('Device login record deleted successfully:', { recordId, email });
    return true;
  } catch (error) {
    console.error('Error in deleteDeviceLoginRecord:', error);
    throw error;
  }
};

// Export the setSocketIO function
exports.setSocketIO = setSocketIO;

