import { useState, useEffect } from 'react';
import { getDeviceLoginHistory, deleteDeviceLoginRecord, DeviceLoginRecord } from '../../api/deviceManagementApi';
import { Snackbar } from '../../components/Snackbar';
import { useTheme } from '../../context/ThemeContext';
import { 
  Smartphone, 
  Monitor, 
  Tablet, 
  Chrome, 
  Globe, 
  Apple, 
  Square,
  Zap,
  MapPin,
  X
} from 'lucide-react';

export const DeviceManagement = () => {
  const [deviceHistory, setDeviceHistory] = useState<DeviceLoginRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Use global theme context
  const { effectiveTheme } = useTheme();

  useEffect(() => {
    loadDeviceData();
  }, []);

  const loadDeviceData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const historyResponse = await getDeviceLoginHistory();
      setDeviceHistory(historyResponse.data.data);
    } catch (err: any) {
      const errorMessage = err?.response?.data?.error || err?.message || 'Failed to load device data';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteRecord = async (recordId: number) => {
    try {
      // Call the delete API
      await deleteDeviceLoginRecord(recordId);
      // Remove from local state on success
      setDeviceHistory(prev => prev.filter(record => record.id !== recordId));
    } catch (err: any) {
      const errorMessage = err?.response?.data?.error || err?.message || 'Failed to delete record';
      setError(errorMessage);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getDeviceIcon = (device: string) => {
    switch (device.toLowerCase()) {
      case 'mobile':
        return <Smartphone className="h-5 w-5 text-green-500" />;
      case 'tablet':
        return <Tablet className="h-5 w-5 text-purple-500" />;
      case 'desktop':
        return <Monitor className="h-5 w-5 text-blue-500" />;
      default:
        return <Monitor className="h-5 w-5 text-blue-500" />;
    }
  };

  const getBrowserIcon = (browser: string) => {
    switch (browser.toLowerCase()) {
      case 'chrome':
        return <Chrome className="h-4 w-4 text-yellow-500" />;
      case 'firefox':
        return <Globe className="h-4 w-4 text-orange-500" />;
      case 'safari':
        return <Apple className="h-4 w-4 text-blue-400" />;
      case 'edge':
        return <Globe className="h-4 w-4 text-blue-600" />;
      case 'opera':
        return <Globe className="h-4 w-4 text-red-500" />;
      default:
        return <Globe className="h-4 w-4 text-gray-500" />;
    }
  };

  const getOSIcon = (os: string) => {
    switch (os.toLowerCase()) {
      case 'windows':
        return <Square className="h-4 w-4 text-blue-500" />;
      case 'macos':
        return <Apple className="h-4 w-4 text-gray-700" />;
      case 'linux':
        return <Zap className="h-4 w-4 text-yellow-500" />;
      case 'android':
        return <Smartphone className="h-4 w-4 text-green-500" />;
      case 'ios':
        return <Apple className="h-4 w-4 text-gray-700" />;
      default:
        return <Monitor className="h-4 w-4 text-gray-500" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className={`animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 ${
          effectiveTheme === 'dark' ? 'border-blue-400' : 'border-primary-500'
        }`}></div>
      </div>
    );
  }

  return (
    <div className="p-4">
      {error && (
        <Snackbar
          message={error}
          variant="error"
          onClose={() => setError(null)}
        />
      )}
      


      {/* Content */}
      <div className="space-y-3">
        {deviceHistory.length === 0 ? (
          <div className={`text-center py-12 rounded-2xl ${
            effectiveTheme === 'dark' 
              ? 'bg-gradient-to-br from-gray-800/30 to-gray-900/30 border border-gray-700/30' 
              : 'bg-gradient-to-br from-gray-50/50 to-white/50 border border-gray-200/30'
          }`}>
            <div className={`mx-auto h-16 w-16 mb-6 rounded-full flex items-center justify-center ${
              effectiveTheme === 'dark' 
                ? 'bg-gradient-to-br from-blue-900/30 to-purple-900/30' 
                : 'bg-gradient-to-br from-blue-50 to-indigo-50'
            }`}>
              <Monitor className="h-8 w-8 text-blue-500" />
            </div>
            <p className={`text-lg font-semibold mb-2 ${effectiveTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              No login history found
            </p>
            <p className={`text-sm ${effectiveTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              Your device login history will appear here after your next login
            </p>
          </div>
        ) : (
          deviceHistory.map((login) => (
            <div
              key={login.id}
              className={`group relative rounded-xl p-4 transition-all duration-300 ${
                effectiveTheme === 'dark' 
                  ? 'bg-gradient-to-r from-gray-800/40 to-gray-800/60 border border-gray-700/30 hover:from-gray-800/60 hover:to-gray-800/80 hover:border-gray-600/50 hover:shadow-lg hover:shadow-gray-900/20' 
                  : 'bg-gradient-to-r from-white/80 to-gray-50/80 border border-gray-200/40 hover:from-white hover:to-white hover:border-gray-300/60 hover:shadow-lg hover:shadow-gray-200/30'
              }`}
            >
              {/* Delete Button */}
              <button
                onClick={() => handleDeleteRecord(login.id)}
                className={`absolute top-3 right-3 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 transform hover:scale-110 ${
                  effectiveTheme === 'dark'
                    ? 'text-gray-500 hover:text-white hover:bg-red-500/80 hover:shadow-lg hover:shadow-red-500/20'
                    : 'text-gray-400 hover:text-white hover:bg-red-500 hover:shadow-lg hover:shadow-red-500/20'
                }`}
                title="Delete this login record"
              >
                <X className="h-3.5 w-3.5" />
              </button>

              <div className="flex items-center justify-between pr-8">
                {/* Left Side - Device Info */}
                <div className="flex items-center space-x-3">
                  <div className={`p-2.5 rounded-xl ${
                    effectiveTheme === 'dark' 
                      ? 'bg-gradient-to-br from-blue-900/30 to-purple-900/30 border border-gray-700/50' 
                      : 'bg-gradient-to-br from-blue-50 to-indigo-50 border border-gray-200/50'
                  }`}>
                    {getDeviceIcon(login.device)}
                  </div>
                  <div className="flex-1">
                    <div className={`font-semibold text-sm mb-1 ${
                      effectiveTheme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                      {login.device}
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-1">
                        {getBrowserIcon(login.browser)}
                        <span className={`text-xs font-medium ${
                          effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                        }`}>
                          {login.browser}
                        </span>
                      </div>
                      <span className={`text-xs ${effectiveTheme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`}>•</span>
                      <div className="flex items-center space-x-1">
                        {getOSIcon(login.os)}
                        <span className={`text-xs font-medium ${
                          effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                        }`}>
                          {login.os}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Side - Login Details */}
                <div className="text-right space-y-1">
                  {login.location && (
                    <div className={`text-sm font-semibold flex items-center justify-end space-x-1 ${
                      effectiveTheme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                      <MapPin className="h-3 w-3" />
                      <span>{login.location}</span>
                    </div>
                  )}
                  <div className={`text-xs font-mono ${
                    effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    {login.ip}
                  </div>
                  <div className={`text-xs ${
                    effectiveTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    {formatDate(login.login_date)}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
