import axios from 'axios';

// Create an Axios instance with a base URL and cookie support
const api = axios.create({
  baseURL: '/api', // Your backend API's base URL
  withCredentials: true, // Crucial: allows Axios to send and receive httpOnly cookies
});

/**
 * You can also add your interceptors here directly if you prefer,
 * or you can add them in your AuthContext as shown previously.
 * For example:
 * * api.interceptors.request.use(config => {
 * // This is where you would get the accessToken from your state manager
 * // const token = useAuthStore.getState().accessToken; 
 * // if (token) {
 * //   config.headers.Authorization = `Bearer ${token}`;
 * // }
 * return config;
 * });
 */

export default api;