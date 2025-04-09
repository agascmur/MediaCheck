import axios from 'axios';

const API_URL = 'http://192.168.1.39:8000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if it exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Token ${token}`;
  }
  return config;
});

export const login = async (username: string, password: string) => {
  try {
    const response = await axios.post(`${API_URL}/media/api-token-auth/`, {
      username,
      password,
    });
    localStorage.setItem('token', response.data.token);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const register = async (username: string, password: string) => {
  try {
    const response = await axios.post(`${API_URL}/media/register/`, {
      username,
      password,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export default api; 