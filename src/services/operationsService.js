import { apiRequest } from './apiClient';
import { isLiveMode } from '../config/appMode';
import * as demo from './demoBackend';

export const listParkingApi = async () =>
  isLiveMode ? (await apiRequest('/operations/parking')).data || [] : demo.list('parking');
export const createParkingApi = async (payload) =>
  isLiveMode
    ? (await apiRequest('/operations/parking', { method: 'POST', body: JSON.stringify(payload) })).data
    : demo.create('parking', { status: 'available', ...payload }, 'pk');

export const listStaffApi = async () =>
  isLiveMode ? (await apiRequest('/operations/staff')).data || [] : demo.list('staff');
export const createStaffApi = async (payload) =>
  isLiveMode
    ? (await apiRequest('/operations/staff', { method: 'POST', body: JSON.stringify(payload) })).data
    : demo.create('staff', { attendanceStatus: 'present', ...payload }, 'st');
export const updateStaffAttendanceApi = async (id, payload) =>
  isLiveMode
    ? (await apiRequest(`/operations/staff/${id}/attendance`, { method: 'PATCH', body: JSON.stringify(payload) })).data
    : demo.update('staff', id, payload);

export const listParcelsApi = async () =>
  isLiveMode ? (await apiRequest('/operations/parcels')).data || [] : demo.list('parcels');
export const createParcelApi = async (payload) =>
  isLiveMode
    ? (await apiRequest('/operations/parcels', { method: 'POST', body: JSON.stringify(payload) })).data
    : demo.create('parcels', { status: 'received', ...payload }, 'pc');
export const markParcelDeliveredApi = async (id) =>
  isLiveMode
    ? (await apiRequest(`/operations/parcels/${id}/delivered`, { method: 'PATCH' })).data
    : demo.update('parcels', id, { status: 'delivered', deliveredAt: new Date().toISOString() });

export const listDocumentsApi = async () =>
  isLiveMode ? (await apiRequest('/operations/documents')).data || [] : demo.list('documents');
export const createDocumentApi = async (payload) =>
  isLiveMode
    ? (await apiRequest('/operations/documents', { method: 'POST', body: JSON.stringify(payload) })).data
    : demo.create('documents', { visibility: 'members', ...payload }, 'doc');

export const listEmergencyAlertsApi = async () =>
  isLiveMode ? (await apiRequest('/operations/emergency-alerts')).data || [] : demo.list('emergencyAlerts');
export const createEmergencyAlertApi = async (payload) =>
  isLiveMode
    ? (await apiRequest('/operations/emergency-alerts', { method: 'POST', body: JSON.stringify(payload) })).data
    : demo.create('emergencyAlerts', { status: 'open', ...payload }, 'em');
export const updateEmergencyStatusApi = async (id, payload) =>
  isLiveMode
    ? (await apiRequest(`/operations/emergency-alerts/${id}/status`, { method: 'PATCH', body: JSON.stringify(payload) })).data
    : demo.update('emergencyAlerts', id, payload);
