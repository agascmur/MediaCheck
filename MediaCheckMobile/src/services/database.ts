import * as SQLite from 'expo-sqlite';
import { Media, UserMedia, MediaWithUserData, MediaState } from '../types';

const db = SQLite.openDatabaseSync('media.db');

// Initialize database
export const initDatabase = async (): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.execAsync(
      `CREATE TABLE IF NOT EXISTS media (
        id INTEGER PRIMARY KEY,
        title TEXT NOT NULL,
        media_type TEXT NOT NULL,
        plot TEXT,
        chapters TEXT,
        quotes TEXT,
        created_at TEXT
      );
      CREATE TABLE IF NOT EXISTS user_media (
        id INTEGER PRIMARY KEY,
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
      db.runAsync(
        `INSERT INTO media (id, title, media_type, plot, chapters, quotes, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?);`,
        [
          media.id ?? null,
          media.title,
          media.media_type,
          media.plot ?? null,
          media.chapters ?? null,
          media.quotes ? JSON.stringify(media.quotes) : null,
          media.created_at ?? new Date().toISOString()
        ]
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
    db.runAsync(
      `INSERT INTO user_media (media_id, state, score, updated_at)
       VALUES (?, ?, ?, ?);`,
      [
        userMedia.media_id,
        userMedia.state !== undefined ? Number(userMedia.state) : null,
        userMedia.score !== undefined ? Number(userMedia.score) : null,
        currentTime  // Always set the current time for new entries
      ]
    ).then(() => resolve()).catch(reject);
  });
};

export const updateUserMedia = async (userMedia: UserMedia): Promise<void> => {
  return new Promise((resolve, reject) => {
    const currentTime = new Date().toISOString();
    db.runAsync(
      `UPDATE user_media 
       SET state = ?, score = ?, updated_at = ?
       WHERE media_id = ?;`,
      [
        userMedia.state !== undefined ? Number(userMedia.state) : null,
        userMedia.score !== undefined ? Number(userMedia.score) : null,
        currentTime,  // Always update the timestamp
        userMedia.media_id
      ]
    ).then(() => resolve()).catch(reject);
  });
};

// Combined operations
export const getMediaWithUserData = async (): Promise<MediaWithUserData[]> => {
  return new Promise((resolve, reject) => {
    db.getAllAsync<any>(
      `SELECT m.*, um.state as userState, um.score as userScore
       FROM media m
       LEFT JOIN user_media um ON m.id = um.media_id;`,
      []
    ).then((results) => {
      const formattedResults = results.map((item) => ({
        ...item,
        quotes: item.quotes ? JSON.parse(item.quotes) : null,
        userState: item.userState !== null ? Number(item.userState) : undefined,
        userScore: item.userScore !== null ? Number(item.userScore) : undefined
      }));
      resolve(formattedResults);
    }).catch(reject);
  });
}; 