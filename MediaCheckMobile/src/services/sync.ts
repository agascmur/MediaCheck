import AsyncStorage from '@react-native-async-storage/async-storage';
import { Media, UserMedia } from '../types';
import * as database from './database';
import * as api from './api';

const LAST_SYNC_KEY = 'last_sync_timestamp';

export const syncData = async (): Promise<void> => {
  try {
    // Get last sync timestamp
    const lastSync = await AsyncStorage.getItem(LAST_SYNC_KEY);
    const lastSyncTime = lastSync ? new Date(lastSync) : new Date(0);

    try {
      // Try to sync with API
      await syncOfflineUsers();
      await syncMedia(lastSyncTime);
      await syncUserMedia(lastSyncTime);
      // Update last sync timestamp only if sync was successful
      await AsyncStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
    } catch (error) {
      console.warn('API sync failed, using local data:', error);
      // Don't throw error, just use local data
    }
  } catch (error) {
    console.error('Error during sync:', error);
    // Don't throw error, just use local data
  }
};

const syncOfflineUsers = async (): Promise<void> => {
  try {
    // Get all offline users
    const offlineUsers = await database.getOfflineUsers();
    
    // For each offline user, we need to prompt them to re-enter their password
    // This is because we don't store passwords for offline users
    for (const user of offlineUsers) {
      try {
        // Here we would typically show a dialog to the user asking for their password
        // For now, we'll just log that we need to handle this
        console.log(`Need to handle offline user ${user.username} - prompt for password`);
        // Once we have the password, we can:
        // 1. Register the user with the backend
        // 2. Update their status to online
        // 3. Sync their data
      } catch (error) {
        console.warn(`Failed to sync offline user ${user.username}:`, error);
      }
    }
  } catch (error) {
    console.warn('Error syncing offline users:', error);
    throw error;
  }
};

const syncMedia = async (lastSyncTime: Date): Promise<void> => {
  try {
    // Get media from API
    const apiMedia = await api.getMediaFromAPI();
    
    // Get local media
    const localMedia = await database.getMedia();

    // Create a map of local media by ID
    const localMediaMap = new Map(localMedia.map(media => [media.id, media]));

    // Process each media item from API
    for (const media of apiMedia) {
      const localMedia = localMediaMap.get(media.id);
      
      if (!localMedia) {
        // New media from API, add to local database
        await database.addMedia(media);
      } else if (media.created_at && new Date(media.created_at) > lastSyncTime) {
        // Media updated on API, update local database
        // Note: You'll need to implement an updateMedia function in database.ts
        // await database.updateMedia(media);
      }
    }
  } catch (error) {
    console.warn('Error syncing media:', error);
    throw error; // Let the caller handle this
  }
};

const syncUserMedia = async (lastSyncTime: Date): Promise<void> => {
  try {
    // Get user media from API
    const apiUserMedia = await api.getUserMediaFromAPI();
    
    // Get local user media
    const localUserMedia = await database.getUserMedia();

    // Create a map of local user media by media_id
    const localUserMediaMap = new Map(localUserMedia.map(um => [um.media_id, um]));

    // Process each user media item from API
    for (const userMedia of apiUserMedia) {
      if (!userMedia.media_id) {
        console.warn('Skipping user media with missing media_id:', userMedia);
        continue;
      }

      const localUserMedia = localUserMediaMap.get(userMedia.media_id);
      
      if (!localUserMedia) {
        // New user media from API, add to local database
        await database.addUserMedia({
          id: userMedia.id,
          media_id: userMedia.media_id,
          state: userMedia.state,
          score: userMedia.score,
          updated_at: userMedia.updated_at
        });
      } else if (userMedia.updated_at && new Date(userMedia.updated_at) > lastSyncTime) {
        // User media updated on API, update local database
        await database.updateUserMedia({
          id: userMedia.id,
          media_id: userMedia.media_id,
          state: userMedia.state,
          score: userMedia.score,
          updated_at: userMedia.updated_at
        });
      }
    }
  } catch (error) {
    console.warn('Error syncing user media:', error);
    throw error; // Let the caller handle this
  }
};

export const pushLocalChanges = async (): Promise<void> => {
  try {
    // Get last sync timestamp
    const lastSync = await AsyncStorage.getItem(LAST_SYNC_KEY);
    const lastSyncTime = lastSync ? new Date(lastSync) : new Date(0);
    
    // Get local user media
    const localUserMedia = await database.getUserMedia();

    // Only push user media that has been updated since last sync
    for (const userMedia of localUserMedia) {
      if (!userMedia.media_id) {
        console.warn('Skipping user media with missing media_id:', userMedia);
        continue;
      }

      if (userMedia.updated_at && new Date(userMedia.updated_at) > lastSyncTime) {
        try {
          if (userMedia.id) {
            await api.updateUserMediaInAPI({
              id: userMedia.id,
              media_id: userMedia.media_id,
              state: userMedia.state,
              score: userMedia.score,
              updated_at: userMedia.updated_at
            });
          } else {
            await api.addUserMediaToAPI({
              media_id: userMedia.media_id,
              state: userMedia.state,
              score: userMedia.score,
              updated_at: userMedia.updated_at
            });
          }
        } catch (error) {
          console.warn(`Error pushing user media ${userMedia.id} to API:`, error);
        }
      }
    }

    // Update last sync timestamp
    await AsyncStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
  } catch (error) {
    console.warn('Error pushing local changes:', error);
    // Don't throw error, just log it
  }
}; 