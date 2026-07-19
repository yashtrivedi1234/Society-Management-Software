import { apiRequest } from './apiClient';
import { isLiveMode } from '../config/appMode';
import * as demo from './demoBackend';

export const getProductSettingsApi = async () =>
  isLiveMode ? (await apiRequest('/product/settings')).data : demo.getSettings();
export const updateProductSettingsApi = async (payload) =>
  isLiveMode
    ? (await apiRequest('/product/settings', { method: 'PATCH', body: JSON.stringify(payload) })).data
    : demo.updateSettings(payload);

export const registerDeviceTokenApi = async (payload) =>
  isLiveMode
    ? (await apiRequest('/product/device-tokens', { method: 'POST', body: JSON.stringify(payload) })).data
    : demo.registerDeviceToken(payload);

export const listBackupsApi = async () =>
  isLiveMode ? (await apiRequest('/product/backups')).data || [] : demo.list('backups');
export const triggerBackupApi = async (payload = {}) =>
  isLiveMode
    ? (await apiRequest('/product/backups/trigger', { method: 'POST', body: JSON.stringify(payload) })).data
    : demo.triggerBackup(payload);
