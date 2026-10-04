// Base API URL: Uses environment variable in production (Vercel) or defaults to local proxy
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
