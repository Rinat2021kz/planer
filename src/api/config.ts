// API configuration

import { Capacitor } from '@capacitor/core';

/**
 * Get the base API URL based on the environment
 * - If VITE_API_BASE_URL is set in env, use it
 * - For native mobile apps (Capacitor), use full domain
 * - For web builds, use relative path
 */
const getApiBaseUrl = (): string => {
  const baseUrl = import.meta.env.VITE_API_BASE_URL;
  
  // If VITE_API_BASE_URL is explicitly set, use it
  if (baseUrl) {
    return baseUrl;
  }
  
  // For native mobile apps, use the full domain
  if (Capacitor.isNativePlatform()) {
    return 'https://planer.gassimov2014.workers.dev';
  }
  
  // For web builds, use relative path
  return '';
};

export const API_BASE_URL = getApiBaseUrl();

// Helper to get auth token from localStorage
export const getAuthToken = (): string | null => {
  return localStorage.getItem('firebaseToken');
};

interface FetchOptions extends RequestInit {
  skipAuth?: boolean;
  unwrapResponse?: boolean;
}

// Helper to make authenticated requests
export const fetchWithAuth = async (url: string, options: FetchOptions = {}) => {
  const token = getAuthToken();
  
  if (!token && !options.skipAuth) {
    throw new Error('No authentication token found');
  }

  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && !options.skipAuth ? { 'Authorization': `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || error.message || `HTTP ${response.status}`);
  }

  return response.json();
};


