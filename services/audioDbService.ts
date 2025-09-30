const DB_NAME = 'GuitarSongbookDB';
const STORE_NAME = 'audioTracks';
const DB_VERSION = 1;

let db: IDBDatabase | null = null;

const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (db) {
      return resolve(db);
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error('IndexedDB error:', request.error);
      reject('IndexedDB error');
    };

    request.onsuccess = (event) => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'songId' });
      }
    };
  });
};

export const saveTrack = async (songId: string, audioData: string, fileName: string): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put({ songId, audioData, fileName });

    request.onsuccess = () => resolve();
    request.onerror = () => {
        console.error('Failed to save track:', request.error);
        reject(request.error);
    };
  });
};

export const getTrack = async (songId: string): Promise<{ audioData: string; fileName: string } | null> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(songId);

    request.onsuccess = () => {
      resolve(request.result || null);
    };
    request.onerror = () => {
        console.error('Failed to get track:', request.error);
        reject(request.error);
    };
  });
};

export const deleteTrack = async (songId: string): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(songId);

    request.onsuccess = () => resolve();
    request.onerror = () => {
        console.error('Failed to delete track:', request.error);
        reject(request.error);
    };
  });
};