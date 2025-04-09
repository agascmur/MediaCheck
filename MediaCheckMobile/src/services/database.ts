import SQLite from 'react-native-sqlite-storage';
import { Media, UserMedia, MediaType, MediaState, MediaWithUserData } from '../types';

// Open the database
const db = SQLite.openDatabase(
  {
    name: 'MediaCheckDB',
    location: 'default',
  },
  () => {
    console.log('Database opened successfully');
    initializeDatabase();
  },
  (error: any) => {
    console.error('Error opening database:', error);
  }
);

// Initialize database tables
const initializeDatabase = () => {
  db.transaction((tx: any) => {
    // Create Media table
    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS media (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        media_type TEXT NOT NULL,
        url TEXT,
        plot TEXT,
        chapters TEXT,
        quotes TEXT,
        score REAL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`
    );

    // Create UserMedia table
    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS user_media (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        media_id INTEGER,
        state INTEGER DEFAULT 0,
        score REAL,
        added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (media_id) REFERENCES media(id)
      )`
    );
  });
};

// Media operations
export const addMedia = (media: Media): Promise<number> => {
  return new Promise((resolve, reject) => {
    db.transaction((tx: any) => {
      tx.executeSql(
        `INSERT INTO media (title, media_type, url, plot, chapters, quotes, score)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          media.title,
          media.media_type,
          media.url || null,
          media.plot || null,
          media.chapters || null,
          media.quotes ? JSON.stringify(media.quotes) : null,
          media.score || null,
        ],
        (_: any, result: any) => {
          resolve(result.insertId);
        },
        (_: any, error: any) => {
          reject(error);
          return false;
        }
      );
    });
  });
};

export const getMedia = (): Promise<Media[]> => {
  return new Promise((resolve, reject) => {
    db.transaction((tx: any) => {
      tx.executeSql(
        'SELECT * FROM media ORDER BY created_at DESC',
        [],
        (_: any, result: any) => {
          const mediaList: Media[] = [];
          for (let i = 0; i < result.rows.length; i++) {
            const media = result.rows.item(i);
            media.quotes = media.quotes ? JSON.parse(media.quotes) : [];
            mediaList.push(media);
          }
          resolve(mediaList);
        },
        (_: any, error: any) => {
          reject(error);
          return false;
        }
      );
    });
  });
};

// UserMedia operations
export const addUserMedia = (userMedia: UserMedia): Promise<number> => {
  return new Promise((resolve, reject) => {
    db.transaction((tx: any) => {
      tx.executeSql(
        `INSERT INTO user_media (media_id, state, score)
         VALUES (?, ?, ?)`,
        [userMedia.media_id, userMedia.state, userMedia.score || null],
        (_: any, result: any) => {
          resolve(result.insertId);
        },
        (_: any, error: any) => {
          reject(error);
          return false;
        }
      );
    });
  });
};

export const updateUserMedia = (userMedia: UserMedia): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.transaction((tx: any) => {
      tx.executeSql(
        `UPDATE user_media 
         SET state = ?, score = ?, updated_at = CURRENT_TIMESTAMP
         WHERE media_id = ?`,
        [userMedia.state, userMedia.score || null, userMedia.media_id],
        () => {
          resolve();
        },
        (_: any, error: any) => {
          reject(error);
          return false;
        }
      );
    });
  });
};

export const getUserMedia = (): Promise<UserMedia[]> => {
  return new Promise((resolve, reject) => {
    db.transaction((tx: any) => {
      tx.executeSql(
        'SELECT * FROM user_media ORDER BY updated_at DESC',
        [],
        (_: any, result: any) => {
          const userMediaList: UserMedia[] = [];
          for (let i = 0; i < result.rows.length; i++) {
            userMediaList.push(result.rows.item(i));
          }
          resolve(userMediaList);
        },
        (_: any, error: any) => {
          reject(error);
          return false;
        }
      );
    });
  });
};

export const getMediaWithUserData = (): Promise<MediaWithUserData[]> => {
  return new Promise((resolve, reject) => {
    db.transaction((tx: any) => {
      tx.executeSql(
        `SELECT m.*, um.state as userState, um.score as userScore
         FROM media m
         LEFT JOIN user_media um ON m.id = um.media_id
         ORDER BY m.created_at DESC`,
        [],
        (_: any, result: any) => {
          const mediaList: MediaWithUserData[] = [];
          for (let i = 0; i < result.rows.length; i++) {
            const media = result.rows.item(i);
            media.quotes = media.quotes ? JSON.parse(media.quotes) : [];
            mediaList.push(media);
          }
          resolve(mediaList);
        },
        (_: any, error: any) => {
          reject(error);
          return false;
        }
      );
    });
  });
}; 