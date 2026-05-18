import api from './axiosInstance';

export interface DeviceLoginRecord {
  id: number;
  email: string;
  browser: string;
  os: string;
  device: string;
  login_date: string;
  ip: string;
  location?: string;
}

export interface DeviceManagementResponse {
  success: boolean;
  data: DeviceLoginRecord[];
}

// Get device login history for the authenticated user
export const getDeviceLoginHistory = () =>
  api.get<DeviceManagementResponse>('/api/device-management/history');

// Delete a specific device login record
export const deleteDeviceLoginRecord = (recordId: number) =>
  api.delete(`/api/device-management/record/${recordId}`);

// Record a device login (called from client-side)
export const recordDeviceLogin = (clientIP?: string) =>
  api.post('/api/device-management/record', { clientIP });

