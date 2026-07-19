import { apiRequest } from './apiClient';
import { isLiveMode } from '../config/appMode';
import * as demo from './demoBackend';

export const listPollsApi = async () =>
  isLiveMode ? (await apiRequest('/governance/polls')).data || [] : demo.list('polls');
export const createPollApi = async (payload) =>
  isLiveMode
    ? (await apiRequest('/governance/polls', { method: 'POST', body: JSON.stringify(payload) })).data
    : demo.create('polls', { isClosed: false, votes: [], ...payload }, 'poll');
export const votePollApi = async (id, payload) =>
  isLiveMode
    ? (await apiRequest(`/governance/polls/${id}/vote`, { method: 'POST', body: JSON.stringify(payload) })).data
    : demo.votePoll(id, payload);
export const closePollApi = async (id) =>
  isLiveMode ? (await apiRequest(`/governance/polls/${id}/close`, { method: 'PATCH' })).data : demo.closePoll(id);

export const listEventsApi = async () =>
  isLiveMode ? (await apiRequest('/governance/events')).data || [] : demo.list('events');
export const createEventApi = async (payload) =>
  isLiveMode
    ? (await apiRequest('/governance/events', { method: 'POST', body: JSON.stringify(payload) })).data
    : demo.create('events', { rsvps: [], ...payload }, 'ev');
export const rsvpEventApi = async (id, payload) =>
  isLiveMode
    ? (await apiRequest(`/governance/events/${id}/rsvp`, { method: 'POST', body: JSON.stringify(payload) })).data
    : demo.rsvpEvent(id, payload);

export const listAnnouncementsApi = async () =>
  isLiveMode ? (await apiRequest('/governance/announcements')).data || [] : demo.list('announcements');
export const createAnnouncementApi = async (payload) =>
  isLiveMode
    ? (await apiRequest('/governance/announcements', { method: 'POST', body: JSON.stringify(payload) })).data
    : demo.create('announcements', { ...payload }, 'an');

export const escalateComplaintsApi = async () =>
  isLiveMode ? (await apiRequest('/complaints/escalate-overdue', { method: 'POST' })).data : demo.escalateComplaints();
