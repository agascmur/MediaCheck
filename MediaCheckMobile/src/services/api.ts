import { Media, UserMedia } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  getCurrentUser, 
  saveUser,
  getMedia,
  getUserMedia,
  addMedia,
  addUserMedia,
  updateUserMedia,
  deleteMedia
} from './database';

// Using the computer's IP address instead of localhost
const API_URL = 'http://192.168.1.155:8000';

// Helper function to check if we're online
const isOnline = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${API_URL}/health/`);
    return response.ok;
  } catch {
    return false;
  }
};

// Auth operations
export const register = async (username: string, password: string): Promise<void> => {
  if (!await isOnline()) {
    // Generate a temporary token for offline use
    const tempToken = `offline_${Date.now()}`;
    // Store the user as offline with their password
    await saveUser(username, tempToken, password, true);
    return;
  }
  const response = await fetch(`${API_URL}/register/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({ username, password })
  });
  if (!response.ok) {
    throw new Error('Registration failed');
  }
  return response.json();
};

export const login = async (username: string, password: string): Promise<string> => {
  if (!await isOnline()) {
    const user = await getCurrentUser();
    if (user && user.username === username) {
      return user.token;
    }
    throw new Error('Network error: Backend is unreachable');
  }
  const response = await fetch(`${API_URL}/api-token-auth/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({ username, password })
  });
  if (!response.ok) {
    throw new Error('Login failed');
  }
  const data = await response.json();
  return data.token;
};

// Media operations
export const getMediaFromAPI = async (): Promise<Media[]> => {
  if (!await isOnline()) {
    return getMedia();
  }
  const token = await AsyncStorage.getItem('userToken');
  const response = await fetch(`${API_URL}/api/media/`, {
    headers: {
      'Authorization': `Token ${token}`,
      'Accept': 'application/json'
    }
  });
  if (!response.ok) {
    throw new Error('Failed to fetch media');
  }
  return response.json();
};

export const addMediaToAPI = async (media: Media): Promise<Media> => {
  if (!await isOnline()) {
    await addMedia(media);
    return media;
  }
  const token = await AsyncStorage.getItem('userToken');
  const response = await fetch(`${API_URL}/api/media/`, {
    method: 'POST',
    headers: {
      'Authorization': `Token ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify(media)
  });
  if (!response.ok) {
    throw new Error('Failed to add media');
  }
  return response.json();
};

export const deleteMediaFromAPI = async (mediaId: number): Promise<void> => {
  if (!await isOnline()) {
    await deleteMedia(mediaId);
    return;
  }
  const token = await AsyncStorage.getItem('userToken');
  const response = await fetch(`${API_URL}/api/media/${mediaId}/`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Token ${token}`
    }
  });
  if (!response.ok) {
    throw new Error('Failed to delete media');
  }
};

// UserMedia operations
export const getUserMediaFromAPI = async (): Promise<UserMedia[]> => {
  if (!await isOnline()) {
    return getUserMedia();
  }
  const token = await AsyncStorage.getItem('userToken');
  const response = await fetch(`${API_URL}/api/user-media/`, {
    headers: {
      'Authorization': `Token ${token}`,
      'Accept': 'application/json'
    }
  });
  if (!response.ok) {
    throw new Error('Failed to fetch user media');
  }
  return response.json();
};

export const addUserMediaToAPI = async (userMedia: UserMedia): Promise<UserMedia> => {
  if (!await isOnline()) {
    await addUserMedia(userMedia);
    return userMedia;
  }
  const token = await AsyncStorage.getItem('userToken');
  const response = await fetch(`${API_URL}/api/user-media/`, {
    method: 'POST',
    headers: {
      'Authorization': `Token ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify(userMedia)
  });
  if (!response.ok) {
    throw new Error('Failed to add user media');
  }
  return response.json();
};

export const updateUserMediaInAPI = async (userMedia: UserMedia): Promise<UserMedia> => {
  if (!await isOnline()) {
    await updateUserMedia(userMedia);
    return userMedia;
  }
  const token = await AsyncStorage.getItem('userToken');
  const response = await fetch(`${API_URL}/api/user-media/${userMedia.id}/`, {
    method: 'PUT',
    headers: {
      'Authorization': `Token ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify(userMedia)
  });
  if (!response.ok) {
    throw new Error('Failed to update user media');
  }
  return response.json();
};

export const deleteUserMediaFromAPI = async (userMediaId: number): Promise<void> => {
  if (!await isOnline()) {
    await deleteMedia(userMediaId);
    return;
  }
  const token = await AsyncStorage.getItem('userToken');
  const response = await fetch(`${API_URL}/api/user-media/${userMediaId}/`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Token ${token}`
    }
  });
  if (!response.ok) {
    throw new Error('Failed to delete user media');
  }
}; 