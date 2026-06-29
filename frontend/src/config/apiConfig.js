/**
 * ResQ Shared API Configuration
 * Single source of truth for all API and Socket URLs across the frontend.
 */

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const SOCKET_URL = API_BASE_URL.replace('/api', '');
