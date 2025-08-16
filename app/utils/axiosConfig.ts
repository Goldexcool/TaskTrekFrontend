import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Create axios instance
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Only add interceptors on client side - this will be handled by ClientProvider
if (typeof window !== 'undefined') {
  // Client-side only code can go here if needed
}

export default apiClient;