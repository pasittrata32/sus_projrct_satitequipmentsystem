import { User, Booking, UserRole } from '../types';

// ===================================================================================
// สำคัญมาก! โปรดนำ URL ของ Web App ที่ได้จากการ Deploy ในขั้นตอนที่ 2 มาวางที่นี่
// IMPORTANT! Paste your deployed Google Apps Script Web App URL here.
// ===================================================================================
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxJ63RFmuy7W1rbz4Iy-vO9a6-hXkTPT_DlRAcFvrAUr0RSWQZhcWKkxgs6Zymg-4BJMg/exec'; 
// ===================================================================================


/**
 * A helper function to handle fetch requests to the Google Apps Script backend.
 * It now uses POST for all requests to ensure consistency and avoid CORS issues.
 * @param url The base URL of the script.
 * @param action The specific function to call in the script.
 * @param payload The data to send.
 * @returns The data from the script's response.
 */
async function fetchFromScript(url: string, action: string, payload?: any) {
  const response = await fetch(url, {
    method: 'POST',
    body: JSON.stringify({ action, payload: payload || null }),
    headers: {
      'Content-Type': 'text/plain;charset=utf-8', // Use text/plain for CORS simplicity with Apps Script
    },
    mode: 'cors',
    redirect: 'follow', // Explicitly follow redirects
    cache: 'no-cache', // Force fetch to ignore cache and get fresh data
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API request failed with status ${response.status}: ${errorText || response.statusText}`);
  }

  const result = await response.json();

  if (result.status === 'success') {
    return result.data;
  } else {
    throw new Error(result.message || 'An unknown error occurred with the API script.');
  }
}

const api = {
  login: (username: string, password?: string): Promise<User | null> => {
    return fetchFromScript(SCRIPT_URL, 'login', { username, password });
  },

  getUsers: (): Promise<User[]> => {
    return fetchFromScript(SCRIPT_URL, 'getUsers');
  },
  
  addUser: (name: string, username: string, role: UserRole, password: string): Promise<User> => {
    return fetchFromScript(SCRIPT_URL, 'addUser', { name, username, role, password });
  },

  updateUser: (id: number, name: string, role: UserRole): Promise<User> => {
     return fetchFromScript(SCRIPT_URL, 'updateUser', { id, name, role });
  },

  deleteUser: (id: number): Promise<void> => {
    return fetchFromScript(SCRIPT_URL, 'deleteUser', { id });
  },

  getBookings: (): Promise<Booking[]> => {
    return fetchFromScript(SCRIPT_URL, 'getBookings');
  },

  createBooking: (bookingData: Omit<Booking, 'id' | 'status' | 'createdAt'>): Promise<Booking> => {
    return fetchFromScript(SCRIPT_URL, 'createBooking', bookingData);
  },

  updateBookingStatus: (id: number, status: Booking['status']): Promise<Booking> => {
     return fetchFromScript(SCRIPT_URL, 'updateBookingStatus', { id, status });
  },

  deleteBooking: (id: number): Promise<void> => {
    return fetchFromScript(SCRIPT_URL, 'deleteBooking', { id });
  },
};

export default api;