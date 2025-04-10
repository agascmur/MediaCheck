import * as SQLite from 'expo-sqlite';
import { Media, UserMedia, MediaWithUserData, MediaState } from '../types';

type SQLiteBindParams = (string | number | null | Uint8Array)[];

const db = SQLite.openDatabaseSync('media.db');

// Initialize database
export const initDatabase = async (): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.execAsync(
      `DROP TABLE IF EXISTS user_media;
       DROP TABLE IF EXISTS media;
       CREATE TABLE IF NOT EXISTS media (
         id INTEGER PRIMARY KEY,  -- Use server's ID as primary key
         title TEXT NOT NULL,
         media_type TEXT NOT NULL,
         plot TEXT,
         chapters TEXT,
         quotes TEXT,
         created_at TEXT
       );
       CREATE TABLE IF NOT EXISTS user_media (
         id INTEGER PRIMARY KEY,  -- Use server's ID as primary key
         media_id INTEGER NOT NULL,
         state INTEGER,
         score INTEGER,
         updated_at TEXT,
         FOREIGN KEY (media_id) REFERENCES media (id)
       );`
    ).then(() => resolve()).catch(reject);
  });
};

// Media operations
export const getMedia = async (): Promise<Media[]> => {
  return new Promise((resolve, reject) => {
    db.getAllAsync<Media>('SELECT * FROM media;', []).then(resolve).catch(reject);
  });
};

export const addMedia = async (media: Media): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      // Ensure we have a valid ID
      if (!media.id) {
        reject(new Error('Media ID is required'));
        return;
      }
      
      db.runAsync(
        `INSERT INTO media (id, title, media_type, plot, chapters, quotes, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?);`,
        [
          media.id,  // Use server's ID directly
          media.title,
          media.media_type,
          media.plot ?? null,
          media.chapters ?? null,
          media.quotes ? JSON.stringify(media.quotes) : null,
          media.created_at ?? new Date().toISOString()
        ] as SQLiteBindParams
      ).then(() => {
        console.log('Media added successfully:', media);
        resolve();
      }).catch((error) => {
        console.error('Error adding media to database:', error);
        reject(error);
      });
    } catch (error) {
      console.error('Error in addMedia:', error);
      reject(error);
    }
  });
};

// UserMedia operations
export const getUserMedia = async (): Promise<UserMedia[]> => {
  return new Promise((resolve, reject) => {
    db.getAllAsync<UserMedia>('SELECT * FROM user_media;', []).then(resolve).catch(reject);
  });
};

export const addUserMedia = async (userMedia: UserMedia): Promise<void> => {
  return new Promise((resolve, reject) => {
    const currentTime = new Date().toISOString();
    
    // Ensure we have valid IDs
    if (!userMedia.id || !userMedia.media_id) {
      reject(new Error('User Media ID and Media ID are required'));
      return;
    }
    
    // Insert the user media with the media_id
    db.runAsync(
      `INSERT INTO user_media (id, media_id, state, score, updated_at)
       VALUES (?, ?, ?, ?, ?);`,
      [
        userMedia.id,  // Use server's ID directly
        userMedia.media_id,  // Use server's media_id directly
        userMedia.state !== undefined ? Number(userMedia.state) : null,
        userMedia.score !== undefined ? Number(userMedia.score) : null,
        currentTime
      ] as SQLiteBindParams
    ).then(() => {
      console.log('User media added successfully');
      resolve();
    }).catch((error) => {
      console.error('Error in addUserMedia:', error);
      reject(error);
    });
  });
};

export const updateUserMedia = async (userMedia: UserMedia): Promise<void> => {
  return new Promise((resolve, reject) => {
    const currentTime = new Date().toISOString();
    
    // Ensure we have a valid ID
    if (!userMedia.id) {
      reject(new Error('User Media ID is required'));
      return;
    }
    
    db.runAsync(
      `UPDATE user_media 
       SET state = ?, score = ?, updated_at = ?
       WHERE id = ?;`,  // Use id instead of media_id
      [
        userMedia.state !== undefined ? Number(userMedia.state) : null,
        userMedia.score !== undefined ? Number(userMedia.score) : null,
        currentTime,  // Always update the timestamp
        userMedia.id  // Use the user media's ID
      ] as SQLiteBindParams
    ).then(() => {
      console.log('User media updated successfully');
      resolve();
    }).catch((error) => {
      console.error('Error updating user media:', error);
      reject(error);
    });
  });
};

// Combined operations
export const getMediaWithUserData = async (): Promise<MediaWithUserData[]> => {
  return new Promise((resolve, reject) => {
    // First get all media
    db.getAllAsync<Media>(
      `SELECT * FROM media;`,
      [] as SQLiteBindParams
    ).then((mediaResults) => {
      if (!mediaResults || mediaResults.length === 0) {
        resolve([]);
        return;
      }
      
      // Then get all user media
      db.getAllAsync<UserMedia>(
        `SELECT * FROM user_media;`,
        [] as SQLiteBindParams
      ).then((userMediaResults) => {
        // Combine the results
        const combinedResults = mediaResults.map(media => {
          const userMedia = userMediaResults.find(um => um.media_id === media.id);
          return {
            ...media,
            quotes: typeof media.quotes === 'string' ? JSON.parse(media.quotes) : media.quotes,
            userState: userMedia?.state,
            userScore: userMedia?.score
          };
        });
        
        console.log('Media with user data:', combinedResults);
        resolve(combinedResults);
      }).catch(reject);
    }).catch(reject);
  });
};

export const deleteMedia = async (id: number): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.runAsync(
      `DELETE FROM media WHERE id = ?;`,  // Use id instead of server_id
      [id]
    ).then(() => {
      console.log('Media deleted successfully from local database');
      resolve();
    }).catch((error) => {
      console.error('Error deleting media from local database:', error);
      reject(error);
    });
  });
}; 