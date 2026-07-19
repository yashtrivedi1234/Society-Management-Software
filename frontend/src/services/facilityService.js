import { apiRequest } from './apiClient';
import { isLiveMode } from '../config/appMode';
import * as demo from './demoBackend';

export async function listFacilitiesApi() {
  if (!isLiveMode) return demo.list('facilities');
  const res = await apiRequest('/facilities');
  return res.data || [];
}

export async function listFacilityBookingsApi() {
  if (!isLiveMode) return demo.list('facilityBookings');
  const res = await apiRequest('/facilities/bookings');
  return res.data || [];
}

export async function createFacilityBookingApi(payload) {
  if (!isLiveMode) return demo.create('facilityBookings', { status: 'pending', ...payload }, 'fb');
  const res = await apiRequest('/facilities/bookings', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res.data;
}

export async function updateFacilityBookingStatusApi(id, status) {
  if (!isLiveMode) return demo.update('facilityBookings', id, { status });
  const res = await apiRequest(`/facilities/bookings/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
  return res.data;
}
