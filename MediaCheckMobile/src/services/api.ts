import axios from 'axios';
import { Media, UserMedia } from '../types';

const API_URL = 'http://localhost:8000/api/';

// Media API operations
export const getMediaFromAPI = async (): Promise<Media[]> => {
  try {
    const response = await axios.get(`${API_URL}media/`);
    return response.data;
  } catch (error) {
    console.error('Error fetching media from API:', error);
    throw error;
  }
};

export const addMediaToAPI = async (media: Media): Promise<Media> => {
  try {
    const response = await axios.post(`${API_URL}media/`, media);
    return response.data;
  } catch (error) {
    console.error('Error adding media to API:', error);
    throw error;
  }
};

// UserMedia API operations
export const getUserMediaFromAPI = async (): Promise<UserMedia[]> => {
  try {
    const response = await axios.get(`${API_URL}user-media/`);
    return response.data;
  } catch (error) {
    console.error('Error fetching user media from API:', error);
    throw error;
  }
};

export const addUserMediaToAPI = async (userMedia: UserMedia): Promise<UserMedia> => {
  try {
    const response = await axios.post(`${API_URL}user-media/`, userMedia);
    return response.data;
  } catch (error) {
    console.error('Error adding user media to API:', error);
    throw error;
  }
};

export const updateUserMediaInAPI = async (userMedia: UserMedia): Promise<UserMedia> => {
  try {
    const response = await axios.put(`${API_URL}user-media/${userMedia.id}/`, userMedia);
    return response.data;
  } catch (error) {
    console.error('Error updating user media in API:', error);
    throw error;
  }
}; 