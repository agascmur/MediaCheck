import axios from 'axios';
import { Media, UserMedia } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Using the computer's IP address instead of localhost
const API_URL = 'http://192.168.1.155:8000';

// Create axios instance with default config for authenticated requests
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('userToken');
  if (token) {
    config.headers.Authorization = `Token ${token}`;
  }
  return config;
});

// Helper function for unauthenticated requests
const makeUnauthenticatedRequest = async (method: 'post' | 'get', endpoint: string, data?: any) => {
  return axios({
    method,
    url: `${API_URL}/${endpoint}`,
    data,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  });
};

// Auth operations
export const register = async (username: string, password: string): Promise<void> => {
  try {
    await makeUnauthenticatedRequest('post', 'register/', { username, password });
  } catch (error) {
    console.error('Error registering user:', error);
    throw error;
  }
};

export const login = async (username: string, password: string): Promise<string> => {
  try {
    const response = await makeUnauthenticatedRequest('post', 'api-token-auth/', { username, password });
    return response.data.token;
  } catch (error) {
    console.error('Error logging in:', error);
    throw error;
  }
};

// Media API operations
export const getMediaFromAPI = async (): Promise<Media[]> => {
  try {
    const response = await api.get('api/media/');
    console.log('API Response - Media:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Error fetching media from API:', error);
    console.error('Error details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    throw error;
  }
};

export const addMediaToAPI = async (media: Media): Promise<Media> => {
  try {
    const response = await api.post('api/media/', media);
    return response.data;
  } catch (error) {
    console.error('Error adding media to API:', error);
    throw error;
  }
};

export const deleteMediaFromAPI = async (mediaId: number): Promise<void> => {
  try {
    await api.delete(`api/media/${mediaId}/`);
  } catch (error) {
    console.error('Error deleting media from API:', error);
    throw error;
  }
};

// UserMedia API operations
export const getUserMediaFromAPI = async (): Promise<UserMedia[]> => {
  try {
    const response = await api.get('api/user-media/');
    console.log('API Response - User Media:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Error fetching user media from API:', error);
    console.error('Error details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    throw error;
  }
};

export const addUserMediaToAPI = async (userMedia: UserMedia): Promise<UserMedia> => {
  try {
    const response = await api.post('api/user-media/', userMedia);
    return response.data;
  } catch (error) {
    console.error('Error adding user media to API:', error);
    throw error;
  }
};

export const updateUserMediaInAPI = async (userMedia: UserMedia): Promise<UserMedia> => {
  try {
    const response = await api.put(`api/user-media/${userMedia.id}/`, userMedia);
    return response.data;
  } catch (error) {
    console.error('Error updating user media in API:', error);
    throw error;
  }
}; 